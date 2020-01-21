import {mapState, mapGetters} from 'vuex'
import {
  NetworkType, UInt64, Deadline,
  NamespaceRegistrationTransaction, 
} from 'nem2-sdk'
import {Component, Vue, Watch, Provide} from 'vue-property-decorator'
import {DEFAULT_FEES, FEE_GROUPS, formDataConfig, networkConfig} from '@/config'
import {
  getAbsoluteMosaicAmount, formatSeconds, formatAddress, cloneData, absoluteAmountToRelativeAmount,
} from '@/core/utils'
import {StoreAccount, AppInfo, DefaultFee, AppWallet, LockParams} from '@/core/model'
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
      isCosignatory: 'isCosignatory',
      announceInLock: 'announceInLock',
      multisigAccountGraphInfo: 'multisigAccountGraphInfo',
      activeMultisigAccountMultisigAccountInfo: 'activeMultisigAccountMultisigAccountInfo',
    }),
  },
})
export class CreateRootNamespaceTs extends Vue {
  @Provide() validator: any = this.$validator
  activeAccount: StoreAccount
  app: AppInfo
  announceInLock: boolean
  isCosignatory: boolean
  transactionList = []
  formItems = cloneData(formDataConfig.rootNamespaceForm)
  formatAddress = formatAddress
  validation = validation
  activeMultisigAccountMultisigAccountInfo
  multisigAccountGraphInfo

  get wallet(): AppWallet {
    return this.activeAccount.wallet
  }

  get activeMultisigAccount(): string {
    return this.activeAccount.activeMultisigAccount
  }

  get address(): string {
    return this.activeAccount.wallet.address
  }

  get networkType(): NetworkType {
    return this.activeAccount.wallet.networkType
  }

  get networkCurrency() {
    return this.activeAccount.networkCurrency
  }

  get generationHash(): string {
    return this.app.networkProperties.generationHash
  }

  get node(): string {
    return this.activeAccount.node
  }

  get accountPublicKey(): string {
    return this.activeAccount.wallet.publicKey
  }

  get defaultFees(): DefaultFee[] {
    if (!this.activeMultisigAccount) return DEFAULT_FEES[FEE_GROUPS.SINGLE]
    if (!this.announceInLock) return DEFAULT_FEES[FEE_GROUPS.DOUBLE]
    if (this.announceInLock) return DEFAULT_FEES[FEE_GROUPS.TRIPLE]
  }

  get feeAmount(): number {
    const {feeSpeed} = this.formItems
    const feeAmount = this.defaultFees.find(({speed})=>feeSpeed === speed).value
    return getAbsoluteMosaicAmount(feeAmount, this.networkCurrency.divisibility)
  }

  get feeDivider(): number {
    if (!this.activeMultisigAccount) return 1
    if (!this.announceInLock) return 2
    if (this.announceInLock) return 3
  }

  createRootNamespace(): NamespaceRegistrationTransaction {
    const {networkType} = this.wallet
    const {rootNamespaceName, duration} = this.formItems
    const {feeAmount, feeDivider} = this

    return NamespaceRegistrationTransaction
      .createRootNamespace(
        Deadline.create(),
        rootNamespaceName,
        UInt64.fromUint(duration),
        networkType,
        UInt64.fromUint(feeAmount / feeDivider),
      )
  }

  async createBySelf() {
    this.transactionList = [this.createRootNamespace()]
  }

  createByMultisig() {
    const {feeAmount} = this
    const {multisigPublicKey} = this.formItems
    const {networkType} = this.wallet
    const fee = feeAmount / 3
    const rootNamespaceTransaction = this.createRootNamespace()

    if (this.announceInLock) {
      const aggregateTransaction = createBondedMultisigTransaction(
        [rootNamespaceTransaction],
        multisigPublicKey,
        networkType,
        fee,
      )

      this.transactionList = [aggregateTransaction]
      return
    }
    const aggregateTransaction = createCompleteMultisigTransaction(
      [rootNamespaceTransaction],
      multisigPublicKey,
      networkType,
      fee,
    )
    this.transactionList = [aggregateTransaction]
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
      })
    } catch (error) {
      console.error('RootNamespaceTs -> confirmViaTransactionConfirmation -> error', error)
    }
  }

  get lockParams(): LockParams {
    const {announceInLock, feeAmount, feeDivider} = this
    return new LockParams(announceInLock, feeAmount / feeDivider)
  }

  get duration(): number {
    const duration = Number(this.formItems.duration)
    return !duration || isNaN(duration) ? 0 : duration
  }

  get durationIntoDate(): string {
    return formatSeconds(this.duration * networkConfig.targetBlockTime)
  }

  get estimatedRentalFee(): string {
    const rentalFee = this.duration * this.app.networkProperties.fee
    return absoluteAmountToRelativeAmount(rentalFee, this.activeAccount.networkCurrency)
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

  @Watch('formItems.multisigPublicKey')
  onMultisigPublicKeyChange(newPublicKey, oldPublicKey) {
    if (!newPublicKey || newPublicKey === oldPublicKey) return
    this.$store.commit('SET_ACTIVE_MULTISIG_ACCOUNT', newPublicKey)
  }

  mounted() {
    this.resetFields()
    this.formItems.multisigPublicKey = this.accountPublicKey
  }
}
