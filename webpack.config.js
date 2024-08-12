// config-overrides.js
const { InjectManifest } = require('workbox-webpack-plugin');
const path = require('path');

module.exports = function override(config, env) {
  if (env === 'production') {
    config.plugins.push(
      new InjectManifest({
        swSrc: path.join(__dirname, 'src', 'custom-service-worker.js'),
        swDest: 'service-worker.js',
      })
    );
  }
  return config;
};
