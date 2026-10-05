// Expo's default config handles pnpm workspaces (watchFolders + node_modules resolution).
const { getDefaultConfig } = require('expo/metro-config');

module.exports = getDefaultConfig(__dirname);
