import {
	loadData,
    selectCountry,
    showDataTable,
    hideDataTable,
    changeLayer,
    disableLayering,
    enableLayering,
    disableInteractive,
    enableInteractive,
    getState,
    setState,
} from './api.js';

import {
	setAllOptions,
} from './index.js';

import { JSDOM } from 'jsdom';

const constants = require('./constants.js');
const testVisId = 'visContainer';

let html = `
    <div id='${testVisId}'>
        <div id='${testVisId}_${constants.selectedCountry}'></div>
        <div id='${testVisId}_${constants.attrTable}'></div>
        <div id='${testVisId}_${constants.visDisplay}'></div>
        <div id='${testVisId}_${constants.resetButton}'></div>
        <div id='${testVisId}_${constants.visLegend}'></div>
        <div id='${testVisId}_${constants.visLegendGradient}'></div>
        <div id='${testVisId}_${constants.visLegendLabels}'></div>
    </div>
`;

beforeEach(() => {
  document.body.innerHTML = html;
})

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
        "x": 0.5,
		"country_code_alpha3_A": "NOR", 
		"country_code_alpha3_B": "DNK"
	},
	"NOR->USA": {
		"country_code_alpha2_A": "NO", 
		"country_code_alpha2_B": "US", 
		"Overall_Similarity": 0.11, 
        "x": 0.3,
		"country_code_alpha3_A": "NOR", 
		"country_code_alpha3_B": "USA"
	},
	"USA->CHN": {
		"country_code_alpha2_A": "US", 
		"country_code_alpha2_B": "CH", 
		"Overall_Similarity": 0.24, 
        "x": 0.9,
		"country_code_alpha3_A": "USA", 
		"country_code_alpha3_B": "CHN"
	},
};

const originalOptions = {
    visId: testVisId,
    data: originalData,
    numIncrements: 4,
    minSimilarity: 0,
    maxSimilarity: 1,
    digitsRounded: 2,
    colorScheme: 'schemeBlues',
    defaultMode: 'force',
    enabledModes: ['force', 'worldMap'],
    tableProperties: ['Overall_Similarity', 'x', 'y'],
    tableColumnNames: ['Similarity', 'X', 'Y'],
    showTable: true,
    worldMapProperties: {
        visibleProperty: 'Overall_Similarity',
        visHeight: '100%',
        defaultFill: '#d3d3d3',
        selectedFill: '#228B22',
        highlightedFill: 'orange',
        highlightBorderWidth: 2,
        selectedCountry: 'USA',
        interactive: true,
    },
    forceProperties: {
        visibleProperty: 'Overall_Similarity',
        visHeight: '100%',
        selectedCountry: 'DNK',
        linkMultiplier: 3,
        interactive: true,
    },
};

const defaultOptions = {
    visId: testVisId,
    data: originalData,
    numIncrements: 4,
    minSimilarity: 0,
    maxSimilarity: 1,
    digitsRounded: 2,
    colorScheme: 'schemeBlues',
    currMode: 'force',
    defaultMode: 'force',
    enabledModes: ['force', 'worldMap'],
    tableProperties: ['Overall_Similarity', 'x', 'y'],
    tableColumnNames: ['Similarity', 'X', 'Y'],
    showTable: true,
    legendCreated: false,
    maxAttrVal: 1,
    minAttrVal: 0,
    worldMapProperties: {
        visibleProperty: 'Overall_Similarity',
        defaultVisibleProperty: 'Overall_Similarity',
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
        visibleProperty: 'Overall_Similarity',
        defaultVisibleProperty: 'Overall_Similarity',
        visHeight: '100%',
        selectedCountry: 'DNK',
        startCountry: 'DNK',
        linkMultiplier: 3,
        multiplier: 5,
        interactive: true,
    },
};

test("Original options object is mutated with additional metadata after the visualization sets up default options", () => {
	setAllOptions(originalOptions);
	expect(originalOptions).toStrictEqual(defaultOptions);
});

test("Original options object data attribute is mutated when the `loadData` function is called with a different arg", () => {
	loadData(defaultOptions, modifiedData);
	expect(defaultOptions.data).toStrictEqual(modifiedData);
});

test("Options object selectedCountry attribute for current mode is mutated when the `selectCountry` function is called", () => {
    selectCountry('United States', defaultOptions);
    expect(defaultOptions[`${defaultOptions.currMode}${constants.properties}`].selectedCountry).toStrictEqual('USA');
});

test("Data table is NOT visible after `hideDataTable` is called, visible after `showDataTable` is called", () => {
    const tableId = `${testVisId}_${constants.attrTable}`;
    hideDataTable(defaultOptions);
    let tableElement = document.getElementById(tableId);
    expect(tableElement.style.display).toEqual('none');
    showDataTable(defaultOptions);
    tableElement = document.getElementById(tableId);
    expect(tableElement.style.display).toEqual('flex');
});

test("Options object x attribute for current mode is selected when `changeLayer` is called", () => {
    let currModeOptions = defaultOptions[`${defaultOptions.currMode}${constants.properties}`];
    expect(currModeOptions.visibleProperty).toEqual('Overall_Similarity');
    expect(currModeOptions.defaultVisibleProperty).toEqual('Overall_Similarity');
    changeLayer(defaultOptions, 'x');
    expect(currModeOptions.visibleProperty).toEqual('x');
    expect(currModeOptions.defaultVisibleProperty).toEqual('Overall_Similarity');
});

test("Calling `disableLayering` collapses table properties to 1 specified property", () => {
    expect(defaultOptions.tableProperties).toEqual(['Overall_Similarity', 'x', 'y']);
    expect(defaultOptions.tableColumnNames).toEqual(['Similarity', 'X', 'Y']);
    disableLayering(defaultOptions, 'x', 'X');
    expect(defaultOptions.tableProperties).toEqual(['x']);
    expect(defaultOptions.tableColumnNames).toEqual(['X']);
});

test("Calling `enableLayering` expands the number of properties that can be toggled + visible in the table", () => {
    expect(defaultOptions.tableProperties).toEqual(['x']);
    expect(defaultOptions.tableColumnNames).toEqual(['X']);
    enableLayering(defaultOptions, ['x', 'Overall_Similarity'], ['X', 'Similarity']);
    expect(defaultOptions.tableProperties).toEqual(['x', 'Overall_Similarity']);
    expect(defaultOptions.tableColumnNames).toEqual(['X', 'Similarity']);
});

test("Calling `disableInteractive` makes the current mode static", () => {
    const modeDisabled = 'force';
    let modeDisabledOptions = defaultOptions[`${modeDisabled}${constants.properties}`];
    expect(modeDisabledOptions.interactive).toEqual(true);
    disableInteractive(defaultOptions, modeDisabled);

    const nodes = document.getElementsByClassName('node');
    if (nodes.length > 0) {
        const node = nodes[0].querySelector('circle');
        const tableBeforeClick = document.getElementById(`${testVisId}_${constants.attrTable}`).innerHTML;

        let event = document.createEvent('Event');
        event.initEvent('click', true, true);
        node.dispatchEvent(event);

        const tableAfterClick = document.getElementById(`${testVisId}_${constants.attrTable}`).innerHTML;

        // table does not change
        expect(tableBeforeClick).toStrictEqual(tableAfterClick);
    }

    expect(modeDisabledOptions.interactive).toEqual(false);
});

test("Calling `enableInteractive` makes the countries / nodes in the current mode clickable", () => {
    const modeEnabled = 'force';
    let modeEnabledOptions = defaultOptions[`${modeEnabled}${constants.properties}`];
    expect(modeEnabledOptions.interactive).toEqual(false);
    enableInteractive(defaultOptions, modeEnabled);
    expect(modeEnabledOptions.interactive).toEqual(true);

    const nodes = document.getElementsByClassName('node');
    if (nodes.length > 0) {
        const node = nodes[0].querySelector('circle');
        const tableBeforeClick = document.getElementById(`${testVisId}_${constants.attrTable}`).innerHTML;

        let event = document.createEvent('Event');
        event.initEvent('click', true, true);
        node.dispatchEvent(event);

        const tableAfterClick = document.getElementById(`${testVisId}_${constants.attrTable}`);

        // table does change
        expect(tableBeforeClick).not.toEqual(tableAfterClick);
    }
});

test("Final state as returned by `getState` is correct", () => {
    const currState = getState(defaultOptions);
    const expectedState = {
        currMode: defaultOptions.currMode,
        data: defaultOptions.data,
        selectedCountry: 'NOR',
        visibleProperty: 'x',
        selectedCountryData: {
            "DNK": {
                "Overall_Similarity": 0.99,
                "country_code_alpha2_A": "NO",
                "country_code_alpha2_B": "DK",
                "country_code_alpha3_A": "NOR",
                "country_code_alpha3_B": "DNK",
                "x": 0.5,
            },
            "USA": {
                "Overall_Similarity": 0.11,
                "country_code_alpha2_A": "NO",
                "country_code_alpha2_B": "US",
                "country_code_alpha3_A": "NOR",
                "country_code_alpha3_B": "USA",
                "x": 0.3,
            },
        },
    };
    expect(currState).toStrictEqual(expectedState);
});

test("Calling `setState` will reload the visualization with new options", () => {
    setState(originalOptions);
    const currState = getState(originalOptions);
    const expectedState = {
        currMode: originalOptions.currMode,
        data: originalOptions.data,
        selectedCountry: 'DNK',
        visibleProperty: 'Overall_Similarity',
        "selectedCountryData": {
            "NOR": {
                "Overall_Similarity": 0.99,
                "country_code_alpha2_A": "NO",
                "country_code_alpha2_B": "DK",
                "country_code_alpha3_A": "NOR",
                "country_code_alpha3_B": "DNK",
            },
        },
    };
    expect(currState).toStrictEqual(expectedState);
});
