import { 
	InteroperabilityVisualization,
	setOption,
	selectCountry as setSelectedCountry,
	generateDataObj,
	modeToEnableFunction,
	toggleTable,
} from './index.js';

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
