const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const sharedDir = path.resolve(__dirname, '../shared');
const config = getDefaultConfig(__dirname);

config.watchFolders = [sharedDir];
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

module.exports = config;
