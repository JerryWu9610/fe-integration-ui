/* eslint-disable @typescript-eslint/no-require-imports */
const { MockPlugin } = require('fe-dev-server-plugin-mock')
const path = require('path')

/**
 * @type {import("fe-dev-server-core").FeDevServerCfg}
 */
const config = {
  port: 8080,
  host: 'localhost',
  plugins: [
    new MockPlugin({
      enable: true,
      cfg: {
        dir: path.resolve(__dirname, 'mock'),
      },
    }),
  ],
}

module.exports = config
