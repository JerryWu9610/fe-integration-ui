<template>
  <div class="step-5-pack">
    <div class="packing-status">
      <h3>打包状态</h3>
      <div class="stages">
        <el-steps :active="activeStage">
          <el-step
            v-for="stage in packingStages"
            :key="stage.name"
            :title="stage.name"
            :status="stage.status"
          />
        </el-steps>
      </div>
    </div>

    <template v-if="fullIntegrationBaselineBranch">
      <el-divider />

      <div class="merge-request-form">
        <h3>提交合并请求</h3>
        <el-form label-width="120px" :disabled="isFormDisabled">
          <el-form-item label="目标分支" :error="targetBranchError">
            <el-input
              v-model="fullIntegrationTargetBranch"
              placeholder="请输入目标分支名称"
              @input="debouncedCheckBranch"
            >
              <template #suffix>
                <el-icon v-if="isCheckingBranch" class="is-loading">
                  <Loading />
                </el-icon>
              </template>
              <template #append>
                <el-button v-if="!fullIntegrationTargetBranch" @click="fillFromBaseline">使用基线分支</el-button>
                <el-button v-if="targetBranchExists" @click="handleDeleteBranch" type="danger" plain>删除</el-button>
              </template>
            </el-input>
          </el-form-item>
          <el-form-item label="合并请求描述">
            <el-input
              type="textarea"
              :rows="16"
              v-model="mergeRequestDescription"
              placeholder="请输入合并请求的描述"
              :disabled="isMrDescriptionDisabled"
            />
          </el-form-item>
        </el-form>
      </div>
      <div class="footer-buttons">
        <el-button
          type="primary"
          :loading="isSubmitting"
          :disabled="isSubmitDisabled"
          @click="submitMergeRequest"
        >
          提交
        </el-button>
        <el-button
          :type="isAutoSubmitting ? 'danger' : 'success'"
          :loading="isSubmitting"
          :disabled="isAutoSubmitDisabled"
          @click="toggleAutoSubmit"
        >
          {{ isAutoSubmitting ? '取消自动提交' : '打包后自动提交' }}
        </el-button>
      </div>
    </template>
    
    <div v-else class="no-mr-info">
        <el-alert
            title="仅执行打包"
            type="info"
            description="由于未在上一提供整包集成基线分支，本次将仅执行打包流程，完成后不会创建合并请求。"
            show-icon
            :closable="false"
        />
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage, ElIcon } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { useIntegrationStore } from '@/store/integration';
import { storeToRefs } from 'pinia';
import {
  getFePackStatus,
  getFullIntegrationBranches,
  commitFullIntegration,
  autoCommitFullIntegration,
  cancelAutoCommitFullIntegration,
  deleteFullIntegrationBranch,
} from '@/api';

const store = useIntegrationStore();
const {
  product,
  pipelineHistoryId,
  feIntegrationCommitId,
  fullIntegrationBaselineBranch,
  fullIntegrationTargetBranch,
  mergeRequestDescription,
  autoCommitRequestId,
} = storeToRefs(store);

// Packing Status
const packingStages = ref<{ name: string; status: string }[]>([]);
const isPackCompleted = ref(false);
let pollingTimer: number | undefined;

// Merge Request Form
const isCheckingBranch = ref(false);
const targetBranchExists = ref(false);
const targetBranchError = ref<string | null>(null);
const isTargetBranchValid = ref(false);
const isSubmitting = ref(false);
const isAutoSubmitting = ref(!!store.autoCommitRequestId);

let debounceTimer: number;

// Computed properties
const packingProgress = computed(() => {
  if (isPackCompleted.value) return { percentage: 100, status: 'success' };
  if (!packingStages.value.length) return { percentage: 0, status: '' };

  const finishedStages = packingStages.value.filter(
    (s) => s.status === 'success' || s.status === 'failed'
  ).length;

  const hasFailed = packingStages.value.some((s) => s.status === 'failed');
  if (hasFailed) return { percentage: 100, status: 'exception' };

  return {
    percentage: Math.round(
      (finishedStages / packingStages.value.length) * 100
    ),
    status: '',
  };
});

const activeStage = computed(() => {
  return packingStages.value.findIndex((s) => s.status === 'running');
});

const isFormDisabled = computed(() => isAutoSubmitting.value);

const isMrDescriptionDisabled = computed(() => 
  isAutoSubmitting.value || fullIntegrationBaselineBranch.value === fullIntegrationTargetBranch.value
);

const isSubmitDisabled = computed(
  () =>
    !isPackCompleted.value ||
    !isTargetBranchValid.value ||
    isSubmitting.value ||
    isAutoSubmitting.value
);

const isAutoSubmitDisabled = computed(
    () => isPackCompleted.value || !fullIntegrationTargetBranch.value || !isTargetBranchValid.value
);


// Methods
const checkBranchExists = async () => {
  isCheckingBranch.value = true;
  try {
    const branches = await getFullIntegrationBranches(product.value, fullIntegrationTargetBranch.value);
    const exists = branches.some((branch: any) => branch.name === fullIntegrationTargetBranch.value);
    targetBranchExists.value = exists;
    if (exists) {
      targetBranchError.value = '目标分支已存在';
      isTargetBranchValid.value = false;
    } else {
      targetBranchError.value = null;
      isTargetBranchValid.value = true;
    }
  } catch (error) {
    console.error('检查分支是否存在失败:', error);
    targetBranchError.value = '验证失败，请重试';
    isTargetBranchValid.value = false;
  } finally {
    isCheckingBranch.value = false;
  }
};

const debouncedCheckBranch = () => {
  clearTimeout(debounceTimer);
  targetBranchExists.value = false;
  targetBranchError.value = null;
  isCheckingBranch.value = false;

  if (!fullIntegrationTargetBranch.value) {
    isTargetBranchValid.value = false;
    return;
  }

  // If target is baseline, it's valid, no need to check for existence.
  if (fullIntegrationTargetBranch.value === fullIntegrationBaselineBranch.value) {
    isTargetBranchValid.value = true;
    return;
  }

  isCheckingBranch.value = true;
  isTargetBranchValid.value = false; // Invalidate until check is complete

  debounceTimer = setTimeout(() => {
    checkBranchExists();
  }, 500);
};

const handleDeleteBranch = async () => {
  try {
    await deleteFullIntegrationBranch({
      product: product.value,
      branch: fullIntegrationTargetBranch.value,
    });
    ElMessage.success('分支删除成功');
    targetBranchExists.value = false;
    targetBranchError.value = null;
    isTargetBranchValid.value = true;
    // Re-check after deletion to confirm
    await checkBranchExists();
  } catch (error) {
    console.error('删除分支失败:', error);
    ElMessage.error('分支删除失败');
  }
};

const fillFromBaseline = () => {
  fullIntegrationTargetBranch.value = fullIntegrationBaselineBranch.value;
  debouncedCheckBranch();
};


const fetchPackingStatus = async () => {
  if (!pipelineHistoryId.value) return;
  try {
    const data = await getFePackStatus({
      historyId: pipelineHistoryId.value,
      product: product.value,
    });
    packingStages.value = data.stages;
    if (data.isCompleted) {
      isPackCompleted.value = true;
      clearInterval(pollingTimer);
      if (data.isSuccess) {
        ElMessage.success('打包成功！');
      } else {
        ElMessage.error('打包失败！');
      }
    }
  } catch (error) {
    console.error('获取打包状态失败', error);
    clearInterval(pollingTimer);
  }
};

const submitMergeRequest = async () => {
  if (fullIntegrationBaselineBranch.value === fullIntegrationTargetBranch.value) {
    mergeRequestDescription.value = 'Sync to baseline branch';
  }
  
  if (!mergeRequestDescription.value) {
      ElMessage.warning('合并请求描述不能为空。');
      return;
  }

  isSubmitting.value = true;
  try {
    await commitFullIntegration({
      product: product.value,
      baselineBranch: fullIntegrationBaselineBranch.value,
      targetBranch: fullIntegrationTargetBranch.value,
      mergeRequestDescription: mergeRequestDescription.value,
      triggeredBy: store.triggeredBy, // Add triggeredBy
      feIntegration: {
        ref: store.feTargetBranch,
        commitId: feIntegrationCommitId.value,
      },
    });
    ElMessage.success('合并请求提交成功！');
  } catch (error) {
    console.error('提交合并请求失败', error);
    ElMessage.error('提交合并请求失败！');
  } finally {
    isSubmitting.value = false;
  }
};

const toggleAutoSubmit = async () => {
  if (isAutoSubmitting.value) {
    // Cancel auto-commit
    try {
      await cancelAutoCommitFullIntegration({
        requestId: autoCommitRequestId.value,
      });
      store.autoCommitRequestId = '';
      isAutoSubmitting.value = false;
      ElMessage.info('已取消自动提交。');
    } catch (error) {
      console.error('取消自动提交失败', error);
      ElMessage.error('取消自动提交失败！');
    }
  } else {
    // Enable auto-commit
    if (fullIntegrationBaselineBranch.value === fullIntegrationTargetBranch.value) {
      mergeRequestDescription.value = 'Sync to baseline branch';
    }

    if (!mergeRequestDescription.value) {
        ElMessage.warning('合并请求描述不能为空。');
        return;
    }

    try {
      const { requestId } = await autoCommitFullIntegration({
        product: product.value,
        baselineBranch: fullIntegrationBaselineBranch.value,
        targetBranch: fullIntegrationTargetBranch.value,
        mergeRequestDescription: mergeRequestDescription.value,
        pipelineHistoryId: pipelineHistoryId.value,
        triggeredBy: store.triggeredBy, // Add triggeredBy
        feIntegration: {
          ref: store.feTargetBranch,
          commitId: feIntegrationCommitId.value,
        },
      });
      store.autoCommitRequestId = requestId;
      isAutoSubmitting.value = true;
      ElMessage.success('已开启自动提交，打包成功后将自动提交 MR。');
    } catch (error) {
      console.error('开启自动提交失败', error);
      ElMessage.error('开启自动提交失败！');
    }
  }
};

onMounted(() => {
  fetchPackingStatus();
  pollingTimer = window.setInterval(fetchPackingStatus, 60000);

  if (!mergeRequestDescription.value && store.fullIntegrationRepoChanges.length > 0) {
    mergeRequestDescription.value = store.fullIntegrationRepoChanges
      .map(change => `### ${change.repoName}\n\n${change.formattedChanges}`)
      .join('\n\n---\n\n');
  }
});

onUnmounted(() => {
  if (pollingTimer) {
    clearInterval(pollingTimer);
  }
});

// Watch for changes and reset validation
watch(fullIntegrationTargetBranch, (newVal, oldVal) => {
    if (newVal !== oldVal) {
        debouncedCheckBranch();
    }
})

</script>

<style scoped>
.step-5-pack {
  padding: 20px;
}
.packing-status,
.merge-request-form {
  margin-bottom: 20px;
}
.stages {
  margin-top: 20px;
}
.footer-buttons {
  text-align: center;
  margin-top: 20px;
}
.no-mr-info {
    margin-top: 30px;
}
</style> 