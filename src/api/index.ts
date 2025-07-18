import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/apex-integration/api',
});

export const getProducts = async () => {
  const response = await apiClient.get('/get-products');
  return response.data;
};

export const getFeIntegrationBranches = async (product: string, search: string) => {
  const response = await apiClient.get('/get-fe-integration-branches', {
    params: { product, search },
  });
  return response.data;
};

export const deleteFeIntegrationBranch = async (product: string, branch: string) => {
  const response = await apiClient.post('/delete-fe-integration-branch', { product, branch });
  return response.data;
};

export const getBusinessRepoInfo = async (product: string, ref: string) => {
  const response = await apiClient.get('/get-business-repo-info', {
    params: { product, ref },
  });
  return response.data;
};

export const searchBusinessPkg = async (repoName: string, search: string) => {
  const response = await apiClient.post('/search-business-pkg', { repoName, search });
  return response.data;
};

export const compareFeIntegration = async (payload: any) => {
  const response = await apiClient.post('/compare-fe-integration', payload);
  return response.data;
};

export const getFullIntegrationRepoInfo = async (params: { product: string; ref: string }) => {
  const response = await apiClient.get('/get-full-integration-repo-info', { params });
  return response.data;
};

export const getFullIntegrationBranches = async (product: string, search: string) => {
  const response = await apiClient.get('/get-full-integration-branches', {
    params: { product, search },
  });
  return response.data;
};

export const commitFeIntegrationAndPack = async (payload: any) => {
  const response = await apiClient.post('/commit-fe-integration-and-pack', payload);
  return response.data;
};

export const getFePackStatus = async (params: { historyId: string; product: string }) => {
  const response = await apiClient.get('/get-fe-pack-status', { params });
  return response.data;
};

export const commitFullIntegration = async (payload: any) => {
  const response = await apiClient.post('/commit-full-integration', payload);
  return response.data;
};

export const autoCommitFullIntegration = async (payload: any) => {
  const response = await apiClient.post('/auto-commit-full-integration', payload);
  return response.data;
};

export const cancelAutoCommitFullIntegration = async (payload: { requestId: string }) => {
  const response = await apiClient.post('/cancel-auto-commit-full-integration', payload);
  return response.data;
};

export const deleteFullIntegrationBranch = async (payload: { product: string; branch: string }) => {
  const response = await apiClient.post('/delete-full-integration-branch', payload);
  return response.data;
}; 