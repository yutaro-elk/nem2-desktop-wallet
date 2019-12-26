import {mapState} from 'vuex'
import {Component, Vue} from 'vue-property-decorator'
import {networkTypeConfig} from '@/config/view/setting'
import {formDataConfig} from "@/config/view/form";
import trezor from '@/core/utils/trezor';
import {Address, NetworkType} from 'nem2-sdk';
import {ExtendedKey, KeyEncoding} from "nem2-hd-wallets";
import {AppInfo, StoreAccount, AppWallet} from '@/core/model'
import {CreateWalletType} from '@/core/model/CreateWalletType'
import {NemLedger} from '@/core/utils/ledger'
import "regenerator-runtime";
import TransportWebUSB from "@ledgerhq/hw-transport-webusb"

@Component({
    computed: {
        ...mapState({
            activeAccount: 'account',
            app: 'app'
        })
    }
})
export class WalletImportLedgerTs extends Vue {
    activeAccount: StoreAccount
    app: AppInfo
    NetworkTypeList = networkTypeConfig
    account = {}
    showCheckPWDialog = false
    ledgerForm = formDataConfig.ledgerImportForm

    // created(){
    //     // prefill the form fields based on number of existing ledger wallets
    //     // use MIJIN_TEST by default
    //     this.ledgerForm = this.getDefaultFormValues(NetworkType.MIJIN_TEST);
    // }

    toWalletDetails() {
        this.$Notice.success({
            title: this['$t']('Imported_wallet_successfully') + ''
        })
        this.$router.push('dashBoard')
    }

    toBack() {
        this.$router.push('initAccount')
    }

    onNetworkSelected(){
        this.ledgerForm = this.getDefaultFormValues(this.ledgerForm.networkType);
    }

    numExistingLedgerWallets(networkType){
        const existingLedgerWallets = this.app.walletList.filter(wallet => {
            return wallet.sourceType === CreateWalletType.ledger && wallet.networkType === networkType
        });

        return existingLedgerWallets.length;
    }

    getDefaultFormValues(networkType) {
        const numExistingLedgerWallets = this.numExistingLedgerWallets(networkType);
        const networkName = networkTypeConfig.find(network => network.value === networkType).label;

        return {
            networkType: networkType,
            accountIndex: numExistingLedgerWallets,
            walletName: `${networkName} Ledger Wallet ${numExistingLedgerWallets + 1}`
        }
    }

    async importAccountFromLedger() {
        const { accountIndex, networkType, walletName } = this.ledgerForm

        this.$store.commit('SET_UI_DISABLED', {
            isDisabled: true,
            message: "ledger_awaiting_interaction"
        });

        try {
            const transport = await TransportWebUSB.create();
            const nemH = new NemLedger(transport, "NEM");
            const accountResult = await nemH.getAccount(`m/44'/43'/${networkType}'/0'/${accountIndex}'`)
            
            const { address, publicKey, path } = accountResult;

            new AppWallet().createFromLedger(
                walletName,
                networkType,
                path,
                publicKey.toUpperCase(),
                address,
                this.$store
            );

            this.toWalletDetails();

            this.$store.commit('SET_UI_DISABLED', {
                isDisabled: false,
                message: ""
            });

        } catch (e) {
            this.$store.commit('SET_UI_DISABLED', {
                isDisabled: false,
                message: ""
            });
            this.$Notice.error({
                title: this['$t']('CONDITIONS_OF_USE_NOT_SATISFIED') + ''
            })
        }
    }
}