const path = require('path');
const { getApiMode } = require('./scripts/development-environment');

module.exports = api => {
  const mode = api.cache.using(() => getApiMode());
  return {
    presets: ['module:@react-native/babel-preset'],
    plugins: [
      ({ types }) => ({
        visitor: {
          VariableDeclarator(variable, state) {
            if (
              state.filename === path.join(__dirname, 'src', 'api', 'config.ts') &&
              variable.node.id.name === 'DEVELOPMENT_API_MODE'
            ) {
              variable.node.init = types.stringLiteral(mode);
            }
          },
        },
      }),
    ],
  };
};
