import {NetworkType, MosaicSupplyChangeAction} from 'nem2-sdk'
import {FEE_SPEEDS, NETWORK_CONSTANTS, networkConfig} from '../constants'
const {MAX_MOSAIC_DURATION} = NETWORK_CONSTANTS
const {maxMosaicAtomicUnits, maxMosaicDivisibility} = networkConfig

export const formDataConfig = {
  settingPassword: {
    previousPassword: '',
    newPassword: '',
    confirmPassword: '',
    cipher: '',
  },
  createAccountForm: {
    accountName: '',
    password: '',
    passwordAgain: '',
    hint: '',
  },
  importKeystoreConfig: {
    walletName: 'keystore-wallet',
    keystoreStr: '',
    keystorePassword: '',
  },
  transferForm: {
    recipient: '',
    remark: '',
    multisigPublicKey: '',
    feeSpeed: FEE_SPEEDS.NORMAL,
    mosaicTransferList: [],
    isEncrypted: true,
  },
  remoteForm: {
    remotePublicKey: '',
    feeSpeed: FEE_SPEEDS.NORMAL,
    password: '',
  },
  mosaicAliasForm: {
    mosaicName: '',
    feeSpeed: FEE_SPEEDS.NORMAL,
    password: '',
  },
  mosaicEditForm: {
    delta: 1,
    supplyType: MosaicSupplyChangeAction.Increase,
    feeSpeed: FEE_SPEEDS.NORMAL,
  },
  mosaicUnAliasForm: {
    feeSpeed: FEE_SPEEDS.NORMAL,
    password: '',
  },
  addressAliasForm: {
    address: '',
    feeSpeed: FEE_SPEEDS.NORMAL,
    password: '',
  },
  alias: {
    feeSpeed: FEE_SPEEDS.NORMAL,
    password: '',
  },
  mosaicTransactionForm: {
    restrictable: false,
    supply: maxMosaicAtomicUnits,
    divisibility: maxMosaicDivisibility,
    transferable: true,
    supplyMutable: false,
    permanent: false,
    duration: MAX_MOSAIC_DURATION,
    feeSpeed: FEE_SPEEDS.NORMAL,
    multisigPublicKey: '',
  },
  multisigConversionForm: {
    minApproval: 1,
    minRemoval: 1,
    feeSpeed: FEE_SPEEDS.NORMAL,
    multisigPublicKey: '',
  },
  multisigModificationForm: {
    minApproval: 0,
    minRemoval: 0,
    feeSpeed: FEE_SPEEDS.NORMAL,
    multisigPublicKey: '',
  },
  namespaceEditForm: {
    name: '',
    duration: 1000,
    feeSpeed: FEE_SPEEDS.NORMAL,
  },
  rootNamespaceForm: {
    duration: NETWORK_CONSTANTS.MAX_NAMESPACE_DURATION,
    rootNamespaceName: '',
    multisigPublicKey: '',
    feeSpeed: FEE_SPEEDS.NORMAL,
  },
  subNamespaceForm: {
    rootNamespaceName: '',
    subNamespaceName: '',
    multisigPublicKey: '',
    feeSpeed: FEE_SPEEDS.NORMAL,
  },
  walletImportMnemonicForm: {
    mnemonic: '',
    walletName: '',
  },
  walletImportPrivateKeyForm: {
    privateKey: '',
    walletName: 'wallet-privateKey',
  },
  trezorImportForm: {
    networkType: NetworkType.MIJIN_TEST,
    accountIndex: 0,
    walletName: 'Trezor Wallet',
  },
  walletCreateForm: {
    walletName: 'wallet-create',
    path: 0,
  },
}
