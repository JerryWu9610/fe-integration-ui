/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

const data = {
  requestId: 'auto-req-001',
}

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => {
  return { data }
}
