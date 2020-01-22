import {Endpoint} from '@/core/model'
import {NetworkType} from 'nem2-sdk'

export const defaultNodeList: Endpoint[] = [
  {
    value: 'http://api-xym-harvest-20.ap-northeast-1.nemtech.network:3000',
    name: 'ap-northeast-1',
    url: 'api-xym-harvest-20.ap-northeast-1.nemtech.network',
    networkType:NetworkType.TEST_NET,
  },
  {
    value: 'http://api-xym-harvest-20.ap-southeast-1.nemtech.network:3000',
    name: 'ap-southeast-1',
    url: 'api-xym-harvest-20.ap-southeast-1.nemtech.network',
    networkType:NetworkType.TEST_NET,
  },
  {
    value: 'http://api-xym-harvest-20.eu-west-1.nemtech.network:3000',
    name: 'eu-west-1',
    url: 'api-xym-harvest-20.eu-west-1.nemtech.network',
    networkType:NetworkType.TEST_NET,
  },
  {
    value: 'http://api-xym-harvest-20.us-west-1.nemtech.network:3000',
    name: 'us-west-1',
    url: 'api-xym-harvest-20.us-west-1.nemtech.network',
    networkType:NetworkType.TEST_NET,
  },
  {
    value: 'http://api-xym-20.us-west-1.nemtech.network:3000',
    name: 'us-west-1',
    url: 'api-xym-20.us-west-1.nemtech.network',
    networkType:NetworkType.TEST_NET,

  },
  {
    value: 'http://localhost:3000',
    name: 'http://localhost:3000',
    url: 'http://localhost:3000',
    networkType:NetworkType.MAIN_NET,
  },
  {
    value: 'http://localhost:3000',
    name: 'http://localhost:3000',
    url: 'http://localhost:3000',
    networkType:NetworkType.MIJIN,
  },
  {
    value: 'http://localhost:3000',
    name: 'http://localhost:3000',
    url: 'http://localhost:3000',
    networkType:NetworkType.MIJIN_TEST,
  },
]

export const explorerUrlHead = 'http://explorer.nemtech.network/transaction/'
export const explorerLinkList = [
  {
    explorerBasePath: 'http://explorer.nemtech.network/transaction/',
    networkType: NetworkType.TEST_NET,
  },
  {
    explorerBasePath: 'http://explorer.mt.nemtech.network/transaction/',
    networkType: NetworkType.MIJIN_TEST,
  },
]
