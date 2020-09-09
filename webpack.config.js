const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
	entry: './js/index.js',
	output: {
		filename: 'index.bundle.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'index',
	},
	mode: 'production',
	devtool: 'inline-source-map',
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
		],
	},
}
