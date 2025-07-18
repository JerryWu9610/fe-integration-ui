<script setup lang="ts">
import { shallowRef, computed, watch, onMounted } from 'vue';
import { useIntegrationStore } from '@/store/integration';
import Step1Product from './components/Step1Product.vue';
import Step2Branches from './components/Step2Branches.vue';
import Step3BusinessPackages from './components/Step3BusinessPackages.vue';
import Step4Confirm from './components/Step4Confirm.vue';
import Step5Pack from './components/Step5Pack.vue';

const store = useIntegrationStore();

onMounted(() => {
  const savedTriggeredBy = localStorage.getItem('triggeredBy');
  if (savedTriggeredBy) {
    store.triggeredBy = savedTriggeredBy;
  }
});

watch(() => store.triggeredBy, (newValue) => {
  localStorage.setItem('triggeredBy', newValue);
});

const isNextStepEnabled = computed(() => {
  const step = store.activeStep;
  if (step === 0) { // Step 1:
    return !!store.product;
  }
  if (step === 1) { // Step 2:
    if (!store.feBaselineBranch) {
      return false; // 基线分支是必需的
    }
    if (store.createFeTargetBranch) {
      // 如果创建新分支，目标分支必须填写且有效，且不在校验中
      return !!store.feTargetBranch && store.isFeTargetBranchValid && !store.isFeTargetBranchValidating;
    }
    return true; // 如果不创建新分支，填写基线后即可通过
  }
  // Add conditions for other steps later
  return true;
});

const steps = shallowRef([
  { component: Step1Product },
  { component: Step2Branches },
  { component: Step3BusinessPackages },
  { component: Step4Confirm },
  { component: Step5Pack },
]);

</script>

<template>
  <el-container class="main-container">
    <el-header class="app-header">
      <h1>开发集成流程</h1>
      <div class="user-input">
        <el-input v-model="store.triggeredBy" placeholder="请输入你的名字" clearable>
          <template #prepend>操作人</template>
        </el-input>
      </div>
    </el-header>
    <el-main>
      <el-card class="content-card">
        <el-steps :active="store.activeStep" finish-status="success" align-center>
            <el-step>
                <template #title>
                    <div class="step-title">选择产品</div>
                </template>
            </el-step>
            <el-step>
                <template #title>
                    <div class="step-title">前端集成分支选择</div>
                </template>
            </el-step>
            <el-step>
                <template #title>
                    <div class="step-title">业务包更新</div>
                </template>
            </el-step>
            <el-step>
                <template #title>
                    <div class="step-title">整包集成分支选择<br>前端打包</div>
                </template>
            </el-step>
            <el-step>
                <template #title>
                    <div class="step-title">整包集成</div>
                </template>
            </el-step>
        </el-steps>

        <div class="step-content">
          <component :is="steps[store.activeStep].component" />
        </div>
      </el-card>
    </el-main>
    <el-footer class="footer-buttons" v-if="store.activeStep < 3">
       <el-button @click="store.prevStep" :disabled="store.activeStep === 0">上一步</el-button>
       <el-button
         type="primary"
         @click="store.nextStep"
         :disabled="store.activeStep === steps.length - 1 || !isNextStepEnabled"
       >下一步</el-button>
    </el-footer>
  </el-container>
</template>

<style scoped>
.main-container {
  height: 100vh;
  background: linear-gradient(135deg, #ece9e6 0%, #ffffff 100%);
  padding: 20px;
  box-sizing: border-box;
}

.el-header {
  text-align: center;
  padding-bottom: 20px;
}

.el-header h1 {
  color: #303133;
  font-weight: 600;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 20px;
}

.user-input {
  width: 250px;
}

.el-main {
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.content-card {
  width: 100%;
  max-width: 960px; /* Limit max width for better readability on large screens */
  padding: 30px 40px;
  box-sizing: border-box;
  border-radius: 12px;
  box-shadow: 0 10px 30px -15px rgba(0, 0, 0, 0.1);
  background: #ffffff;
}

.step-content {
  margin-top: 16px;
  min-height: 350px;
  padding: 20px 0;
}

.footer-buttons {
  text-align: center;
  padding-top: 30px;
}
.step-title {
  line-height: 1.2;
}
</style>
