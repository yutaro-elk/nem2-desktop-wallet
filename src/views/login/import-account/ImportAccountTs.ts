import {Vue, Component} from 'vue-property-decorator'
import {importStepBarTitleList, importLedgerStepBarTitleList} from "@/config/view"
import routes from '@/router/routers'

@Component
export default class ImportAccountTs extends Vue {
    stepBarTitleList = []

    created() {
        const {isLedger} = this.$route.meta
        this.stepBarTitleList = importStepBarTitleList
        if (isLedger) {
            this.stepBarTitleList = importLedgerStepBarTitleList
        }   
    }

    get currentRouterIndex() {
        // const {name} = this.$route
        // // @ts-ignore
        // return routes[0].children[7].children[3].children.findIndex(item => item.name == name) + 1
        const {index} = this.$route.meta               
        return index
    }

    getStepTextClassName(index) {
        return Number(this.currentRouterIndex) > index ? 'white' : 'gray'
    }
}
