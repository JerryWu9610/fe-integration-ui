# 需求文档

需要开发一个前端页面，与用户交互完成一次复杂的开发集成流程，要求如下：

1. 主体页面由步骤条与表单构成，每一个步骤对应一个表单，分别收集不同的信息
2. 表单中收集用户所需的信息，搜集的数据可以跨步骤使用
3. 没有副作用的步骤支持返回上一步编辑
4. 技术上，可以使用原生的 JS、Vue 3 框架、对应的组件库工具库等，如果有依赖的话，使用 pnpm 进行管理

具体步骤如下：

- 选择需要进行集成的产品

## 选择需要进行集成的产品

- 提供一个下拉单选框，列出所有支持集成的产品，需要支持搜索

### 接口

#### GET /apex-integration/api/get-products

获取集成的产品类型，使用 name 进行展示，key 进行数据交互

响应类型：

```typescript
type ResData = {
  name: string;
  key: string;
}[];
```

## 收集前端集成仓库的分支

- 提供一个输入框，给用户输入前端集成仓库的基线分支，输入时根据当前的输入内容搜索分支以下拉的形式展示给用户选择作为填充
- 提供一个勾选框，用于是否创建新分支，勾选后出现另一个输入框，给用户输入前端集成仓库的目标分支
- 目标分支输入时，根据当前输入内容查询分支是否已存在，如果已存在则在输入框旁边给出目标分支已存在的提示，并给出一个按钮供用户快速进行删除
- 目标分支已存在时或者分支不存在的验证未通过时，阻止用户进入下一步

### 接口

#### GET /apex-integration/api/get-fe-integration-branches

获取前端集成仓库的分支，用于输入分支时进行补全与验证目标分支是否存在

请求类型：

```typescript
type ReqQueryData = {
  product: string;
  search: string;
};
```

响应类型：

```typescript
type ResData = {
  name: string;
  protected: boolean;
}[];
```

#### POST /apex-integration/api/delete-fe-integration-branch

删除前端集成仓库的分支，用于快速删除已有的目标分支

请求类型：

```typescript
type ReqBodyData = {
  product: string;
  branch: string;
};
```

## 收集需要更新的业务包并指定更新参数

- 查询产品所包含的业务包，以分组 + 勾选框的形式列出各个业务包，勾选代表需要更新，默认全部勾选
- 勾选后展示详细信息，以输入框的形式展示原有的 name、version 与需要更新的 name、version，展示原有信息的输入框置灰不可修改
- 需要更新的 name 默认填入原有的 name，version 则查询填入最新值
- 如果业务包有更新，以文案的形式列出对应业务仓库变更的 commit 信息

### 接口

#### GET /apex-integration/api/get-business-repo-info

查询产品所包含的业务包信息

请求类型：

```typescript
type ReqQueryData = {
  product: string;
  ref: string;
};
```

响应类型：

```typescript
type ResData = {
  repoName: string;
  name: string;
  version: string;
}[];
```

#### POST /apex-integration/api/search-business-pkg

查询业务包名及其对应的最新版本

请求类型：

```typescript
type ReqBodyData = {
  repoName: string;
  search: string;
};
```

响应类型：

```typescript
type ResData = {
  name: string;
  version: string;
}[];
```

#### POST /apex-integration/api/compare-fe-integration

传入业务包的信息，查询出业务仓库的变更信息

请求类型：

```typescript
type ReqBodyData = {
  product: string;
  fromRepo: Record<
    string,
    {
      name: string;
      version: string;
    }
  >;
  toRepo: Record<
    string,
    {
      name: string;
      version: string;
    }
  >;
};
```

响应类型：

```typescript
type ResData = {
  repoName: string;
  formattedChanges: string;
  newCommits: {
    short_id: string;
    title: string;
    author_name: string;
  }[];
  removedCommits: {
    short_id: string;
    title: string;
    author_name: string;
  }[];
}[];
```

## 收集整包集成仓库的基线分支，再次确认业务仓库的变更信息

- 提供一个输入框，用于输入整包集成仓库的基线分支，输入过程中会依据当前的输入内容搜索，以下拉的形式进行选择填充
- 根据整包集成仓库基线分支与上一步所有需要变更的业务包信息，展示出业务仓库的变更 commit
- 确认后，提交变更到前端集成仓库并触发流水线打包，并且不允许返回上一步

### 接口

#### GET /apex-integration/api/get-full-integration-repo-info

传入整包集成仓库的基线分支，获取对应前端集成仓库的分支与 commitId

请求类型：

```typescript
type ReqQueryData = {
  product: string;
  ref: string;
};
```

响应类型：

```typescript
type ResData = {
  ref: string;
  version: string;
};
```

#### POST /apex-integration/api/compare-fe-integration

传入整包集成仓库基线获取的前端集成仓库 version，与上一步所有业务包的 name 与 version，查询出业务仓库的变更信息

请求类型：

```typescript
type ReqBodyData = {
  product: string;
  fromCommit: string;
  toRepo: Record<
    string,
    {
      name: string;
      version: string;
    }
  >;
};
```

响应类型：

```typescript
type ResData = {
  repoName: string;
  newCommits: {
    short_id: string;
    title: string;
    author_name: string;
  }[];
  removedCommits: {
    short_id: string;
    title: string;
    author_name: string;
  }[];
}[];
```

#### POST /apex-integration/api/commit-fe-integration-and-pack

传入前面步骤获取的前端集成仓库的基线分支与目标分支，与业务包的变更信息，提交变更到前端集成仓库并触发流水线打包

请求类型：

```typescript
type ReqBodyData = {
  product: string;
  baselineBranch: string;
  targetBranch: string;
  businessRepo: Record<
    string,
    {
      name: string;
      version: string;
    }
  >;
};
```

响应类型：

```typescript
type ResData = {
  pipelineHistoryId: string;
  commitId: string;
};
```

## 等待打包完成、收集整包集成仓库更新信息

- 60s 间隔轮询查询打包进度
- 提供一个输入框，用于输入整包集成的目标分支，输入后查询目标分支是否存在，如果存在则提供删除按钮供用户快速进行删除
- 提供一个大输入框，用于输入合并请求的描述信息
- 提供一个提交按钮，用于提交整包集成信息并提交合并请求，该按钮在打包完成前置灰
- 提供一个自动提交按钮，用于打包完成后自动提交整包集成信息并提交合并请求，点击后置灰目标分支与合并请求描述信息
- 自动提交按钮允许取消，取消之后重新允许目标分支与合并请求描述信息的编辑

### 接口

#### GET /apex-integration/api/get-fe-pack-status

根据 pipelineHistoryId 获取打包进度

请求类型：

```typescript
type ReqQueryData = {
  historyId: string;
  product: string;
};
```

响应类型：

```typescript
type ResData = {
  stages: {
    name: string;
    status: string;
  }[];
  isSuccess: boolean;
  isCompleted: boolean;
};
```

#### POST /apex-integration/api/commit-full-integration

打包完成后提交整包集成仓库合并请求

请求类型：

```typescript
type ReqBodyData = {
  product: string;
  baselineBranch: string;
  targetBranch: string;
  mergeRequestDescription: string;
  feIntegration: {
    ref: string;
    commitId: string;
  };
};
```

#### POST /apex-integration/api/auto-commit-full-integration

自动提交整包集成仓库合并请求，返回一个 requestId，用于后续取消自动提交

请求类型：

```typescript
type ReqBodyData = {
  product: string;
  baselineBranch: string;
  targetBranch: string;
  mergeRequestDescription: string;
  pipelineHistoryId: string;
  feIntegration: {
    ref: string;
    commitId: string;
  };
};
```

响应类型：

```typescript
type ResData = {
  requestId: string;
};
```

#### POST /apex-integration/api/cancel-auto-commit-full-integration

取消自动提交整包集成仓库合并请求

请求类型：

```typescript
type ReqBodyData = {
  requestId: string;
};
```

#### GET /apex-integration/api/get-full-integration-branches

用于搜索目标分支是否存在

请求类型：

```typescript
type ReqQueryData = {
  product: string;
  search?: string;
};
```

响应类型：

```typescript
type ResData = {
  name: string;
  protected: boolean;
}[];
```

#### POST /apex-integration/api/delete-full-integration-branch

请求类型：

```typescript
type ReqBodyData = {
  product: string;
  branch: string;
};
```

