const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

var config = {
	mode: 'development',
	devtool: 'inline-source-map',
	module: {},
};

var modeConfig = Object.assign({}, config, {
	entry: {
		geomap: './js/geomap.js',
		force_directed_graph: './js/force_directed_graph.js',
	},
	output: {
		filename: '[name].bundle.js',
		path: path.resolve(__dirname, 'dist'),
	}
});

var indexConfig = Object.assign({}, config, {
	entry: './js/index.js',
	output: {
		filename: 'index.bundle.js',
		path: path.resolve(__dirname, 'dist'),
		library: 'index',
	},
});

module.exports = [
	modeConfig, indexConfig
];
