const tsnode = require('ts-node');
const { compilerOptions } = require('./tsconfig.json');

tsnode.register({
  files: true,
  transpileOnly: true,
  ignore: ['node_modules/(?!expo)'],
  compilerOptions: {
    ...compilerOptions,
    module: 'commonjs',
    resolveJsonModule: true,
    allowJs: true
  }
});
