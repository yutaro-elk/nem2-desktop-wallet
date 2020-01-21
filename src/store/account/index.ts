import Vue from 'vue'
import {MutationTree, ActionTree} from 'vuex'
import {getters} from '@/store/account/accountGetters.ts'
import {defaultNetworkConfig} from '@/config/index'
import {
  AddressAndNamespaces, AddressAndMosaics,
  AddressAndMultisigGraphInfo, StoreAccount,
  AppMosaic, NetworkCurrency, AppWallet,
  AppNamespace, FormattedTransaction,
  CurrentAccount, Balances, AppState,
} from '@/core/model'
import {localRead, localSave} from '@/core/utils'
import {NetworkType, AccountHttp, Address} from 'nem2-sdk'
import {BalancesService} from '@/core/services/mosaics/BalancesService'

const state: StoreAccount = {
  wallet: null,
  activeMultisigAccount: null,
  balances: {},
  mosaics: {},
  namespaces: [],
  transactionList: [],
  transactionsToCosign: [],
  temporaryLoginInfo: {
    password: null,
    mnemonic: null,
  },

  // Properties to move out
  currentAccount: CurrentAccount.default(),
  multisigAccountsMosaics: {},
  multisigAccountsNamespaces: {},
  multisigAccountsTransactions: {},
  multisigAccountGraphInfo: {},
  networkCurrency: defaultNetworkConfig.defaultNetworkMosaic,
  networkMosaics: {},
  node: '',
}

const updateMosaics = (state: StoreAccount, mosaics: AppMosaic[]) => {
  if (!mosaics) return // @TODO: quick fix
  mosaics.forEach((mosaic: AppMosaic) => {
    const {hex} = mosaic
    const storeMosaic = state.mosaics[hex] || {}
    Vue.set(state.mosaics, hex, {...storeMosaic, ...mosaic})
  })
}

const popTransactionToCosignByHash = (
  oldTransactions: FormattedTransaction[],
  hash: string,
): FormattedTransaction[] => {
  const transactionIndex = oldTransactions.findIndex(({rawTx}) => rawTx.transactionInfo.hash === hash)
  oldTransactions.splice(transactionIndex, 1)
  return oldTransactions
}

const mutations: MutationTree<StoreAccount> = {
  RESET_ACCOUNT(state: StoreAccount) {
    state.wallet = null
    state.mosaics = {}
    state.namespaces = []
    state.transactionList = []
    state.currentAccount = CurrentAccount.default()
  },
  SET_WALLET(state: StoreAccount, wallet: AppWallet): void {
    const {currentAccount} = state
    AppWallet.updateActiveWalletAddress(wallet.address, currentAccount.name)
    state.wallet = wallet
  },
  SET_MOSAICS(state: StoreAccount, mosaics: Record<string, AppMosaic>): void {
    state.mosaics = mosaics
  },
  SET_NETWORK_MOSAICS(state: StoreAccount, mosaics: AppMosaic[]): void {
    state.networkMosaics = {}
    // eslint-disable-next-line no-return-assign
    mosaics.forEach(mosaic => state.networkMosaics[mosaic.hex] = mosaic)
  },
  UPDATE_MOSAICS(state: StoreAccount, mosaics: AppMosaic[]): void {
    updateMosaics(state, mosaics)
  },
  /**
     * This mutation's purpose is to not be watched by the appMosaics plugin
     */
  UPDATE_MOSAICS_INFO(state: StoreAccount, mosaics: AppMosaic[]): void {
    updateMosaics(state, mosaics)
  },
  /**
     * This mutation's purpose is to not be watched by the appMosaics plugin
     */
  UPDATE_MOSAICS_NAMESPACES(state: StoreAccount, mosaics: AppMosaic[]): void {
    updateMosaics(state, mosaics)
  },
  RESET_MOSAICS(state: StoreAccount) {
    state.mosaics = {...state.networkMosaics}
  },
  SET_NETWORK_CURRENCY(state: StoreAccount, mosaic: NetworkCurrency) {
    state.networkCurrency = mosaic
  },
  RESET_NAMESPACES(state: StoreAccount): void {
    state.namespaces = []
  },
  UPDATE_NAMESPACES(state: StoreAccount, namespaces: AppNamespace[]): void {
    const namespacesToUpdate = [...state.namespaces]

    const updatedNamespaces = namespaces.map(newNamespace => {
      const oldNamespace = namespacesToUpdate.find(({hex}) => hex === newNamespace.hex)
      if (oldNamespace === undefined) return newNamespace
      return AppNamespace.fromNamespaceUpdate(oldNamespace, newNamespace)
    })

    const namespacesNotUpdated = namespacesToUpdate
      .filter(({hex}) => namespaces.find(ns => ns.hex === hex) === undefined)

    state.namespaces = [ ...namespacesNotUpdated, ...updatedNamespaces ]
  },
  ADD_NAMESPACE_FROM_RECIPIENT_ADDRESS(state: StoreAccount, namespaces: AppNamespace[]) {
    state.namespaces = [ ...state.namespaces, ...namespaces ]
  },
  SET_NODE(state: StoreAccount, nodeAndNetworkType: {node: string, networkType: NetworkType}): void {
    const {node, networkType} = nodeAndNetworkType
    state.node = node
    const activeNodeMap = JSON.parse(localRead('activeNodeMap') || '{}')
    activeNodeMap[networkType] = node
    localSave('activeNodeMap', JSON.stringify(activeNodeMap))
  },
  RESET_TRANSACTION_LIST(state: StoreAccount) {
    state.transactionList = []
  },
  SET_TRANSACTION_LIST(state: StoreAccount, list: FormattedTransaction[]) {
    state.transactionList = list
  },
  SET_UNCONFIRMED_TRANSACTION_LIST(state: StoreAccount, list: FormattedTransaction[]) {
    state.transactionList.unshift(...list)
  },
  ADD_UNCONFIRMED_TRANSACTION(state: StoreAccount, transaction: FormattedTransaction) {
    state.transactionList.unshift(transaction)
  },
  ADD_CONFIRMED_TRANSACTION(state: StoreAccount, transaction: FormattedTransaction) {
    const newStateTransactions = [...state.transactionList]
    const txIndex = newStateTransactions
      .findIndex(({txHeader}) => transaction.txHeader.hash === txHeader.hash)

    if (txIndex > -1) newStateTransactions.splice(txIndex, 1)
    newStateTransactions.unshift(transaction)
    state.transactionList = newStateTransactions
  },
  SET_ACCOUNT_DATA(state: StoreAccount, currentAccount: CurrentAccount) {
    state.currentAccount = currentAccount
  },
  SET_MULTISIG_ACCOUNT_GRAPH_INFO(state: StoreAccount, addressAndMultisigInfo: AddressAndMultisigGraphInfo) {
    const {address, multisigAccountGraphInfo} = addressAndMultisigInfo
    Vue.set(state.multisigAccountGraphInfo, address, multisigAccountGraphInfo)
  },
  SET_ACTIVE_MULTISIG_ACCOUNT(state: StoreAccount, publicKey: string) {
    if (publicKey === state.wallet.publicKey) {
      state.activeMultisigAccount = null
      return
    }
    state.activeMultisigAccount = publicKey
  },
  SET_MULTISIG_ACCOUNT_NAMESPACES(state: StoreAccount, addressAndNamespaces: AddressAndNamespaces) {
    const {address, namespaces} = addressAndNamespaces
    Vue.set(state.multisigAccountsNamespaces, address, namespaces)
  },
  UPDATE_MULTISIG_ACCOUNT_MOSAICS(state: StoreAccount, addressAndMosaics: AddressAndMosaics): void {
    const {address, mosaics} = addressAndMosaics
    const mosaicList = {...state.multisigAccountsMosaics[address]}
    mosaics.forEach((mosaic: AppMosaic) => {
      if (!mosaic.hex) return
      const {hex} = mosaic
      if (!mosaicList[hex]) mosaicList[hex] = new AppMosaic({hex})
      Object.assign(mosaicList[mosaic.hex], mosaic)
    })
    Vue.set(state.multisigAccountsMosaics, address, mosaicList)
  },
  RESET_TRANSACTIONS_TO_COSIGN(state: StoreAccount) {
    state.transactionsToCosign = []
  },
  POP_TRANSACTION_TO_COSIGN_BY_HASH(state: StoreAccount, hash: string) {
    state.transactionsToCosign = popTransactionToCosignByHash([...state.transactionsToCosign], hash)
  },
  ADD_TRANSACTIONS_TO_COSIGN(state: StoreAccount, transactions: FormattedTransaction[]) {
    const newTxHashes = [...transactions].map(({rawTx}) => rawTx.transactionInfo.hash)
    const oldTransactionsToCosign = [...state.transactionsToCosign]
      .filter(({rawTx}) => newTxHashes.indexOf(rawTx.transactionInfo.hash) === -1)
    state.transactionsToCosign = [ ...transactions, ...oldTransactionsToCosign ]
  },
  SET_TEMPORARY_PASSWORD(state: StoreAccount, password: string) {
    state.temporaryLoginInfo.password = password
  },
  SET_TEMPORARY_MNEMONIC(state: StoreAccount, mnemonic: string) {
    state.temporaryLoginInfo.mnemonic = mnemonic
  },
  REMOVE_TEMPORARY_LOGIN_INFO(state: StoreAccount) {
    state.temporaryLoginInfo = {
      password: null,
      mnemonic: null,
    }
  },
  UPDATE_TRANSACTION_TO_COSIGN(state: StoreAccount, newTransaction: FormattedTransaction) {
    const {hash} = newTransaction.rawTx.transactionInfo
    const transactions = popTransactionToCosignByHash([...state.transactionsToCosign], hash)
    state.transactionsToCosign = [ newTransaction, ...transactions ]
  },
  SET_TEMPORARY_REMOTE_NODE_CONFIG(state: StoreAccount, temporaryRemoteNodeConfig: {
    publicKey: string
    node: string
  }) {
    state.wallet.temporaryRemoteNodeConfig = temporaryRemoteNodeConfig
  },

  SET_ACCOUNTS_BALANCES(state: StoreAccount, balances: Record <string, Balances>) {
    state.balances = balances
  },

  SET_ACCOUNT_BALANCES(state, { address, balances }) {
    Vue.set(state.balances, address, balances)
  },
}

const actions: ActionTree<any, AppState> = {
  SET_GENERATION_HASH({commit, rootState}, {endpoint, generationHash}) {
    if (endpoint !== rootState.account.node) return
    commit('SET_GENERATION_HASH', generationHash)
  },
  SET_NETWORK_CURRENCY({commit, rootState}, {endpoint, networkCurrency}) {
    if (endpoint !== rootState.account.node) return
    commit('SET_NETWORK_CURRENCY', networkCurrency)
  },
  SET_NETWORK_MOSAICS({commit, rootState}, {endpoint, appMosaics}) {
    if (endpoint !== rootState.account.node) return
    commit('SET_NETWORK_MOSAICS', appMosaics)
  },
  UPDATE_MOSAICS({commit, rootState}, {endpoint, appMosaics}) {
    if (endpoint !== rootState.account.node) return
    commit('UPDATE_MOSAICS', appMosaics)
  },
  ADD_UNCONFIRMED_TRANSACTION({commit}, transaction: FormattedTransaction) {
    commit('POP_TRANSACTION_TO_COSIGN_BY_HASH', transaction)
    commit('ADD_UNCONFIRMED_TRANSACTION', transaction)
  },
  ADD_CONFIRMED_TRANSACTION({commit}, transaction: FormattedTransaction) {
    commit('POP_TRANSACTION_TO_COSIGN_BY_HASH', transaction)
    commit('ADD_CONFIRMED_TRANSACTION', transaction)
  },
  async SET_ACCOUNTS_BALANCES({commit, rootState}) {
    const {walletList} = rootState.app
    const {node} = rootState.account
    const plainAddresses = walletList.map(({address}) => Address.createFromRawAddress(address))
    const accountsInfo = await new AccountHttp(node)
      .getAccountsInfo(plainAddresses)
      .toPromise()

    const balances = BalancesService.getFromAccountsInfo(accountsInfo)
    
    commit('SET_ACCOUNTS_BALANCES', balances)
  },
}

export const accountState = {state}
export const accountMutations = {mutations}
export const accountActions = {actions}
export const accountGetters = {getters}
