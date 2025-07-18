/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

const data = [
  { name: 'main', protected: true },
  { name: 'dev', protected: false },
  { name: 'feature/test', protected: false },
]

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => {
  return { data }
}
