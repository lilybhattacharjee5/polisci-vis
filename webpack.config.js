const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const mode = 'production';

module.exports = {
	entry: './js/index.js',
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
		publicPath: path.resolve(__dirname, 'dist'),
		library: 'index',
	},
	mode: mode,
	performance: {
		hints: false,
		maxEntrypointSize: 512000,
		maxAssetSize: 512000,
	},
	optimization: {
		minimize: true,
		splitChunks: {
			cacheGroups: {
				commons: {
					test: /[\\/]node_modules[\\/]/,
					name: 'vendors',
					chunks: 'all'
				}
			}
		},
	},
	devtool: (mode === 'development') ? 'inline-source-map' : false,
	module: {
		rules: [
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
		        test: /\.csv$/,
		        loader: 'csv-loader',
		        options: {
		          dynamicTyping: true,
		          header: true,
		          skipEmptyLines: true
		        },
		    },
		],
	},
}
