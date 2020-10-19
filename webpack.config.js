const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const mode = 'production';

module.exports = {
	entry: './js/index.js',
	output: {
		filename: 'index.bundle.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'index',
	},
	mode: mode,
	performance: {
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000,
	},
	devtool: (mode === 'development') ? 'inline-source-map' : false,
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
}
