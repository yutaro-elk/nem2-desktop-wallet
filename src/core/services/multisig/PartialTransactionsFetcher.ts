import {Store} from 'vuex'
import {Address, AccountHttp, AggregateTransaction} from 'nem2-sdk'
import {AppState, TransactionStatusGroups, TransactionCategories} from '@/core/model'
import {SequentialFetcher, GraphInfoService} from '@/core/services'

export class PartialTransactionsFetcher {
  private sequentialFetcher: SequentialFetcher
  
  /**
   * @param  {Store<AppState>} store
   * @returns PartialTransactionsFetcher
   */
  static create(store: Store<AppState>): PartialTransactionsFetcher {
    return new PartialTransactionsFetcher(store)
  }
  
  private constructor(private readonly store: Store<AppState>) { }

  /**
   * Starts sequential fetching of multisig accounts partial transactions
   * @returns void
   */
  startFetchingRound(): void {
    try {
      if (this.store.getters.isMultisig || !this.store.getters.isCosignatory) return
      this.sequentialFetcher = this.createSequentialFetcher()
      
      const childrenAddresses = GraphInfoService.getChildrenAddresses(
        this.store.getters.multisigAccountGraphInfo,
      )

      this.sequentialFetcher.start(childrenAddresses) 
    } catch (error) {
      console.error('PartialTransactionsFetcher -> startFetchingRound', error)
    }
  }

  /**
   * Stops sequential fetching of multisig accounts partial transactions
   * @returns void
   */
  kill(): void {
    if (this.sequentialFetcher && this.sequentialFetcher.isFetching) {
      this.sequentialFetcher.kill()
    }
  }

  private createSequentialFetcher() {
    return SequentialFetcher.create(
      this.getNetworkCallFunction(),
      this.getAccountPartialTransactionsResponseHandler(),
    )
  }

  private getNetworkCallFunction(): (address: Address) => Promise<AggregateTransaction[]> {
    const {node} = this.store.state.account
    const accountHttp = new AccountHttp(node)
    return (address: Address) => accountHttp.getAccountPartialTransactions(address).toPromise()
  }

  private getAccountPartialTransactionsResponseHandler(
  ): (transactions: AggregateTransaction[], address: Address) => void {
    const {transactionFormatter} = this.store.state.app

    return (transactions: AggregateTransaction[], address: Address) => transactionFormatter
      .formatAndSavePartialTransactions(
        transactions, 
        address,
        {
          transactionStatusGroup: TransactionStatusGroups.confirmed,
          transactionCategory: TransactionCategories.TO_COSIGN,
        },
      )
  }
}
