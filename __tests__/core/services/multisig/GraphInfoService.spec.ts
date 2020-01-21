import {
  cosignWalletMultisigAccountGraphInfo, CosignWallet,
  MultisigAccount, Multisig2Account,
  cosignWalletMultisigAccountInfo,
} from '@MOCKS/index'
import {GraphInfoService} from '@/core/services/multisig/GraphInfoService.ts'
import {NetworkType, Address} from 'nem2-sdk'

describe('GraphInfoService', () => {
  it('getMultisigAccountInfo should return multisig info by publicKey', () => {
    const multisigAccountInfo = GraphInfoService.getMultisigAccountInfo(
      CosignWallet.publicKey,
      cosignWalletMultisigAccountGraphInfo,
    )

    expect(multisigAccountInfo).toStrictEqual(cosignWalletMultisigAccountInfo)
  })

  it('getMultisigAccountInfo should return multisig info by address', () => {
    const multisigAccountInfo = GraphInfoService.getMultisigAccountInfo(
      Address.createFromPublicKey(CosignWallet.publicKey, NetworkType.MIJIN_TEST),
      cosignWalletMultisigAccountGraphInfo,
    )

    expect(multisigAccountInfo).toStrictEqual(cosignWalletMultisigAccountInfo)
  })

  it('getChildrenAddresses should return children addresses ', () => {
    const childrenAddresses = GraphInfoService.getChildrenAddresses(
      cosignWalletMultisigAccountGraphInfo,
    )
    expect(childrenAddresses).toStrictEqual([
      MultisigAccount.address,
      Multisig2Account.address,
    ])
  })
})
