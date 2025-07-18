<template>
  <div>
    <h2>步骤 1: 选择需要进行集成的产品</h2>
    <el-form label-width="120px">
      <el-form-item label="产品">
        <el-select v-model="store.product" placeholder="请选择产品" filterable>
          <el-option
            v-for="item in store.products"
            :key="item.key"
            :label="item.name"
            :value="item.key"
          />
        </el-select>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useIntegrationStore } from '@/store/integration';

const store = useIntegrationStore();

onMounted(() => {
  store.fetchProducts();
});
</script> 