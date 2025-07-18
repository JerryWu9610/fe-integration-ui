<template>
  <div v-loading="loading">
    <h2>步骤 3: 收集需要更新的业务包并指定更新参数</h2>
    <div v-if="!loading && store.businessPackages.length > 0">
      <el-form label-width="120px">
        <el-card v-for="pkg in store.businessPackages" :key="pkg.repoName" style="margin-bottom: 20px;">
          <template #header>
            <div class="card-header">
              <span>{{ pkg.repoName }}</span>
              <el-checkbox
                v-if="store.businessPackageUpdates[pkg.repoName]"
                v-model="store.businessPackageUpdates[pkg.repoName].checked"
              />
            </div>
          </template>
          <div v-if="store.businessPackageUpdates[pkg.repoName]?.checked">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="原 Name">
                  <el-input :value="pkg.name" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="原 Version">
                  <el-input :value="pkg.version" disabled />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="新 Name">
                  <el-input v-model="store.businessPackageUpdates[pkg.repoName].name" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="新 Version">
                  <el-input v-model="store.businessPackageUpdates[pkg.repoName].version" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-collapse v-model="activeCollapseNames" v-loading="changesLoading">
              <el-collapse-item title="查看变更" :name="pkg.repoName">
                <div v-if="store.businessRepoChanges[pkg.repoName]">
                  <div v-if="store.businessRepoChanges[pkg.repoName].newCommits?.length > 0">
                    <h4>新增 Commits:</h4>
                    <ul class="commit-list">
                      <li v-for="commit in store.businessRepoChanges[pkg.repoName].newCommits" :key="commit.short_id" class="commit-item">
                        <span class="commit-id">{{ commit.short_id }}</span> - {{ commit.title }} ({{ commit.author_name }})
                      </li>
                    </ul>
                  </div>
                  <div v-if="store.businessRepoChanges[pkg.repoName].removedCommits?.length > 0">
                    <h4>移除 Commits:</h4>
                    <ul class="commit-list">
                      <li v-for="commit in store.businessRepoChanges[pkg.repoName].removedCommits" :key="commit.short_id" class="commit-item">
                        <span class="commit-id">{{ commit.short_id }}</span> - {{ commit.title }} ({{ commit.author_name }})
                      </li>
                    </ul>
                  </div>
                   <div v-if="!store.businessRepoChanges[pkg.repoName].newCommits?.length && !store.businessRepoChanges[pkg.repoName].removedCommits?.length">
                    <p>没有检测到 Commit 变更。</p>
                  </div>
                </div>
                <div v-else>
                   <p>暂无变更信息。</p>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </el-card>
      </el-form>
    </div>
    <el-empty v-if="!loading && store.businessPackages.length === 0" description="未能获取到业务包信息，请检查基线分支是否正确。" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useIntegrationStore } from '@/store/integration';
import { searchBusinessPkg } from '@/api';
import { ElMessage } from 'element-plus';

const store = useIntegrationStore();
const loading = ref(false);
const changesLoading = ref(false);
const activeCollapseNames = ref<string[]>([]);
const previousUpdates = ref<any>(null);

// Debounce utility
const debounce = (fn: Function, delay: number) => {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
};

const debouncedFetchChanges = debounce(async () => {
  changesLoading.value = true;
  await store.fetchCommitChanges();
  // Automatically expand sections that have changes
  activeCollapseNames.value = Object.keys(store.businessRepoChanges);
  changesLoading.value = false;
}, 500);

const updateVersionForPackage = async (repoName: string, searchName: string) => {
  if (!searchName) return;
  try {
    const searchResults = await searchBusinessPkg(repoName, searchName);
    const exactMatch = searchResults.find((pkg: { name: string }) => pkg.name === searchName);

    if (exactMatch) {
      store.businessPackageUpdates[repoName].version = exactMatch.version;
    } else {
      ElMessage.warning(`未能为 "${searchName}" 找到完全匹配的包版本`);
    }
  } catch (error) {
    ElMessage.error(`查询 ${repoName} 的版本失败`);
    console.error(`查询 ${repoName} 的版本失败:`, error);
  }
};

const debouncedUpdateVersion = debounce(async (repoName: string, name: string) => {
  await updateVersionForPackage(repoName, name);
  // After version is found and updated, trigger fetching commit changes.
  debouncedFetchChanges();
}, 500);

watch(() => store.businessPackageUpdates, (newUpdates) => {
  if (previousUpdates.value === null) {
    return; // Don't run on the initial setup before previousUpdates is set
  }

  let nameHasChanged = false;
  const oldUpdates = previousUpdates.value;

  for (const repoName in newUpdates) {
    if (oldUpdates[repoName] && newUpdates[repoName].name !== oldUpdates[repoName].name) {
      nameHasChanged = true;
      // Immediately clear the version to provide instant feedback
      store.businessPackageUpdates[repoName].version = '';
      debouncedUpdateVersion(repoName, newUpdates[repoName].name);
    }
  }

  if (!nameHasChanged) {
    debouncedFetchChanges();
  }

  // After the logic, update the snapshot for the next change.
  previousUpdates.value = JSON.parse(JSON.stringify(newUpdates));

}, { deep: true });


const fetchAndUpdateLatestVersions = async () => {
  const packages = store.businessPackages;
  const promises = packages.map(async (pkg) => {
    try {
      const searchResults = await searchBusinessPkg(pkg.repoName, pkg.name);
      if (searchResults && searchResults.length > 0) {
        // Assuming the first result is the latest version
        const latestVersion = searchResults[0].version;
        if (store.businessPackageUpdates[pkg.repoName]) {
          store.businessPackageUpdates[pkg.repoName].version = latestVersion;
        }
      }
    } catch (error) {
      ElMessage.error(`查询 ${pkg.repoName} 最新版本失败`);
      console.error(`查询 ${pkg.repoName} 最新版本失败:`, error);
      // Keep the original version on error
    }
  });
  await Promise.all(promises);
};

onMounted(async () => {
  loading.value = true;
  await store.fetchBusinessPackages();
  await fetchAndUpdateLatestVersions();
  // Initial fetch of changes for default checked items
  await debouncedFetchChanges();
  // Set the initial state for comparison after all setup is complete
  previousUpdates.value = JSON.parse(JSON.stringify(store.businessPackageUpdates));
  loading.value = false;
});

</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.commit-list {
  list-style: none;
  padding-left: 10px;
  font-family: monospace;
}
.commit-item {
  margin-bottom: 5px;
}
.commit-id {
  color: #409EFF;
  font-weight: bold;
}
</style> 