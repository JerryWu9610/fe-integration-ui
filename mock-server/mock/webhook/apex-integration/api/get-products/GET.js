/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

const data = [
  { name: '分布式 XDR', key: 'distributed-xdr' },
  { name: 'AI 安全平台', key: 'ai-security-platform' },
  { name: '威胁情报中心', key: 'threat-intelligence-center' },
  { name: '安全运营中心', key: 'security-operations-center' },
  { name: '数据安全平台', key: 'data-security-platform' },
]

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => ({
  data,
})
