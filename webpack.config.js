const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
// const { CleanWebpackPlugin } = require('clean-webpack-plugin');

module.exports = {
	entry: {
		index: './js/index.js',
		geomap: './js/geomap.js',
		force_directed_graph: './js/force_directed_graph.js',
	},
	devtool: 'inline-source-map',
	plugins: [
		// new CleanWebpackPlugin(),
		// new HtmlWebpackPlugin({
		// 	title: 'Development',
		// }),
	],
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
	},
}
