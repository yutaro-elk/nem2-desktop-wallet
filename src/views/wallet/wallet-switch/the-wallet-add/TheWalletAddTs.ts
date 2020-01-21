import {mapState} from 'vuex'
import {Component, Vue, Prop, Provide} from 'vue-property-decorator'
import {validation} from '@/core/validation'
import {AppInfo, AppWallet, StoreAccount, Notice, NoticeType} from '@/core/model'
import CheckPassword from '@/components/forms/check-password/CheckPassword.vue'
import {APP_PARAMS, Message} from '@/config'
import {Password} from 'nem2-sdk'
import ErrorTooltip from '@/components/other/forms/errorTooltip/ErrorTooltip.vue'

@Component({
  computed: {...mapState({activeAccount: 'account', app: 'app' })},
  components: {CheckPassword, ErrorTooltip},
})
export class TheWalletAddTs extends Vue {
  @Provide() validator: any = this.$validator
  activeAccount: StoreAccount
  validation = validation
  walletName = ''
  app: AppInfo

  @Prop({default: false})
  visible: boolean

  get show(): boolean {
    return this.visible
  }

  set show(val) {
    if (!val) {
      this.$emit('close')
    }
  }

  get walletList() {
    return this.app.walletList
  }

  get currentAccount() {
    return this.activeAccount.currentAccount
  }

  get pathToCreate() {
    const seedPathList = this.walletList.filter(item => item.path).map(item => {
      // remove string before wallet index
      const pathContent = item.path.substring(10)
      // get wallet index without `
      return pathContent.substring(0,pathContent.indexOf('/') - 1)
    }).sort()
    // get the min invalid index
    const jumpedPath = seedPathList
      .map(a => Number(a))
      .sort()
      .map((element, index) => {
        if (element == index) return index
      })
      .filter(x => x !== undefined)
    return jumpedPath.length
  }


  passwordValidated(password) {
    if (!password) return
    const {pathToCreate, walletName, currentAccount} = this
    const networkType = currentAccount.networkType
    this.$validator
      .validate()
      .then((valid) => {
        if (!valid) return
        try {
          new AppWallet().createFromPath(
            walletName,
            new Password(password),
            pathToCreate,
            networkType,
            this.$store,
          )
          this.show = false
        } catch (error) {
          throw new Error(error)
        }
      })
  }

  mounted() {
    this.walletName = APP_PARAMS.SEED_WALLET_NAME_PREFIX + (this.pathToCreate + 1)
  }
}
