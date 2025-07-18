/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

const data = [
  { repoName: 'apex-base', name: 'apex-base-develop-2.0.41', version: '1.0.0' },
  { repoName: 'xdr', name: 'xdr-develop-2.0.41', version: '2.3.1' },
]

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => {
  return { data }
}
