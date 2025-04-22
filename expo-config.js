// expo-config.js
const config = require('./app.config.js');

// Export the config for Expo CLI
module.exports = ({config: _config}) => {
  return {
    ...config,
    hooks: {
      ...config.hooks,
      postPublish: [
        {
          file: "expo-linking",
          config: {
            scheme: "edushorts"
          }
        }
      ]
    }
  };
};
