const { getDefaultConfig } = require('@expo/metro-config');

module.exports = async () => {
  const config = await getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.transformer = {
    ...transformer,
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true
      }
    }
  };

  config.resolver = {
    ...resolver,
    assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
    sourceExts: [...resolver.sourceExts, 'svg', 'cjs', 'js', 'json', 'ts', 'tsx'],
    resolverMainFields: ['react-native', 'browser', 'main']
  };

  return config;
};