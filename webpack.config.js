const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: { hub: './src/hub.tsx', quickexport: './src/quickexport/menu.ts' },
  output: {
    path: path.resolve(__dirname, 'dist'),
    // Content-hashed filename so a new build is never served from a stale browser/CDN cache.
    filename: '[name].[contenthash].js',
    clean: true,
  },
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
  // Injects the hashed bundle into hub.html so the page always references the current build.
  plugins: [
    new HtmlWebpackPlugin({ template: 'src/hub.html', filename: 'hub.html', chunks: ['hub'], inject: 'body' }),
    new HtmlWebpackPlugin({ template: 'src/quickexport/menu.html', filename: 'menu.html', chunks: ['quickexport'], inject: 'body' }),
  ],
};
