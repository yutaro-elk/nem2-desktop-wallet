import {Subject} from 'rxjs'
import {startWith} from 'rxjs/operators'
import {Address} from 'nem2-sdk'
import {APP_PARAMS} from '@/config'

const {SEQUENTIAL_FETCHER_DEFAULT_DELAY} = APP_PARAMS

export class SequentialFetcher {
  isFetching = false
  private routineController: Subject<boolean>
  private networkCallsIterator: AsyncGenerator

  /**
   * @param  {(address:Address)=>Promise<any>} networkCallFunction
   * @param  {(response:any,address?:Address)=>void} responseHandler
   * @param  {number} minDelay minimum delay in ms between each network call
   * @returns SequentialFetcher
   */
  static create(
    networkCallFunction: (address: Address) => Promise<any>,
    responseHandler: (response: any, address?: Address) => void,
    minDelay = SEQUENTIAL_FETCHER_DEFAULT_DELAY,
  ): SequentialFetcher {
    return new SequentialFetcher(networkCallFunction, responseHandler, minDelay)
  }

  private constructor(
    private networkCallFunction: (address: Address) => Promise<any>,
    private responseHandler: (response: any, address?: Address) => void,
    private minDelay: number,
  ) {
    this.routineController = new Subject()
  }

  /**
   * Starts fetching sequentially children partial transactions endpoints
   * @param  {Address[]} addresses
   */
  start(addresses: Address[]) {
    if (this.isFetching) this.kill()
    this.setIterators(addresses)
    this.isFetching = true
    this.startFetchingRoutine()
  }

  /**
   * Stops fetching sequentially children partial transactions endpoints
   */
  kill() {
    this.isFetching = false
    this.routineController.next(false)
  }

  private setIterators(addresses: Address[]) {
    const addressesIterator = addresses[Symbol.iterator]()
    this.networkCallsIterator = this.createNetworkCallsIterator(addressesIterator)
  }

  private async * createNetworkCallsIterator(addresses: IterableIterator<Address>) {
    for await (const address of addresses) {
      yield this.networkCall(address)
    }
  }

  private async networkCall(address: Address): Promise<{response: any, address: Address}> {
    try {
      const promises = await Promise.all([ this.networkCallFunction(address), this.delay() ])
      const [response] = promises
      return {response, address}
    } catch (error) {
      return {response: null, address}
    }
  }

  private delay(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.minDelay))
  }

  private startFetchingRoutine() {
    this.routineController
      .pipe(startWith(true))
      .subscribe(async continueRoutine => {
        if (!continueRoutine) {
          this.networkCallsIterator.return(null)
          return
        }

        while (continueRoutine) {
          const {value, done} = await this.networkCallsIterator.next()

          if (done) {
            this.isFetching = false
            break
          }

          const {response, address} = value
          if (response && response.length) this.responseHandler(response, address)
        }
      })
  }
}
