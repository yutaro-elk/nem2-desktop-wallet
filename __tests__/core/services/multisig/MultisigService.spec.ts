import {multisigGraphInfo1, CosignWallet} from '@MOCKS/index'
import {of} from 'rxjs'
import {tap, map} from 'rxjs/operators'
import {MultisigService} from '@/core/services/multisig/MultisigService.ts'
import {NetworkType} from 'nem2-sdk'
import flushPromises from 'flush-promises'

const mockGetMultisigAccountGraphInfoCall = jest.fn()
const mockGetMultisigAccountGraphInfo = (args) => of(args).pipe(
  tap(mockGetMultisigAccountGraphInfoCall),
  map(() => multisigGraphInfo1),
)

jest.mock('nem2-sdk/dist/src/infrastructure/MultisigHttp', () => ({
  MultisigHttp: jest.fn().mockImplementation(() => {
    return {
      getMultisigAccountGraphInfo: mockGetMultisigAccountGraphInfo,
    }
  }),
}))

const mockCommit = jest.fn()
const mockStore = {
  state: {
    account: {
      node: 'http://endpoint:3000',
      multisigAccountGraphInfo: {},
      currentAccount: {
        networkType: NetworkType.MIJIN_TEST,

      },
    },
  },
  commit: mockCommit,
  getters: {multisigAccountGraphInfo: undefined},
}

describe('Multisig service', () => {
  beforeEach(() => {
    mockGetMultisigAccountGraphInfoCall.mockClear()
    mockCommit.mockClear()
  })

  it('updateAccountMultisigData should set graphInfo in the store', async (done) => {
    // @ts-ignore
    await MultisigService.updateAccountMultisigData(CosignWallet.publicKey, mockStore)
    await flushPromises()
    
    expect(mockGetMultisigAccountGraphInfoCall).toHaveBeenCalledTimes(1)
    expect(mockCommit.mock.calls[0][0]).toBe('SET_MULTISIG_ACCOUNT_GRAPH_INFO')
    expect(mockCommit.mock.calls[0][1]).toStrictEqual({
      address: CosignWallet.address,
      multisigAccountGraphInfo: multisigGraphInfo1,
    })
    expect(mockCommit.mock.calls[1][0]).toBe('SET_MULTISIG_LOADING')
    expect(mockCommit.mock.calls[1][1]).toBe(false)
    done()
  })

  it('updateAccountMultisigData should not commit graphInfo in the store if same data is already there', async (done) => {
    await MultisigService.updateAccountMultisigData(
      CosignWallet.publicKey,
      // @ts-ignore
      {...mockStore,
        getters: {
          multisigAccountGraphInfo:  multisigGraphInfo1,
        },
      })

    await flushPromises()
    expect(mockCommit.mock.calls[0][0]).toBe('SET_MULTISIG_LOADING')
    expect(mockCommit.mock.calls[0][1]).toBe(false)
    expect(mockCommit.mock.calls[1]).toBe(undefined)
    done()
  })
})
