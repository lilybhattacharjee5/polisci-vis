const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const mode = 'production';

module.exports = {
	entry: './js/index.js',
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: path.join(__dirname, 'dist/'),
		library: 'main',
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
