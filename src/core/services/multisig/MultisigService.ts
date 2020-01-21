// eslint-disable-next-line @typescript-eslint/no-var-requires
const equal = require('fast-deep-equal/es6') 
import {Address, MultisigAccountGraphInfo, MultisigHttp} from 'nem2-sdk'
import {Store} from 'vuex'
import {AppState} from '@/core/model'

export class MultisigService {
  private graphInfo: MultisigAccountGraphInfo
  private address: Address
  private multisigHttp: MultisigHttp
 
  
  /**
   * Retrieve an account Multisig Graph Info from the network
   * Commit it to the store if it has changed
   * @param  {string} publicKey
   * @param  {Store<AppState>} store
   * @returns Promise
   */
  static async updateAccountMultisigData(publicKey: string, store: Store<AppState>): Promise<void> {
    const multisigService = new MultisigService(publicKey, store)
    await multisigService.setGraphInfoFromNetwork()
    store.commit('SET_MULTISIG_LOADING', false)
  }

  private constructor(publicKey: string, private readonly store: Store<AppState>) {
    const {node, currentAccount} = store.state.account
    const {networkType} = currentAccount
    this.address = Address.createFromPublicKey(publicKey, networkType)
    this.multisigHttp = new MultisigHttp(node, networkType)
  }

  private async setGraphInfoFromNetwork(): Promise<void> {
    await this.getGraphInfoFromNetwork()
    this.commitChangesToStore()
  }

  private async getGraphInfoFromNetwork(): Promise<void> {
    try {
      const graphInfo = await this.multisigHttp
        .getMultisigAccountGraphInfo(this.address)
        .toPromise()
      
      this.graphInfo = graphInfo
    } catch (error) {
      console.error('MultisigService -> getGraphInfoFromNetwork', error)
      this.graphInfo = null
    }
  }

  private commitChangesToStore(): void {
    if (!this.graphInfo || this.fetchedDataIsNewer()) {
      this.store.commit('SET_MULTISIG_ACCOUNT_GRAPH_INFO', {
        address: this.address.plain(), multisigAccountGraphInfo: this.graphInfo,
      })
    }
  }
 
  private fetchedDataIsNewer(): boolean {
    const dataFromStore: MultisigAccountGraphInfo = this.store.getters.multisigAccountGraphInfo
    if (!dataFromStore) return true
    return !equal(dataFromStore.multisigAccounts, this.graphInfo.multisigAccounts)
  }
}
