import {SequentialFetcher} from '@/core/services/network/SequentialFetcher.ts'
import {Address} from 'nem2-sdk'
import {APP_PARAMS} from '@/config'

const {SEQUENTIAL_FETCHER_DEFAULT_DELAY} = APP_PARAMS
const mockNetworkCall = (args) => new Promise(resolve => resolve([args]))
const mockLongNetworkCall = (args) => new Promise(resolve => setTimeout(
  () => {resolve([args])}, 10),
)

const mockErroredNetworkCall = jest.fn()
const mockErroredNetworkCallFunction = (address) => new Promise(
  reject => {
    mockErroredNetworkCall(address)
    reject(new Error('something went wrong'))
  }) 
const mockResponseHandler1 = jest.fn()
const mockResponseHandler2 = jest.fn()
const mockResponseHandler3 = jest.fn()
const mockResponseHandler4 = jest.fn()

const addresses = [
  Address.createFromRawAddress('SAY7N2GP6JJBFIRBTUEXY2JJVOLGIZ46KWIMYB5T'),
  Address.createFromRawAddress('SB2FRRM3SYAMQL47RRUKMQSRJXJT3QPVAVWNTXQX'),
  Address.createFromRawAddress('SBIWHDWZMPIXXM2BINCRXAK3H3MGA5VHB3D2PO5W'),
]

describe('SequentialFetcher', () => {
  it('should call the response handler with all the addresses', async (done) => {
    const sequentialFetcher = SequentialFetcher.create(mockNetworkCall, mockResponseHandler1, 1)
    sequentialFetcher.start(addresses)

    setTimeout(()=> {
      expect(mockResponseHandler1).toHaveBeenCalledTimes(3)
      expect(mockResponseHandler1.mock.calls[0][0]).toEqual([addresses[0]])
      expect(mockResponseHandler1.mock.calls[1][0]).toEqual([addresses[1]])
      expect(mockResponseHandler1.mock.calls[2][0]).toEqual([addresses[2]])
      done()
    }, 50)
  })

  it('should stop the calls once killed', async (done) => {
    const sequentialFetcher = SequentialFetcher.create(mockNetworkCall, mockResponseHandler2, 5)
    sequentialFetcher.start(addresses)
    setTimeout(() => sequentialFetcher.kill(), 10)

    setTimeout(()=> {
      expect(mockResponseHandler2).toHaveBeenCalledTimes(2)
      expect(mockResponseHandler2.mock.calls[0][0]).toEqual([addresses[0]])
      expect(mockResponseHandler2.mock.calls[1][0]).toEqual([addresses[1]])
      done()
    }, 50)
  })

  it('should continue on error', async (done) => {
    const sequentialFetcher = SequentialFetcher.create(
      mockErroredNetworkCallFunction,
      mockResponseHandler3,
      1,
    )
    
    sequentialFetcher.start(addresses)

    setTimeout(()=> {
      expect(mockErroredNetworkCall).toHaveBeenCalledTimes(3)
      expect(mockResponseHandler3).toHaveBeenCalledTimes(0)
      done()
    }, 50)
  })

  it('should not fire next call when previous is not resolved', async (done) => {
    const sequentialFetcher = SequentialFetcher.create(
      mockLongNetworkCall,
      mockResponseHandler4,
      1,
    )
    
    sequentialFetcher.start(addresses)

    setTimeout(()=> {
      expect(mockResponseHandler4).toHaveBeenCalledTimes(1)
      done()
    }, 12)
  })

  it('the default min delay should be taken from an app constant', () => {
    const sequentialFetcher = SequentialFetcher.create(jest.fn(), jest.fn())
    // @ts-ignore
    expect(sequentialFetcher.minDelay).toBe(SEQUENTIAL_FETCHER_DEFAULT_DELAY)
  })

  it('start should call kill() if isFetching is true', () => {
    const sequentialFetcher = SequentialFetcher.create(jest.fn(), jest.fn(), 1)
    // @ts-ignore
    sequentialFetcher.isFetching = true
    const mockKill = jest.fn()
    // @ts-ignore
    sequentialFetcher.kill = mockKill
    sequentialFetcher.start(addresses)
    expect(mockKill).toHaveBeenCalledTimes(1)
  })
})
