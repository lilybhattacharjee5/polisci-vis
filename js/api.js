import { 
	InteroperabilityVisualization,
	setOption,
	selectCountry as setSelectedCountry,
	generateDataObj,
	modeToEnableFunction,
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

export function resetVisualization() {

}

export function showDataTable() {

}

export function hideDataTable() {

}
