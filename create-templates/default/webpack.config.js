"use strict";

const webpack = require("webpack");

module.exports = {
  module:    { rules: [
    { test: /\.less$/, use: [ { loader: "style-loader" }, { loader: "css-loader" }, { loader: "less-loader" } ]},
    { test: /\.js$/,   exclude: /(node_modules|bower_components)/, use: {
        loader: "babel-loader",
        options: {
            plugins: ['transform-runtime', 'transform-class-properties'],
            presets: [
                ['env', {targets: {browsers: ["> 1%", "last 2 versions", "IE 8"]}, debug: true}]
            ]
        }
    } }
  ] },
  resolve:   { symlinks: false },
  node:      { fs: "empty" },
  plugins:   [ new webpack.ProvidePlugin({ $: "jquery" }) ],
  entry:     "./src/entry.js",
	output:  {
		path:     require('path').resolve(__dirname, "dist"),
		filename: "bundle.js"
	},
};
