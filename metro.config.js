// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Vendored engine libraries (pdf.js, Tesseract) are shipped as opaque binary assets and
// loaded into the image-processing WebView at runtime – see src/features/engine.
config.resolver.assetExts.push('bin');

module.exports = config;
