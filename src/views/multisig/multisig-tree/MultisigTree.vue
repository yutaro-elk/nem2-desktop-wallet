<template>
  <div>
    <div class="header-section">
      <div class="header-left">
        <div>
          <span class="green">{{ $t('min_approval') }}:</span>
          {{ currentAccountMultisigInfo ? currentAccountMultisigInfo.minApproval : 0 }}
        </div>
        <div>
          <span class="green">{{ $t('min_removal') }}:</span>
          {{ currentAccountMultisigInfo ? currentAccountMultisigInfo.minRemoval : 0 }}
        </div>
      </div>

      <div class="header-right">
        <img
          class="refresh-icon"
          src="@/common/img/wallet/wallet-detail/refresh.png"
          @click="refreshMultisigData()"
        >
      </div>
    </div>

    <Tree
      v-if="multisigTreeData"
      :data="multisigTreeData"
    />
    <Tree
      v-if="cosignatoryTreeData"
      :data="cosignatoryTreeData"
    />
  </div>
</template>

<script lang="ts">
import {MultisigTreeTs} from './MultisigTreeTs'

export default class MultisigTree extends MultisigTreeTs {
}
</script>
<style scoped lang="less">
.header-section {
  clear: both;
  display: block;
  overflow: hidden;
  width: 100%;
}

.header-left {
  display: block;
  float: left;
  width: 50%;
  padding: 5px 0 0 18px;
}

.header-right {
  display: block;
  float: left;
  width: 50%;
  padding-right: 18px;
}

.refresh-icon {
  height: 50px;
  display: block;
  float: right;
  margin-right: 14px;
  cursor: pointer;
}

</style>
