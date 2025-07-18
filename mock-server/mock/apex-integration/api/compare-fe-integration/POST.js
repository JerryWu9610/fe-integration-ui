/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

const data = [
  {
    repoName: 'apex-base',
    newCommits: [{ short_id: 'abc123', title: 'feat: 新增功能', author_name: '张三' }],
    removedCommits: [{ short_id: 'def456', title: 'fix: 修复bug', author_name: '李四' }],
    formattedChanges: `apex-base: \nxxxx\nyyyy`
  },
  {
    repoName: 'xdr',
    newCommits: [{ short_id: 'abc123', title: 'feat: 新增xdr功能', author_name: '张三' }],
    removedCommits: [{ short_id: 'def456', title: 'fix: 修复bug', author_name: '李四' }],
    formattedChanges: `xdr: \nxxxx\nyyyy`
  },
]

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => {
  return { data }
}
