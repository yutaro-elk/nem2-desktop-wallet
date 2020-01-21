import {PartialTransactionsFetcher} from '@/core/services/multisig/PartialTransactionsFetcher.ts'
import {
  CosignWallet,
  cosignWalletMultisigAccountGraphInfo,
  MultisigAccount,
  Multisig2Account,
} from '@MOCKS/index'

const mockSequentialFetcherKill = jest.fn()
const mockSequentialFetcherStart = jest.fn()
const mockFormatAndSavePartialTransactions = jest.fn()

const mockSequentialFetcherCreate = {
  kill: mockSequentialFetcherKill,
  isFetching: true,
  start: mockSequentialFetcherStart,
}

jest.mock('@/core/services/network/SequentialFetcher', () => ({
  SequentialFetcher:{
    create: () => mockSequentialFetcherCreate,
  },
}))

const mockStore = {
  state: {
    account: {
      wallet: {
        publicKey: CosignWallet.publicKey,
      },
    },
    app: {
      transactionFormatter: {
        formatAndSavePartialTransactions: mockFormatAndSavePartialTransactions,
      },
    },
  },
  getters: {
    multisigAccountGraphInfo: cosignWalletMultisigAccountGraphInfo,
    isCosignatory: true,
    isMultisig: false,
  },
}

describe('PartialTransactionsFetcher', () => {
  beforeEach(() => {
    mockSequentialFetcherKill.mockClear()
    mockSequentialFetcherStart.mockClear()
    mockFormatAndSavePartialTransactions.mockClear()
  })

  it('startFetchingRound should call PartialTransactionsFetcher start with all addresses', () => {
    // @ts-ignore
    const partialTransactionsFetcher = PartialTransactionsFetcher.create(mockStore)
    partialTransactionsFetcher.startFetchingRound()

    expect(mockSequentialFetcherStart).toHaveBeenCalledTimes(1)
    expect(mockSequentialFetcherStart.mock.calls[0][0]).toStrictEqual([
      MultisigAccount.address,
      Multisig2Account.address,
    ])
  })

  it('startFetchingRound should return if the account is a multisig account', () => {
    PartialTransactionsFetcher
      // @ts-ignore
      .create({
        ...mockStore,
        getters: {
          isMultisig: true,
        },
      })

    expect(mockSequentialFetcherStart).toHaveBeenCalledTimes(0)
  })

  it('startFetchingRound should return if the account is not a cosignatory', () => {
    PartialTransactionsFetcher
      // @ts-ignore
      .create({
        ...mockStore,
        getters: {
          isCosignatory: false,
        },
      })

    expect(mockSequentialFetcherStart).toHaveBeenCalledTimes(0)
  })

  it('kill should call PartialTransactionsFetcher.kill() if it is fetching', () => {
    // @ts-ignore
    const partialTransactionsFetcher = PartialTransactionsFetcher.create(mockStore)
    partialTransactionsFetcher.startFetchingRound()
    partialTransactionsFetcher.kill()
    expect(mockSequentialFetcherKill).toHaveBeenCalledTimes(1)
  })

  it('kill should call PartialTransactionsFetcher.kill() PartialTransactionsFetcher is undefined', () => {
    // @ts-ignore
    const partialTransactionsFetcher = PartialTransactionsFetcher.create(mockStore)
    partialTransactionsFetcher.kill()
    expect(mockSequentialFetcherKill).toHaveBeenCalledTimes(0)
  })
})
