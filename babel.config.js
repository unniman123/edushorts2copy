module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', {
        lazyImports: true
      }]
    ],
    plugins: [
      ['module-resolver', {
        root: ['./'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './'
        }
      }],
      ['@babel/plugin-transform-modules-commonjs', {
        allowTopLevelThis: true,
        loose: true,
        strict: false
      }],
      'react-native-reanimated/plugin'
    ]
  };
};
