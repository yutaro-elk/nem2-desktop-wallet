import {mapState, mapGetters} from 'vuex'
import {
  Address, NetworkType, NamespaceRegistrationTransaction, Deadline, UInt64,
} from 'nem2-sdk'
import {Component, Vue, Provide} from 'vue-property-decorator'
import {networkConfig, formDataConfig, DEFAULT_FEES, FEE_GROUPS} from '@/config'
import {getAbsoluteMosaicAmount, formatAddress, cloneData} from '@/core/utils'
import {AppNamespace, StoreAccount, AppInfo, AppWallet, DefaultFee, LockParams} from '@/core/model'
import {createBondedMultisigTransaction, createCompleteMultisigTransaction, signAndAnnounce} from '@/core/services'
import {validation} from '@/core/validation'
import DisabledForms from '@/components/disabled-forms/DisabledForms.vue'
import ErrorTooltip from '@/components/other/forms/errorTooltip/ErrorTooltip.vue'
import SignerSelector from '@/components/forms/inputs/signer-selector/SignerSelector.vue'

@Component({
  components: {
    DisabledForms,
    ErrorTooltip,
    SignerSelector,
  },
  computed: {
    ...mapState({
      activeAccount: 'account',
      app: 'app',
    }),
    ...mapGetters({
      announceInLock: 'announceInLock',
      isCosignatory: 'isCosignatory',
    }),
  },
})
export class CreateSubNamespaceTs extends Vue {
  @Provide() validator: any = this.$validator
  activeAccount: StoreAccount
  app: AppInfo
  isCosignatory: boolean
  announceInLock: boolean
  transactionList = []
  formItems = cloneData(formDataConfig.subNamespaceForm)
  namespaceGracePeriodDuration = networkConfig.namespaceGracePeriodDuration
  formatAddress = formatAddress
  validation = validation

  get wallet(): AppWallet {
    return this.activeAccount.wallet
  }

  get activeMultisigAccount(): string {
    return this.activeAccount.activeMultisigAccount
  }

  get activeMultisigAddress(): string {
    const {activeMultisigAccount} = this.activeAccount
    return activeMultisigAccount
      ? Address.createFromPublicKey(activeMultisigAccount, this.wallet.networkType).plain()
      : null
  }

  get networkType(): NetworkType {
    return this.activeAccount.wallet.networkType
  }

  get currentHeight(): number {
    return this.app.networkProperties.height
  }

  get networkCurrency() {
    return this.activeAccount.networkCurrency
  }

  get accountPublicKey(): string {
    return this.activeAccount.wallet.publicKey
  }

  get namespaceList(): {label: string, value: string}[] {
    const {currentHeight, namespaceGracePeriodDuration} = this
    const {namespaces} = this.activeAccount
    if (!namespaces) return []

    // @TODO: refactor and make it an AppNamespace method
    return namespaces
      .filter(namespace => namespace.alias)
      .filter(({endHeight, levels}) => (levels < networkConfig.maxNamespaceDepth
        && endHeight - currentHeight + namespaceGracePeriodDuration > 0))
      .map(alias => ({label: alias.name, value: alias.name}))
  }

  get multisigNamespaceList(): {label: string, value: string}[] {
    const {currentHeight, namespaceGracePeriodDuration, activeMultisigAddress} = this
    if (!activeMultisigAddress) return []
    const namespaces: AppNamespace[] = this.activeAccount.multisigAccountsNamespaces[activeMultisigAddress]
    if (!namespaces) return []

    // @TODO: refactor and make it an AppNamespace method
    return namespaces
      .filter(namespace => namespace.alias)
      .filter(({endHeight, levels}) => (levels < networkConfig.maxNamespaceDepth
        && endHeight - currentHeight + namespaceGracePeriodDuration > 0))
      .map(alias => ({label: alias.name, value: alias.name}))
  }

  get activeNamespaceList(): {label: string, value: string}[] {
    const {activeMultisigAddress} = this
    // @TODO handle namespace list loading state
    return activeMultisigAddress ? this.multisigNamespaceList : this.namespaceList
  }

  get defaultFees(): DefaultFee[] {
    if (!this.activeMultisigAccount) return DEFAULT_FEES[FEE_GROUPS.SINGLE]
    if (!this.announceInLock) return DEFAULT_FEES[FEE_GROUPS.DOUBLE]
    if (this.announceInLock) return DEFAULT_FEES[FEE_GROUPS.TRIPLE]
  }

  get feeAmount(): number {
    const {feeSpeed} = this.formItems
    const feeAmount = this.defaultFees.find(({speed}) => feeSpeed === speed).value
    return getAbsoluteMosaicAmount(feeAmount, this.networkCurrency.divisibility)
  }

  get feeDivider(): number {
    if (!this.activeMultisigAccount) return 1
    if (!this.announceInLock) return 2
    if (this.announceInLock) return 3
  }

  createByMultisig(): void {
    const {feeAmount, feeDivider} = this
    const {multisigPublicKey} = this.formItems
    const {networkType} = this.wallet
    const rootNamespaceTransaction = this.createSubNamespace()

    if (this.announceInLock) {
      const aggregateTransaction = createBondedMultisigTransaction(
        [rootNamespaceTransaction],
        multisigPublicKey,
        networkType,
        feeAmount / feeDivider,
      )

      this.transactionList = [aggregateTransaction]
      return
    }
    const aggregateTransaction = createCompleteMultisigTransaction(
      [rootNamespaceTransaction],
      multisigPublicKey,
      networkType,
      feeAmount / feeDivider,
    )
    this.transactionList = [aggregateTransaction]
  }

  createSubNamespace() {
    const {rootNamespaceName, subNamespaceName} = this.formItems
    const {feeAmount, feeDivider} = this
    const {networkType} = this.wallet

    return NamespaceRegistrationTransaction.createSubNamespace(
      Deadline.create(),
      subNamespaceName,
      rootNamespaceName,
      networkType,
      UInt64.fromUint(feeAmount / feeDivider),
    )
  }

  createBySelf() {
    const transaction = this.createSubNamespace()
    this.transactionList = [transaction]
  }

  confirmViaTransactionConfirmation() {
    if (this.activeMultisigAccount) {
      this.createByMultisig()
    } else {
      this.createBySelf()
    }

    try {
      signAndAnnounce({
        transaction: this.transactionList[0],
        store: this.$store,
        lockParams: this.lockParams,
      })
    } catch (error) {
      console.error('SubNamespaceTs -> confirmViaTransactionConfirmation -> error', error)
    }
  }

  get lockParams(): LockParams {
    const {announceInLock, feeAmount, feeDivider} = this
    return new LockParams(announceInLock, feeAmount / feeDivider)
  }

  async submit() {
    this.$validator
      .validate()
      .then((valid) => {
        if (!valid) return
        this.confirmViaTransactionConfirmation()
      })
  }

  resetFields() {
    this.$nextTick(() => this.$validator.reset())
  }

  mounted() {
    this.resetFields()
    this.formItems.multisigPublicKey = this.accountPublicKey
  }
}
