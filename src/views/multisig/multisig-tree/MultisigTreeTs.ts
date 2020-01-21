import {PublicAccount, MultisigAccountInfo, MultisigAccountGraphInfo} from 'nem2-sdk'
import {mapState, mapGetters} from 'vuex'
import {Component, Vue} from 'vue-property-decorator'
import {MULTISIG_INFO} from '@/config/index.ts'
import {StoreAccount, AppWallet} from '@/core/model'
import {formatAddress} from '@/core/utils'
import {GraphInfoService} from '@/core/services'

@Component({
  computed: {
    ...mapState({
      activeAccount: 'account',
    }),
    ...mapGetters({
      multisigAccountInfo: 'multisigAccountInfo',
      multisigAccountGraphInfo: 'multisigAccountGraphInfo',
    }),
  },
})
export class MultisigTreeTs extends Vue {
  activeAccount: StoreAccount
  formatAddress = formatAddress
  multisigAccountInfo: MultisigAccountInfo
  multisigAccountGraphInfo: MultisigAccountGraphInfo

  get wallet(): AppWallet {
    return this.activeAccount.wallet
  }

  get currentAccountMultisigInfo(): MultisigAccountInfo {
    return this.multisigAccountInfo
  }

  get multisigTreeData() {
    if (!this.currentAccountMultisigInfo) return null
    const {multisigAccounts} = this.currentAccountMultisigInfo
    if (!multisigAccounts) return null

    return [{
      title: MULTISIG_INFO.MULTISIG_ACCOUNTS,
      expand: true,
      children: this.getChildrenFromPublicAccounts(multisigAccounts),
    }]
  }

  get cosignatoryTreeData() {
    if (!this.currentAccountMultisigInfo) return null
    const {cosignatories} = this.currentAccountMultisigInfo
    if (!cosignatories) return null

    return [{
      title: MULTISIG_INFO.COSIGNATORIES,
      expand: true,
      children: this.getChildrenFromPublicAccounts(cosignatories),
    }]
  }

  getChildrenFromPublicAccounts(publicAccounts: PublicAccount[]) {
    return publicAccounts.map(publicAccount => this.getChildFromPublicAccount(publicAccount))
  }

  getChildFromPublicAccount(child: PublicAccount) {
    const multisigAccountInfo = GraphInfoService.getMultisigAccountInfo(
      child.publicKey, this.multisigAccountGraphInfo,
    )

    return {
      title: child.address.pretty(),
      children: [
        {title: MULTISIG_INFO.PUBLIC_KEY + child.publicKey},
        {
          title: MULTISIG_INFO.MIN_APPROVAL + (multisigAccountInfo.minApproval),
          publicKey: child.publicKey,
        },
        {
          title: MULTISIG_INFO.MIN_REMOVAL + (multisigAccountInfo.minRemoval),
          publicKey: child.publicKey,
        },
      ],
    }
  }

  refreshMultisigData() {
    this.wallet.setMultisigStatus(this.$store)
  }
}
