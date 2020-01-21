import {shallowMount, config, createLocalVue} from '@vue/test-utils'
import VueRouter from 'vue-router'
import iView from 'view-design'
import Vuex from 'vuex'
import VeeValidate from 'vee-validate'
// @ts-ignore
import MultisigCosign from '@/views/multisig/multisig-cosign/MultisigCosign.vue'
import {accountMutations, accountState, accountGetters} from '@/store/account'
import {appMutations, appState} from '@/store/app'
import {veeValidateConfig} from '@/core/validation'
import VueRx from 'vue-rx'
import {
  mosaics,
  CosignWallet,
} from '@MOCKS/index'
import {AppWallet} from '@/core/model'
// @ts-ignore
const localVue = createLocalVue()
const router = new VueRouter()
localVue.use(VueRouter)
localVue.use(iView)
localVue.use(Vuex)
localVue.use(VeeValidate, veeValidateConfig)
localVue.use(VueRx)
localVue.directive('focus', {
  inserted: function (el) {
    el.focus()
  },
})
// close warning
config.logModifiedComponents = false

const mockStartFetchingRound = jest.fn()
const mockPartialTransactionFetcher = {
  startFetchingRound: mockStartFetchingRound,
}

const mockStore = new Vuex.Store({
  modules: {
    account: {
      state: Object.assign(accountState.state, {
        wallet: AppWallet.createFromDTO(CosignWallet),
        mosaics,
      }),
      mutations: accountMutations.mutations,
      getters: accountGetters.getters,
    },
    app: {
      state: {
        ...appState.state, 
        partialTransactionsFetcher: mockPartialTransactionFetcher,
      },
      mutations: appMutations.mutations,
    },
  },
})

describe('MultisigCosign', () => {
  beforeEach(() => {
    mockStartFetchingRound.mockClear()
    shallowMount(MultisigCosign, {
      sync: false,
      mocks: {
        $t: (msg) => msg,
      },
      localVue,
      store: mockStore,
      router,
    })
  })

  it('Should call partialTransactionsFetcher.startFetchingRound', () => {
    expect(mockStartFetchingRound).toBeCalledTimes(1)
  })
})
