import { 
	InteroperabilityVisualization,
	setAllOptions,
	setOption,
	selectCountry as setSelectedCountry,
	generateDataObj,
	modeToEnableFunction,
	toggleTable,
	changeDataLayer,
} from './index.js';

const constants = require('./constants.js');

export function createVisualization(options) {
	InteroperabilityVisualization(options);
}

export function loadData(options, data) {
	setOption(options, 'data', data);
}

export function selectCountry(countryName, options) {
	setSelectedCountry(generateDataObj(options.data), countryName, options);
	modeToEnableFunction[options.currMode]["enableFunction"](options);
}

export function showDataTable(options) {
	toggleTable(options, true);
}

export function hideDataTable(options) {
	toggleTable(options, false);
}

export function changeLayer(options, layer) {
	changeDataLayer(options, layer);
}

export function disableLayering(options, layer) {
	options.tableProperties = [layer];
	options.tableColumnNames = [layer];
	InteroperabilityVisualization(options);
}

export function enableLayering(options, layers, layerNames) {
	options.tableProperties = layers;
	options.tableColumnNames = layerNames;
	InteroperabilityVisualization(options);
}

export function disableInteractive(options, mode) {
	options[`${mode}${constants.properties}`].interactive = false;
	modeToEnableFunction[options.currMode]["enableFunction"](options);
}

export function enableInteractive(options, mode) {
	options[`${mode}${constants.properties}`].interactive = false;
	modeToEnableFunction[options.currMode]["enableFunction"](options);
}

export function getState(options) {
	const state = {};
	state.currMode = options.currMode;
	state.data = options.data;

	const currModeOptions = options[`${state.currMode}${constants.properties}`];
	state.selectedCountry = currModeOptions.selectedCountry;
	state.visibleProperty = currModeOptions.visibleProperty;
	
	const dataObj = generateDataObj(options.data);
	const selectedCountryData = dataObj[`${state.selectedCountry}`];
	state.selectedCountryData = selectedCountryData;
	
	return state;
}

export function setState(options) {
	InteroperabilityVisualization(options);
	modeToEnableFunction[options.currMode]["enableFunction"](options);
}
