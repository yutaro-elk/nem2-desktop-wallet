import {MultisigAccountGraphInfo, MultisigAccountInfo, Address, AggregateTransaction, MultisigAccountModificationTransaction} from 'nem2-sdk'
import {flattenArray} from '@/core/utils'

export class GraphInfoService {
  /**
    * Filter out transactions that are not to be cosigned
    * By a given address from a list of aggregate transactions
    * @param  {Address} address
    * @param  {AggregateTransaction[]} transactions
    * @param  {MultisigAccountGraphInfo} graphInfo
    * @returns AggregateTransaction
    */
  static getTransactionsToCosignFromTransactionList(
    address: Address,
    transactions: AggregateTransaction[],
    graphInfo: MultisigAccountGraphInfo,
  ): AggregateTransaction[] {
    const multisigInfo = GraphInfoService.getMultisigAccountInfo(address, graphInfo)
    if (!multisigInfo || multisigInfo.multisigAccounts.length === 0) return transactions

    return transactions.filter(tx => {
      const [innerTransaction] = tx.innerTransactions
      if (innerTransaction instanceof MultisigAccountModificationTransaction) return true
      return GraphInfoService.getMultisigAccountInfo(innerTransaction.signer.publicKey, graphInfo)
    })

  }

  /**
   * @param  {Address|string} addressOrPublicKey
   * @param  {MultisigAccountGraphInfo} graphInfo
   * @returns MultisigAccountInfo
   */
  static getMultisigAccountInfo(
    addressOrPublicKey: Address | string,
    graphInfo: MultisigAccountGraphInfo,
  ): MultisigAccountInfo {
    return new GraphInfoService(graphInfo).findMultisigAccountInfo(addressOrPublicKey)
  }

  /**
   * Get all addresses except the parent's from a MultisigGraphInfo
   * @param  {MultisigAccountGraphInfo} graphInfo
   * @returns Address
   */
  static getChildrenAddresses(graphInfo: MultisigAccountGraphInfo): Address[] {
    const graphInfoService = new GraphInfoService(graphInfo)
    const graphKeys = graphInfoService.getGraphKeys()
    if (graphKeys.length < 2) return null
    return flattenArray(
      graphKeys
        .sort() // Level closer to parent first
        .filter(key => key < 0)
        .map(key => graphInfo.multisigAccounts.get(key))
        .map(multisigAccountInfo => multisigAccountInfo
          .map(({account}) => account.address),
        ),
    )
  }

  private constructor(private readonly graphInfo: MultisigAccountGraphInfo) { }
 

  private findMultisigAccountInfo(addressOrPublicKey: Address | string): MultisigAccountInfo {
    if (!this.graphInfo) return null
    const keysToSearch = this.getGraphKeys()
    return this.findMultisigAccountInfoInGraphNodes(addressOrPublicKey, keysToSearch)
  }

  private getGraphKeys(): number[] {
    return [...this.graphInfo.multisigAccounts.keys()]
  }

  private findMultisigAccountInfoInGraphNodes(
    addressOrPublicKey: Address | string, keysToSearch: number[],
  ): MultisigAccountInfo {
    const searchedKey = keysToSearch.pop()
    const multisigAccountInfo = addressOrPublicKey instanceof Address
      ? this.findMultisigAccountInfoInGraphNodeByAddress(addressOrPublicKey, searchedKey)
      : this.findMultisigAccountInfoInGraphNodeByPublicKey(addressOrPublicKey, searchedKey)

    if (multisigAccountInfo !== undefined) return multisigAccountInfo
    if (!keysToSearch.length) return null
    return this.findMultisigAccountInfoInGraphNodes(addressOrPublicKey, keysToSearch)
  }

  private findMultisigAccountInfoInGraphNodeByAddress(
    address: Address, searchedKey: number,
  ): MultisigAccountInfo {
    return this.getSearchedKeyMultisigAccountsInfo(searchedKey).find(
      ({account}) => account.address.plain() === address.plain(),
    )
  }

  private findMultisigAccountInfoInGraphNodeByPublicKey(
    publicKey: string, searchedKey: number,
  ): MultisigAccountInfo {
    return this.getSearchedKeyMultisigAccountsInfo(searchedKey).find(
      ({account}) => account.publicKey === publicKey,
    )
  }

  private getSearchedKeyMultisigAccountsInfo(searchedKey: number): MultisigAccountInfo[] {
    return [...this.graphInfo.multisigAccounts.get(searchedKey).values()]
  }
}
