/** @type {import('fe-dev-server-plugin-mock').MockFile['enable']} */
exports.enable = true

const data = {
  pipelineHistoryId: 'pipeline-123456',
  commitId: 'commit-7890abcd',
}

/** @type {import('fe-dev-server-plugin-mock').MockFile['mock']} */
exports.mock = () => {
  return { data }
}
