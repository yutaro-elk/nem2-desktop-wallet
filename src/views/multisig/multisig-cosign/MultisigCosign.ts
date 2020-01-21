import {Component, Vue, Watch, Provide} from 'vue-property-decorator'
import {Address, MultisigAccountGraphInfo} from 'nem2-sdk'
import {mapState, mapGetters} from 'vuex'
import {StoreAccount, TransactionCategories} from '@/core/model'
import {setPartialTransactions} from '@/core/services/multisig/partialTransactions'
import TransactionList from '@/components/transaction-list/TransactionList.vue'
import MultisigTree from '@/views/multisig/multisig-tree/MultisigTree.vue'
import ErrorTooltip from '@/components/other/forms/errorTooltip/ErrorTooltip.vue'
import DisabledForms from '@/components/disabled-forms/DisabledForms.vue'
import {flattenArray} from '@/core/utils'

@Component({
  components: {TransactionList, MultisigTree, ErrorTooltip, DisabledForms},
  computed: {
    ...mapState({activeAccount: 'account'}),
    ...mapGetters({
      isCosignatory: 'isCosignatory',
      multisigAccountGraphInfo: 'multisigAccountGraphInfo',
    }),
  },
})
export class MultisigCosignTs extends Vue {
  @Provide() validator: any = this.$validator
  activeAccount: StoreAccount
  multisigAccountGraphInfo: MultisigAccountGraphInfo
  isCosignatory: boolean
  currentAddress = ''
  TransactionCategories = TransactionCategories

  get wallet() {
    return this.activeAccount.wallet
  }

  get address() {
    return this.activeAccount.wallet ? this.activeAccount.wallet.address : null
  }

  get multisigAccounts(): Record<string, string> {
    if (!this.isCosignatory || !this.multisigAccountGraphInfo) return null
    const {multisigAccounts} = this.multisigAccountGraphInfo
    return flattenArray(
      [...multisigAccounts.keys()]
        .sort() // Level closer to parent first
        .map(key => multisigAccounts.get(key))
        .map(multisigAccountInfo => multisigAccountInfo
          .map(({account}) => account),
        ),
    ).reduce((acc, {publicKey, address}) => ({...acc, [publicKey]: address.pretty()}), {})
  }


  get targetAddress(): Address {
    return this.currentAddress === ''
      ? Address.createFromRawAddress(this.wallet.address)
      : Address.createFromRawAddress(this.currentAddress)
  }

  async submit() {
    this.$validator
      .validate()
      .then((valid) => {
        if (!valid) return
        this.getTransactionsToCosign()
      })
  }

  getTransactionsToCosign() {
    setPartialTransactions(this.targetAddress, this.$store)
  }

  async refreshAll() {
    this.$store.state.app.partialTransactionsFetcher.startFetchingRound()
  }

  @Watch('address', {immediate: false})
  async onGetWalletChange(newAddress: string, oldAddress: string) {
    if (newAddress && newAddress !== oldAddress) {
      this.$store.state.app.partialTransactionsFetcher.startFetchingRound()
    }
  }

  async created() {
    this.$store.state.app.partialTransactionsFetcher.startFetchingRound()
  }
}
