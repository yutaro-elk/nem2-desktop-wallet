import {GetterTree} from 'vuex'
import {StoreAccount, AppState, AccountGetters} from '@/core/model'
import {MultisigAccountInfo, Address} from 'nem2-sdk'
import {GraphInfoService} from '@/core/services'
import {absoluteAmountToRelativeAmount} from '@/core/utils'

export const getters: GetterTree<StoreAccount, AppState> = {
  balance(state): string {
    const address = state.wallet.address
    const balances = state.balances[address]
    const {networkCurrency} = state
    if (!balances || !networkCurrency) return '0'
    const balance = balances[networkCurrency.hex]
    return balance ? absoluteAmountToRelativeAmount(balance, networkCurrency) : '0'
  },
  multisigAccountGraphInfo(state) {
    return state.multisigAccountGraphInfo[state.wallet.address]
  },

  multisigAccountInfo(state, getters: AccountGetters): MultisigAccountInfo {
    const graphInfo = getters.multisigAccountGraphInfo
    if (!graphInfo) return null
    const {publicKey} = state.wallet
    return GraphInfoService.getMultisigAccountInfo(publicKey, graphInfo)
  },

  activeMultisigAccountAddress(state): Address {
    const {activeMultisigAccount, currentAccount} = state
    if (!activeMultisigAccount) return null
    return Address.createFromPublicKey(activeMultisigAccount, currentAccount.networkType)
  },

  activeMultisigAccountPlainAddress(state, getters: AccountGetters): string {
    return getters.activeMultisigAccountAddress.plain()
  },

  activeMultisigAccountMultisigAccountInfo(state, getters: AccountGetters): MultisigAccountInfo {
    const {activeMultisigAccount} = state
    if (!activeMultisigAccount) return null
    const graphInfo = getters.multisigAccountGraphInfo
    return GraphInfoService.getMultisigAccountInfo(activeMultisigAccount, graphInfo)
  },

  announceInLock(state, getters: AccountGetters): boolean {
    if (!state.activeMultisigAccount) return false
    const multisigAccountInfo = getters.activeMultisigAccountMultisigAccountInfo
    if (!multisigAccountInfo) return false
    return multisigAccountInfo.minApproval > 1
  },

  isMultisig(state, getters: AccountGetters): boolean {
    const multisigAccountInfo = getters.multisigAccountInfo
    return multisigAccountInfo && multisigAccountInfo.cosignatories.length > 0
  },

  isCosignatory(state, getters: AccountGetters): boolean {
    const multisigAccountInfo = getters.multisigAccountInfo
    return multisigAccountInfo
     && multisigAccountInfo.multisigAccounts
     && multisigAccountInfo.multisigAccounts.length > 0
  },
}
