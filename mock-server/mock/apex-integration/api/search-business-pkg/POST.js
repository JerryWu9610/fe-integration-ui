/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

const data = [
  { name: 'apex-base-develop-2.0.41', version: '1.0.1' },
  { name: 'xdr-develop-2.0.41', version: '2.3.3' },
]

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => {
  return { data }
}
