const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const { getApiMode, apiUrls } = require('./scripts/development-environment');
const mode = getApiMode();
const config = {
  server: {
    enhanceMiddleware: middleware => (request, response, next) => {
      if (request.url === '/quickbid-environment') {
        response.setHeader('Content-Type', 'application/json');
        response.end(JSON.stringify({ mode, apiBaseUrl: apiUrls[mode] }));
        return;
      }
      middleware(request, response, next);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
