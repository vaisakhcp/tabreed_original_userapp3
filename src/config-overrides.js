const { override } = require('customize-cra');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = override((config) => {
  config.plugins.push(
    new WorkboxWebpackPlugin.InjectManifest({
      swSrc: './src/service-worker.js',
      swDest: 'service-worker.js',
    })
  );
  return config;
});
