/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

const data = {
  stages: [
    { name: '拉取代码', status: 'success' },
    { name: '安装依赖', status: 'success' },
    { name: '打包', status: 'success' },
    { name: '上传', status: 'running' },
  ],
  isSuccess: false,
  isCompleted: false,
}

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => {
  return { data }
}
