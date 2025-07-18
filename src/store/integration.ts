import { defineStore } from 'pinia';
import { getProducts, getBusinessRepoInfo, compareFeIntegration } from '@/api';

export type RepoChanges = {
  repoName: string;
  formattedChanges: string;
  newCommits: { short_id: string; title: string; author_name: string; }[];
  removedCommits: { short_id: string; title: string; author_name: string; }[];
};

export const useIntegrationStore = defineStore('integration', {
  state: () => ({
    activeStep: 0,

    // Step 1: Select Product
    product: '',
    products: [] as { name: string; key: string }[],

    // Step 2: FE Branches
    feBaselineBranch: '',
    createFeTargetBranch: false,
    feTargetBranch: '',
    isFeTargetBranchValid: true,
    isFeTargetBranchValidating: false,

    // Step 3: Business Packages
    businessPackages: [] as { repoName: string; name: string; version: string }[],
    businessPackageUpdates: {} as Record<
      string,
      { name: string; version: string; checked: boolean }
    >,
    businessRepoChanges: {} as Record<string, RepoChanges>,

    // Step 4: Full Integration Baseline
    fullIntegrationBaselineBranch: '',
    feIntegrationCommitId: '',
    fullIntegrationRepoChanges: [] as RepoChanges[],

    // Step 5: Pack & Merge Request
    fullIntegrationTargetBranch: '',
    mergeRequestDescription: '',
    pipelineHistoryId: '',
    autoCommitRequestId: '',

    // Global
    triggeredBy: '',
  }),

  getters: {
    // a getter to get the updated business packages
    updatedBusinessPackages(state) {
      const updated: Record<string, { name: string; version: string }> = {};
      for (const repoName in state.businessPackageUpdates) {
        if (state.businessPackageUpdates[repoName].checked) {
          updated[repoName] = {
            name: state.businessPackageUpdates[repoName].name,
            version: state.businessPackageUpdates[repoName].version,
          };
        }
      }
      return updated;
    },
  },

  actions: {
    nextStep() {
      if (this.activeStep < 4) {
        this.activeStep++;
      }
    },
    prevStep() {
      if (this.activeStep > 0) {
        this.activeStep--;
      }
    },
    async fetchProducts() {
      try {
        this.products = await getProducts();
      } catch (error) {
        console.error('获取产品列表失败:', error);
        // 在这里可以添加更复杂的错误处理逻辑，例如 UI 通知
      }
    },
    async fetchBusinessPackages() {
      if (!this.product || !this.feBaselineBranch) return;
      try {
        const packages = await getBusinessRepoInfo(this.product, this.feBaselineBranch);
        this.businessPackages = packages;
        // Initialize updates based on fetched packages
        this.businessPackageUpdates = packages.reduce((
          acc: Record<string, { name: string; version: string; checked: boolean }>,
          pkg: { repoName: string; name: string; version: string }
        ) => {
          acc[pkg.repoName] = { name: pkg.name, version: pkg.version, checked: true };
          return acc;
        }, {} as Record<string, { name: string; version: string; checked: boolean }>);
      } catch (error) {
        console.error('获取业务包信息失败:', error);
        this.businessPackages = [];
        this.businessPackageUpdates = {};
      }
    },
    async fetchCommitChanges() {
      const fromRepo: Record<string, { name: string, version: string }> = {};
      const toRepo: Record<string, { name: string, version: string }> = {};

      for (const repoName in this.businessPackageUpdates) {
        const updatedPkg = this.businessPackageUpdates[repoName];
        if (updatedPkg.checked) {
          const originalPkg = this.businessPackages.find(p => p.repoName === repoName);
          if (originalPkg) {
            fromRepo[repoName] = { name: originalPkg.name, version: originalPkg.version };
            toRepo[repoName] = { name: updatedPkg.name, version: updatedPkg.version };
          }
        }
      }

      // If no packages are selected for update, clear changes and return.
      if (Object.keys(toRepo).length === 0) {
        this.businessRepoChanges = {};
        return;
      }

      try {
        const changes: RepoChanges[] = await compareFeIntegration({
          product: this.product,
          fromRepo,
          toRepo,
        });
        
        const newChanges: Record<string, RepoChanges> = {};
        if (changes && changes.length > 0) {
          changes.forEach(change => {
            newChanges[change.repoName] = change;
          });
        }
        this.businessRepoChanges = newChanges;

      } catch (error) {
        console.error('获取变更失败:', error);
        this.businessRepoChanges = {};
      }
    },
  },
}); 