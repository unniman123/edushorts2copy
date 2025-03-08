module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['@babel/plugin-transform-runtime', {
        regenerator: true
      }],
      ['@babel/plugin-transform-class-properties', {
        loose: true
      }],
      ['@babel/plugin-transform-private-methods', {
        loose: true
      }]
    ],
    env: {
      production: {
        plugins: ['transform-remove-console']
      }
    }
  };
};
