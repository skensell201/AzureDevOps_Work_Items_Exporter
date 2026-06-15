const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: { hub: './src/hub.tsx' },
  output: { path: path.resolve(__dirname, 'dist'), filename: '[name].js' },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: { 'azure-devops-extension-sdk': path.resolve('node_modules/azure-devops-extension-sdk') },
  },
  module: {
    rules: [
      { test: /\.tsx?$/, loader: 'ts-loader' },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      { test: /\.woff2?$/, type: 'asset/inline' },
    ],
  },
  plugins: [new CopyWebpackPlugin({ patterns: [{ from: 'src/hub.html', to: 'hub.html' }] })],
};
