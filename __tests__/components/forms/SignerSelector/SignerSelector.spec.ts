import {config, createLocalVue, shallowMount} from '@vue/test-utils'
import VueRouter from 'vue-router'
import iView from 'view-design'
import Vuex from 'vuex'
import VeeValidate from 'vee-validate'
// @ts-ignore
import SignerSelector from '@/components/forms/inputs/signer-selector/SignerSelector.vue'
import {accountState, accountGetters} from '@/store/account/index.ts'
import {appState} from '@/store/app/index.ts'
import {veeValidateConfig} from '@/core/validation/index.ts'
import VueRx from 'vue-rx'
import {
  CosignAccount,
  CosignWallet,
  current1Account,
  mosaics,
  mosaicsLoading,
  MultisigAccount,
  walletList,
  hdAccount,
  MultisigWallet,
  cosignWalletMultisigAccountGraphInfo,
} from '@MOCKS/index'

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

describe('SignerSelector', () => {
  let setActiveMultisigAccountMock

  let store
  let wrapper
  beforeEach(() => {
    setActiveMultisigAccountMock = jest.fn()

    store = new Vuex.Store({
      modules: {
        account: {
          state: Object.assign(accountState.state, {
            wallet: CosignWallet,
            mosaics,
            currentAccount: current1Account,
            multisigAccountGraphInfo: {
              [CosignWallet.address]: cosignWalletMultisigAccountGraphInfo,
            },
          }),
          mutations: {
            SET_ACTIVE_MULTISIG_ACCOUNT: setActiveMultisigAccountMock,
          },
          getters: accountGetters.getters,
        },
        app: {
          state: {walletList},
        },
      },
    })
    wrapper = shallowMount(SignerSelector, {
      sync: false,
      mocks: {
        $t: (msg) => msg,
      },
      localVue,
      store,
      router,
    })
  })

  it('should return a correct multisig public key list', async () => {
    // wrapper.setProps({value: CosignAccount.publicKey})
    expect(wrapper.vm.multisigPublicKeyList).toEqual({
      '8286C52C585471A6BEAAFE07C68EA004CF2DF5EE171A88596B26054FEAF4C8BC': 'SBIWHD-WZMPIX-XM2BIN-CRXAK3-H3MGA5-VHB3D2-PO5W (Multisig2Account)',
      'D483C074437097FC9847169528A9E04F421A7A6E49D293BFB1CD3EC995F8BF37': 'SB2FRR-M3SYAM-QL47RR-UKMQSR-JXJT3Q-PVAVWN-TXQX (MultisigAccount)',
      'F96D892CD86878A6714CEC06B86F7A0848A0BA9A73DE8F6C77E5F20C026620DF': 'SAY7N2-GP6JJB-FIRBTU-EXY2JJ-VOLGIZ-46KWIM-YB5T (CosignAccount)',
    })
  })


  it('should commit SET_ACTIVE_MULTISIG_ACCOUNT when a multisig account is selected', async () => {
    wrapper.setProps({value: CosignAccount.publicKey})
    await wrapper.vm.$nextTick()
    wrapper.setData({inputValue: MultisigAccount.publicKey})
    expect(wrapper.emitted().input[1]).toEqual([MultisigAccount.publicKey])
    expect(setActiveMultisigAccountMock.mock.calls[1][1]).toEqual(MultisigAccount.publicKey)
  })
})


describe('SignerSelector', () => {
  let setActiveMultisigAccountMock

  let store
  let wrapper
  beforeEach(() => {
    setActiveMultisigAccountMock = jest.fn()

    store = store = new Vuex.Store({
      modules: {
        account: {
          state: Object.assign(accountState.state, {
            wallet: CosignWallet,
            mosaics,
            currentAccount: current1Account,
          }),
          mutations: {
            SET_ACTIVE_MULTISIG_ACCOUNT: setActiveMultisigAccountMock,
          },
          getters: accountGetters.getters,
        },
        app: {
          state: Object.assign(appState.state, {mosaicsLoading}),
          // @ts-ignore
          walletList,
        },
      },
    },
    )
    wrapper = shallowMount(SignerSelector, {
      sync: false,
      mocks: {
        $t: (msg) => msg,
      },
      localVue,
      store,
      router,
    })
  })

  it('should commit SET_ACTIVE_MULTISIG_ACCOUNT with null when the address of the active wallet is selected', async () => {
    wrapper.setProps({value: CosignAccount.publicKey})
    wrapper.setData({inputValue: CosignAccount.publicKey})
    expect(wrapper.emitted().input[0]).toEqual([CosignAccount.publicKey])
    expect(setActiveMultisigAccountMock.mock.calls[0][1]).toEqual(null)
  })
})


describe('SignerSelector, no wallet list in store', () => {
  let setActiveMultisigAccountMock

  let store
  let wrapper
  beforeEach(() => {
    setActiveMultisigAccountMock = jest.fn()

    store = store = new Vuex.Store({
      modules: {
        account: {
          state: Object.assign(accountState.state, {
            wallet: CosignWallet,
            mosaics,
            currentAccount: current1Account,
          }),
          mutations: {
            SET_ACTIVE_MULTISIG_ACCOUNT: setActiveMultisigAccountMock,
          },
          getters: accountGetters.getters,
        },
        app: {
          state: {walletList: []},
        },
      },
    },
    )
    wrapper = shallowMount(SignerSelector, {
      sync: false,
      mocks: {
        $t: (msg) => msg,
      },
      localVue,
      store,
      router,
    })
  })


  it('should return a correct multisig public key list', async () => {
    wrapper.setProps({value: CosignAccount.publicKey})

    expect(wrapper.vm.multisigPublicKeyList).toEqual({ 
      '8286C52C585471A6BEAAFE07C68EA004CF2DF5EE171A88596B26054FEAF4C8BC': 'SBIWHD-WZMPIX-XM2BIN-CRXAK3-H3MGA5-VHB3D2-PO5W',
      'D483C074437097FC9847169528A9E04F421A7A6E49D293BFB1CD3EC995F8BF37': 'SB2FRR-M3SYAM-QL47RR-UKMQSR-JXJT3Q-PVAVWN-TXQX',
      'F96D892CD86878A6714CEC06B86F7A0848A0BA9A73DE8F6C77E5F20C026620DF': 'SAY7N2-GP6JJB-FIRBTU-EXY2JJ-VOLGIZ-46KWIM-YB5T',
    })
  })

  it('should should trigger value change when wallet changes', async () => {
    wrapper.setProps({value: CosignAccount.publicKey})
    expect(wrapper.vm.inputValue).toEqual(CosignAccount.publicKey)
    wrapper.vm.$store.state.account.wallet = CosignWallet
    expect(wrapper.vm.inputValue).toEqual(CosignAccount.publicKey)
    wrapper.vm.$store.state.account.wallet = MultisigWallet
    expect(wrapper.vm.inputValue).toEqual(MultisigWallet.publicKey)
  })
})


describe('SignerSelector, wallet without multisig account', () => {
  let setActiveMultisigAccountMock

  let store
  let wrapper
  beforeEach(() => {
    setActiveMultisigAccountMock = jest.fn()

    store = store = new Vuex.Store({
      modules: {
        account: {
          state: Object.assign(accountState.state, {
            wallet: hdAccount.wallets[0],
            mosaics,
            currentAccount: current1Account,
          }),
          mutations: {
            SET_ACTIVE_MULTISIG_ACCOUNT: setActiveMultisigAccountMock,
          },
          getters: accountGetters.getters,
        },
        app: {
          state: {walletList: []},
        },
      },
    },
    )
    wrapper = shallowMount(SignerSelector, {
      sync: false,
      mocks: {
        $t: (msg) => msg,
      },
      localVue,
      store,
      router,
    })
  })


  it('should return null when the active wallet has no multisig account', async () => {
    wrapper.setProps({value: hdAccount.wallets[0].publicKey})
    expect(wrapper.vm.multisigPublicKeyList).toEqual(null)
  })
})


