<template>
  <div class="step-4">
    <el-form label-width="150px">
      <el-form-item label="整包集成基线分支">
        <el-select
          v-model="fullIntegrationBaselineBranch"
          placeholder="可选：请选择或输入基线分支以查看变更"
          filterable
          clearable
          remote
          :remote-method="searchFullIntegrationBranches"
          :loading="branchSearchLoading"
        >
          <el-option
            v-for="branch in fullIntegrationBranches"
            :key="branch.name"
            :label="branch.name"
            :value="branch.name"
          />
        </el-select>
      </el-form-item>
    </el-form>

    <div v-if="fullIntegrationBaselineBranch && commitChanges.length > 0" class="commit-changes">
      <h3>业务仓库变更对比：</h3>
      <el-collapse v-model="activeCollapse">
        <el-collapse-item
          v-for="change in commitChanges"
          :key="change.repoName"
          :title="change.repoName"
          :name="change.repoName"
        >
          <div v-if="change.newCommits && change.newCommits.length > 0">
            <h4>新增提交:</h4>
            <ul>
              <li v-for="commit in change.newCommits" :key="commit.short_id">
                <code>{{ commit.short_id }}</code> - {{ commit.title }} ({{
                  commit.author_name
                }})
              </li>
            </ul>
          </div>
          <div
            v-if="change.removedCommits && change.removedCommits.length > 0"
          >
            <h4>移除提交:</h4>
            <ul>
              <li
                v-for="commit in change.removedCommits"
                :key="commit.short_id"
              >
                <code>{{ commit.short_id }}</code> - {{ commit.title }} ({{
                  commit.author_name
                }})
              </li>
            </ul>
          </div>
          <div
            v-if="
              (!change.newCommits || change.newCommits.length === 0) &&
              (!change.removedCommits || change.removedCommits.length === 0)
            "
          >
            <p>没有变更。</p>
          </div>
        </el-collapse-item>
      </el-collapse>
    </div>
    <div v-if="fullIntegrationBaselineBranch && !commitChanges.length" class="commit-changes">
        <p>未检测到业务仓库的 Commit 变更。</p>
    </div>


    <div class="footer-buttons">
      <el-button
        type="primary"
        @click="submitIntegration"
        :loading="isSubmitting"
        :disabled="isSubmitting"
      >
        提交并触发打包
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useIntegrationStore } from '@/store/integration';
import { storeToRefs } from 'pinia';
import {
  getFullIntegrationRepoInfo,
  compareFeIntegration,
  getFullIntegrationBranches,
  commitFeIntegrationAndPack,
} from '@/api';
import type { RepoChanges } from '@/store/integration';

const store = useIntegrationStore();
const { product, updatedBusinessPackages, fullIntegrationBaselineBranch } =
  storeToRefs(store);

const fullIntegrationBranches = ref<{ name: string; protected: boolean }[]>([]);
const branchSearchLoading = ref(false);
const commitChanges = ref<RepoChanges[]>([]);
const activeCollapse = ref<string[]>([]);

const searchFullIntegrationBranches = async (query: string) => {
  if (!query) {
    fullIntegrationBranches.value = [];
    return;
  }
  branchSearchLoading.value = true;
  try {
    const branches = await getFullIntegrationBranches(product.value, query);
    fullIntegrationBranches.value = branches;
  } catch (error) {
    console.error('获取整包集成分支失败', error);
  } finally {
    branchSearchLoading.value = false;
  }
};

const fetchCommitChanges = async (baselineBranch: string) => {
  if (!baselineBranch) {
    commitChanges.value = [];
    return;
  }
  try {
    // 1. 根据整包基线分支获取前端集成的 commitId
    const { version: fromCommit } = await getFullIntegrationRepoInfo({
      product: product.value,
      ref: baselineBranch,
    });

    // 2. 获取业务包变更
    const toRepo = updatedBusinessPackages.value;

    const changes: RepoChanges[] = await compareFeIntegration({
      product: product.value,
      fromCommit,
      toRepo,
    });
    commitChanges.value = changes;
    store.fullIntegrationRepoChanges = changes; // <-- Save to store
    activeCollapse.value = changes.map((c) => c.repoName); // 默认展开所有
  } catch (error) {
    console.error('获取变更对比失败', error);
  }
};

watch(fullIntegrationBaselineBranch, (newVal) => {
  if (newVal) {
    fetchCommitChanges(newVal);
  } else {
    commitChanges.value = [];
  }
});

const isSubmitting = ref(false);

const submitIntegration = async () => {
  isSubmitting.value = true;
  // Clear changes if baseline is empty, so step 5 knows not to show MR info
  if (!fullIntegrationBaselineBranch.value) {
    store.fullIntegrationRepoChanges = [];
  }
  
  try {
    const payload = {
      product: product.value,
      baselineBranch: store.feBaselineBranch,
      targetBranch: store.feTargetBranch,
      businessRepo: updatedBusinessPackages.value,
    };
    const response = await commitFeIntegrationAndPack(payload);
    store.pipelineHistoryId = response.pipelineHistoryId;
    store.feIntegrationCommitId = response.commitId;
    store.nextStep();
  } catch (error) {
    console.error('提交集成失败', error);
    // 可选: 显示错误提示
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.step-4 {
  padding: 20px;
}
.commit-changes {
  margin-top: 20px;
}
.footer-buttons {
  text-align: center;
  margin-top: 20px;
}
ul {
  padding-left: 20px;
  list-style: disc;
}
li {
  margin-bottom: 5px;
}
h4 {
  margin-top: 0;
}
</style> 