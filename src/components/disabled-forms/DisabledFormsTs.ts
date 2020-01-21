import {Component, Vue} from 'vue-property-decorator'
import {mapState, mapGetters} from 'vuex'
import {AppInfo, StoreAccount} from '@/core/model'
import {Message} from '@/config'

@Component({
  computed: {
    ...mapState({
      activeAccount: 'account',
      app: 'app',
    }),
    ...mapGetters({
      isMultisig: 'isMultisig',
    }),
  },
})
export class DisabledFormsTs extends Vue {
  activeAccount: StoreAccount
  app: AppInfo
  isMultisig: boolean

  get hasNetworkCurrency(): boolean {
    return Boolean(this.app
        && this.app.networkProperties
        && this.app.networkProperties.generationHash)
  }

  get active(): boolean {
    return !this.hasNetworkCurrency || this.isMultisig
  }

  get alertMessage(): string {
    if (!this.hasNetworkCurrency) return Message.NO_NETWORK_CURRENCY
    if (this.isMultisig) return Message.MULTISIG_ACCOUNTS_NO_TX
    return ''
  }
}
