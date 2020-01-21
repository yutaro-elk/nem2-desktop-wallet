import {Component, Prop, Vue, Watch} from 'vue-property-decorator'
import {Address, MultisigAccountGraphInfo} from 'nem2-sdk'
import {mapState, mapGetters} from 'vuex'
import {StoreAccount, AppInfo, AppWallet} from '@/core/model'
import {flattenArray} from '@/core/utils'

@Component({
  computed: {
    ...mapState({activeAccount: 'account', app: 'app'}),
    ...mapGetters({
      isCosignatory: 'isCosignatory',
      multisigAccountGraphInfo: 'multisigAccountGraphInfo',
    }),
  },
})
export class SignerSelectorTs extends Vue {
  activeAccount: StoreAccount
  app: AppInfo
  multisigAccountGraphInfo: MultisigAccountGraphInfo
  isCosignatory: boolean

  @Prop() value: string

  @Prop({default: false}) hideActiveAccount: boolean

  get inputValue(): string {
    return this.value
  }

  set inputValue(newPublicKey) {
    if (newPublicKey === this.wallet.publicKey) {
      this.$store.commit('SET_ACTIVE_MULTISIG_ACCOUNT', null)
    } else {
      this.$store.commit('SET_ACTIVE_MULTISIG_ACCOUNT', newPublicKey)
    }
    this.$emit('input', newPublicKey)
  }

  get accountPublicKey(): string {
    return this.activeAccount.wallet.publicKey
  }

  get wallet(): AppWallet {
    return this.activeAccount.wallet
  }

  getMultisigAccountLabel(publicKey: string): string {
    
    const address = Address.createFromPublicKey(publicKey, this.wallet.networkType)
    const walletFromList = this.app.walletList.find(wallet => wallet.address === address.plain())
    if (walletFromList === undefined) return address.pretty()
    return `${address.pretty()} (${walletFromList.name})`
  }

  get multisigPublicKeyList(): Record <string, string> {
    const {accountPublicKey} = this
    if (!this.isCosignatory || !this.multisigAccountGraphInfo) return null
    const {multisigAccounts} = this.multisigAccountGraphInfo
    const sendersMap = flattenArray(
      [...multisigAccounts.keys()]
        .sort() // Level closer to parent first
        .map(key => multisigAccounts.get(key))
        .map(multisigAccountInfo => multisigAccountInfo
          .map(({account}) => ({
            publicKey: account.publicKey,
            label: this.getMultisigAccountLabel(account.publicKey),
          }))
          .filter(({publicKey}) => publicKey !== accountPublicKey),
        ),
    ).reduce((acc, {publicKey, label}) => ({...acc, [publicKey]: label}), {})

    return this.hideActiveAccount
      ? sendersMap
      : {
        ...{[accountPublicKey]: this.getMultisigAccountLabel(accountPublicKey)},
        ...sendersMap,
      }
  }

  @Watch('wallet', {deep: true, immediate: true})
  onWalletChange(newVal, oldVal) {
    if (!newVal || !newVal.publicKey) return
    if (!oldVal || newVal.publicKey !== oldVal.publicKey) {
      this.inputValue = newVal.publicKey
    }
  }
}
