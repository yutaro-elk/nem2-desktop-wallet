import {Vue, Component, Provide} from 'vue-property-decorator'
import {AppInfo, AppWallet, StoreAccount, AppAccounts, HdWallet} from '@/core/model'
import ErrorTooltip from '@/components/other/forms/errorTooltip/ErrorTooltip.vue'
import {Password} from 'nem2-sdk'
import {mapState} from 'vuex'
import {Message} from '@/config'
import {validation} from '@/core/validation'
@Component({
  computed: {
    ...mapState({
      activeAccount: 'account',
      app: 'app',
    }),
  },
  components:{
    ErrorTooltip,
  },
})
export default class ImportMnemonicTs extends Vue {
  @Provide() validator: any = this.$validator
  validation = validation
  seed = ''
  activeAccount: StoreAccount
  app: AppInfo

  get accountName() {
    return this.activeAccount.currentAccount.name
  }

  get networkType() {
    return this.activeAccount.currentAccount.networkType
  }

  get password() {
    return this.activeAccount.temporaryLoginInfo.password
  }

  submit() {
    const {seed, password} = this
    this.$validator
      .validate()
      .then((valid) => {
        if (!valid) return
        try {
          new AppWallet().createAccountFromMnemonic(
            new Password(password),
            seed,
            this.$store,
          )
          this.$store.commit('SET_TEMPORARY_MNEMONIC', this.seed)
          this.$router.push('walletChoose')
        } catch (error) {
          this.$Notice.error({title: `${this.$t('Creation_failed')}`})
          throw new Error(error)
        }
      })
  }

  goToCreateAccountInfo() {
    AppAccounts().deleteAccount(this.accountName)
    this.$router.push('inputAccountInfo')
  }
}
