import {
	loadData,
} from './api.js';

import {
	setAllOptions,
} from './index.js';

const originalData = {
	"NOR->DNK": {
		"country_code_alpha2_A": "NO", 
		"country_code_alpha2_B": "DK", 
		"Overall_Similarity": 0.99, 
		"country_code_alpha3_A": "NOR", 
		"country_code_alpha3_B": "DNK"
	},
};

const modifiedData = {
	"NOR->DNK": {
		"country_code_alpha2_A": "NO", 
		"country_code_alpha2_B": "DK", 
		"Overall_Similarity": 0.99, 
		"country_code_alpha3_A": "NOR", 
		"country_code_alpha3_B": "DNK"
	},
	"NOR->USA": {
		"country_code_alpha2_A": "NO", 
		"country_code_alpha2_B": "US", 
		"Overall_Similarity": 0.11, 
		"country_code_alpha3_A": "NOR", 
		"country_code_alpha3_B": "USA"
	},
	"USA->CHN": {
		"country_code_alpha2_A": "US", 
		"country_code_alpha2_B": "CH", 
		"Overall_Similarity": 0.24, 
		"country_code_alpha3_A": "USA", 
		"country_code_alpha3_B": "CHN"
	},
};

const originalOptions = {
	visId: 'visContainer',
    data: originalData,
    numIncrements: 5,
    minSimilarity: 0,
    maxSimilarity: 1,
    digitsRounded: 2,
    colorScheme: 'schemeBlues',
    defaultMode: 'worldMap',
    enabledModes: ['worldMap', 'force'],
    tableProperties: ['similarity'],
    showTable: true,
    worldMapProperties: {
        visHeight: '100%',
        defaultFill: '#d3d3d3',
        selectedFill: '#228B22',
        highlightedFill: 'orange',
        highlightBorderWidth: 2,
        selectedCountry: 'USA',
        interactive: true,
    },
    forceProperties: {
        visHeight: '100%',
        selectedCountry: 'CHN',
        linkMultiplier: 3,
        interactive: true,
    },
};

const defaultOptions = {
	visId: 'visContainer',
    data: originalData,
    currMode: 'worldMap',
    numIncrements: 5,
    minSimilarity: 0,
    maxSimilarity: 1,
    digitsRounded: 2,
    colorScheme: 'schemeBlues',
    defaultMode: 'worldMap',
    enabledModes: ['worldMap', 'force'],
    tableProperties: ['similarity'],
    showTable: true,
    worldMapProperties: {
        visHeight: '100%',
        defaultFill: '#d3d3d3',
        selectedFill: '#228B22',
        highlightedFill: 'orange',
        highlightBorderWidth: 2,
        selectedCountry: 'USA',
        startCountry: 'USA',
        interactive: true,
    },
    forceProperties: {
    	multiplier: 5,
    	startCountry: 'CHN',
        visHeight: '100%',
        selectedCountry: 'CHN',
        linkMultiplier: 3,
        interactive: true,
    },
    legendCreated: false,
};

test("Original options object is mutated with additional metadata after the visualization sets up default options", () => {
	setAllOptions(originalOptions);
	expect(originalOptions).toStrictEqual(defaultOptions);
});

test("Original options object data attribute is mutated when the `loadData` function is called with a different arg", () => {
	loadData(defaultOptions, modifiedData);
	expect(defaultOptions.data).toStrictEqual(modifiedData);
});
