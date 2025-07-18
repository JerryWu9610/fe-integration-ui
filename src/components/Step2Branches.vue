<template>
  <div>
    <h2>步骤 2: 收集前端集成仓库的分支</h2>
    <el-form :model="store" label-width="150px">
      <el-form-item label="基线分支">
        <el-autocomplete
          v-model="store.feBaselineBranch"
          :fetch-suggestions="searchFeBranches"
          placeholder="请选择或输入基线分支"
          style="width: 500px;"
          @select="handleSelect"
        />
      </el-form-item>

      <el-form-item label="创建新分支">
        <el-switch v-model="store.createFeTargetBranch" @change="resetTargetBranchValidation" />
      </el-form-item>

      <el-form-item v-if="store.createFeTargetBranch" label="目标分支" :error="targetBranchError">
        <el-input
          v-model="store.feTargetBranch"
          placeholder="请输入目标分支名称"
          style="width: 500px;"
          @input="debouncedCheckBranch"
        >
          <template #suffix>
            <el-icon v-if="isCheckingBranch" class="is-loading">
              <Loading />
            </el-icon>
          </template>
          <template v-if="targetBranchExists" #append>
            <el-button @click="handleDeleteBranch" type="danger" plain>删除</el-button>
          </template>
        </el-input>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useIntegrationStore } from '@/store/integration';
import { getFeIntegrationBranches, deleteFeIntegrationBranch } from '@/api';
import { ElMessage, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';

const store = useIntegrationStore();
const targetBranchExists = ref(false);
const targetBranchError = ref<string | null>(null);
const isCheckingBranch = ref(false);

let debounceTimer: number;

const searchFeBranches = async (queryString: string, cb: (arg: any) => void) => {
  if (!store.product) {
    ElMessage.warning('请先选择一个产品');
    cb([]);
    return;
  }
  try {
    const branches = await getFeIntegrationBranches(store.product, queryString);
    const results = branches.map((branch: any) => ({ value: branch.name }));
    cb(results);
  } catch (error) {
    console.error('搜索分支失败:', error);
    cb([]);
  }
};

const checkBranchExists = async () => {
  // Loading state is set in debouncedCheckBranch
  try {
    const branches = await getFeIntegrationBranches(store.product, store.feTargetBranch);
    const exists = branches.some((branch: any) => branch.name === store.feTargetBranch);
    targetBranchExists.value = exists;
    if (exists) {
      targetBranchError.value = '目标分支已存在';
      store.isFeTargetBranchValid = false;
    } else {
      targetBranchError.value = null;
      store.isFeTargetBranchValid = true;
    }
  } catch (error) {
    console.error('检查分支是否存在失败:', error);
    targetBranchError.value = '验证失败，请重试';
    store.isFeTargetBranchValid = false;
  } finally {
    isCheckingBranch.value = false;
    store.isFeTargetBranchValidating = false;
  }
};

const debouncedCheckBranch = () => {
  clearTimeout(debounceTimer);

  // Immediately invalidate and show loading icon upon input
  store.isFeTargetBranchValid = false;
  targetBranchError.value = null;
  targetBranchExists.value = false;

  if (!store.feTargetBranch) {
    resetTargetBranchValidation();
    return;
  }

  isCheckingBranch.value = true;
  store.isFeTargetBranchValidating = true;

  debounceTimer = setTimeout(() => {
    checkBranchExists();
  }, 500);
};

const handleDeleteBranch = async () => {
  try {
    await deleteFeIntegrationBranch(store.product, store.feTargetBranch);
    ElMessage.success('分支删除成功');

    // Re-validate the branch name after deletion.
    isCheckingBranch.value = true;
    store.isFeTargetBranchValidating = true;
    store.isFeTargetBranchValid = false; // Disable next while checking
    targetBranchExists.value = false;
    targetBranchError.value = null;
    
    await checkBranchExists();
  } catch (error) {
    console.error('删除分支失败:', error);
    ElMessage.error('分支删除失败');
  }
};

const resetTargetBranchValidation = () => {
  targetBranchExists.value = false;
  targetBranchError.value = null;
  // An empty input is invalid if we intend to create a new branch.
  store.isFeTargetBranchValid = !store.createFeTargetBranch;
  isCheckingBranch.value = false;
  store.isFeTargetBranchValidating = false;
};

// 当不创建新分支时，重置验证状态
watch(() => store.createFeTargetBranch, (newValue) => {
  if (!newValue) {
    resetTargetBranchValidation();
  }
});

const handleSelect = (item: any) => {
  console.log('selected', item);
};
</script> 