const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for TypeScript and JSX
config.resolver.sourceExts.push('ts', 'tsx', 'js', 'jsx');

// Enable web support
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;