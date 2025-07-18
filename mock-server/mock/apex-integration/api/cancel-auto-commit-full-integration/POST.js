/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => {
  return { success: true }
}
