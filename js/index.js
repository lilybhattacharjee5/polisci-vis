// import visualization mode-specific files => 1 compressed output file
const worldMap = require('./worldMap.js');
const force = require('./force.js');

// import constants from external file
const constants = require('./constants.js');

// import css
import css from './index.css';

// load required libraries that can be imported into other visualization-specific files
export const d3 = require('d3');
export const topojson = require('topojson');
export const Datamap = require('../libraries/datamaps.js')
export const d3Color = require('d3-scale-chromatic');
export const jQuery = require('jquery');

// tracks JSON data from external file
export var data = {};
const allCountries = require('../local_country_variables/countries_codes_and_coordinates.json')['countryData'];

export const modeToEnableFunction = {
  [constants.worldMap]: {
    "enableFunction": enableWorldMap,
    "name": "World Map",
  },
  [constants.force]: {
    "enableFunction": enableForce,
    "name": "Force"
  },
};

export function InteroperabilityVisualization(options) {
  setAllOptions(options);

  setupVisualizationStructure(options);
  displayToggleMode(options);
}

/** 
* Description. This method is called in a script tag in any html file to generate an interoperability
* visualization.
* @param  options   a dictionary of user-defined options in the following format:
* {
*   visId: name of id containing visualization
*   numIncrements: number of increments in legend
*   minAttrVal: minimum attr value to lower bound legend
*   maxAttrVal: maximum attr value to upper bound legend
*   digitsRounded: number of digits past the decimal point to round metric values to
*   colorScheme: a d3 scale chromatic scheme name e.g. 'schemePurples'
*   defaultMode: the default visualization view (e.g. 'worldMap')
*   enabledModes: views that the user can toggle between in the visualization
*   tableProperties: data attributes that will be visible in the attr table
*   showTable: boolean determining whether or not the attr table will be visible
*   worldMapProperties: world map mode-specific properties (see README for details)
*   forceProperties: force mode-specific properties (see README for details)
* }
*/
export function setAllOptions(options) {
    // modify default parameters according to passed-in options
    if (options.visId === undefined) options.visId = constants.VIS_ID;
    if (options.data !== undefined) {
      data = options.data;
    }
    if (options.maxAttrVal === undefined) options.maxAttrVal = constants.MAX_ATTR_VAL;
    if (options.minAttrVal === undefined) options.minAttrVal = constants.MIN_ATTR_VAL;
    if (options.numIncrements === undefined) options.numIncrements = constants.NUM_INCREMENTS;
    if (options.digitsRounded === undefined) options.digitsRounded = constants.DIGITS_ROUNDED;
    if (options.colorScheme === undefined) options.colorScheme = constants.COLOR_SCHEME;
    if (options.defaultMode === undefined) options.defaultMode = constants.DEFAULT_MODE;
    if (options.enabledModes === undefined) options.enabledModes = constants.ENABLED_MODES;
    if (options.tableProperties === undefined) options.tableProperties = constants.TABLE_PROPERTIES;
    if (options.showTable === undefined) options.showTable = constants.SHOW_TABLE;

    // worldMap-specific parameters
    if (options.enabledModes.includes(constants.worldMap)) {
      let worldMapProperties = options.worldMapProperties;
      worldMapProperties.defaultVisibleProperty = worldMapProperties.visibleProperty;
      if (worldMapProperties.visibleProperty === undefined) {
        worldMapProperties.visibleProperty = constants.VISIBLE_PROPERTY;
        worldMapProperties.defaultVisibleProperty = constants.VISIBLE_PROPERTY;
      }
      if (worldMapProperties.selectedCountry === undefined) worldMapProperties.selectedCountry = constants.SELECTED_COUNTRY;
      if (worldMapProperties.visHeight === undefined) worldMapProperties.visHeight = constants.VIS_HEIGHT;
      if (worldMapProperties.defaultFill === undefined) worldMapProperties.defaultFill = constants.DEFAULT_FILL;
      if (worldMapProperties.selectedFill === undefined) worldMapProperties.selectedFill = constants.SELECTED_FILL;
      if (worldMapProperties.highlightedFill === undefined) worldMapProperties.highlightedFill = constants.HIGHLIGHTED_FILL;
      if (worldMapProperties.highlightBorderWidth === undefined) worldMapProperties.highlightBorderWidth = constants.HIGHLIGHT_BORDER_WIDTH;
      if (worldMapProperties.interactive === undefined) worldMapProperties.interactive = constants.INTERACTIVE;
      worldMapProperties.startCountry = worldMapProperties.selectedCountry;
    }

    // force graph-specific parameters
    if (options.enabledModes.includes(constants.force)) {
      let forceProperties = options.forceProperties;
      forceProperties.defaultVisibleProperty = forceProperties.visibleProperty;
      if (forceProperties.visibleProperty === undefined) {
        forceProperties.visibleProperty = constants.VISIBLE_PROPERTY;
        forceProperties.defaultVisibleProperty = constants.VISIBLE_PROPERTY;
      }
      if (forceProperties.visHeight === undefined) forceProperties.visHeight = constants.VIS_HEIGHT;
      if (forceProperties.multiplier === undefined) forceProperties.multiplier = constants.MULTIPLIER;
      if (forceProperties.interactive === undefined) forceProperties.interactive = constants.INTERACTIVE;
      forceProperties.startCountry = forceProperties.selectedCountry;
    }

    options.currMode = options.defaultMode;
    options.legendCreated = false; // prevents legend from reloading every time a country is selected
}

export function setOption(options, optionAttributeKey, optionAttributeValue) {
  options[optionAttributeKey] = optionAttributeValue;
}

/** 
* Description. Sets up the skeleton of the divs that make up the visualization e.g. main view, legend, etc.
* Adds listener to the resize button that allows the force graph (if enabled) to be reloaded on click.
* @param  options   a dictionary of user-defined options (see README for details)
*/
export function setupVisualizationStructure(options) {
  // pull out necessary options attributes
  const visId = options.visId;
  const attrNames = options.tableColumnNames;

  let dataLayerHTML = '';
  let index = 0;
  for (let attrName of attrNames) {
    dataLayerHTML += `<span class="dataLayer">
      <input type="radio" id="${visId}_${options.tableProperties[index]}" name="dataLayerOption" value="${attrName}">
      <label for="${attrName}">${attrName}</label>
    </span>`;
    index += 1;
  }

  document.getElementById(visId).innerHTML = `
    <b><h3 class="${constants.content}" id="${visId}_${constants.selectedCountry}"></h3></b>

    <div class="${constants.resetButton}" id="${visId}_${constants.resetButton}"><button>Reset</button></div>
    <div class="${constants.dataLayerOptions}" id="${visId}_${constants.dataLayerOptions}">${dataLayerHTML}</div>
    <div class="${constants.visDisplay}" id="${visId}_${constants.visDisplay}"></div>
    <br />

    <div class="${constants.visLegend}" id="${visId}_${constants.visLegend}">
      <div class="${constants.visLegendTitle}" id="${visId}_${constants.visLegendTitle}">Similarity</div>
      <div class="${constants.visLegendBody}" id="${visId}_${constants.visLegendBody}">
        <div class="${constants.visLegendGradient}" id="${visId}_${constants.visLegendGradient}"></div>
        <div class="${constants.visLegendLabels}" id ="${visId}_${constants.visLegendLabels}"></div>
      </div>
    </div>

    <div class="${constants.content} ${constants.visMode}" id="${visId}_${constants.visMode}">
    </div>

    <!-- Show selected country -->
    <div class="${constants.content} ${constants.attrTable}" id="${visId}_${constants.attrTable}"></div>
  `;

  // reload the visualization when the window is resized so svg is redrawn
  window.addEventListener('resize', function() {
    modeToEnableFunction[options.currMode]["enableFunction"](options);
  });

  attrNames.forEach((attrName, index) => {
    document.getElementById(`${visId}_${options.tableProperties[index]}`).addEventListener("change", function() {
      options[`${options.currMode}${constants.properties}`].visibleProperty = options.tableProperties[index];
      modeToEnableFunction[options.currMode]["enableFunction"](options);
    });
  });

  document.getElementById(`${visId}_${constants.visDisplay}`).style.height = options.worldMapProperties.visHeight;
}

/**
* Description. Displays the toggle mode option below the current visualization view if there is 
* more than 1 enabled mode.
* @param  options   a dictionary of user-defined options (see README for details)
*/
export function displayToggleMode(options) {
  // pull out necessary options attributes
  const visId = options.visId;
  const enabledModes = options.enabledModes;
  const currMode = options.currMode;
  const defaultMode = options.defaultMode;
  const currModeVisibleProperty = options[`${currMode}${constants.properties}`].visibleProperty;

  if (enabledModes.length <= 1) {
    modeToEnableFunction[currMode]["enableFunction"](options);
    return;
  }

  let visModeHTML = "";

  enabledModes.forEach(mode => {
    visModeHTML += `
      <div class="${constants.modeInput}">
        <input type="radio" id="${visId}_${mode}" name="${visId}_mode", value="${mode}">
        <label for="${mode}"></label>${modeToEnableFunction[mode]["name"]}<br>
      </div>
    `
  });

  document.getElementById(`${visId}_visMode`).innerHTML = `
    <div class="contentElem">
      <!-- Toggle map type -->
      ${visModeHTML}
    </div>
  `;

  enabledModes.forEach(mode => {
    document.getElementById(`${visId}_${mode}`).addEventListener("change", function() {
      options.currMode = mode;
      const visibleProperty = options[`${mode}${constants.properties}`].defaultVisibleProperty;
      options[options.currMode + 'Properties'].selectedCountry = options[options.currMode + 'Properties'].startCountry;
      document.getElementById(`${visId}_${visibleProperty}`).checked = true;
      modeToEnableFunction[mode]["enableFunction"](options);
    });
  });

  document.getElementById(`${visId}_${currModeVisibleProperty}`).checked = true;
  document.getElementById(`${visId}_${defaultMode}`).checked = true;
  modeToEnableFunction[defaultMode]["enableFunction"](options);
}

/** 
* Description: Initialize world map mode (see worldMap.js)
* @param  options   a dictionary of user-defined options (see README for details)
*/
function enableWorldMap(options) {
  // pull out necessary options attributes
  const visId = options.visId;
  const visHeight = options[`${constants.worldMap}${constants.properties}`].visHeight;

  // set up map
  document.getElementById(`${visId}_${constants.visDisplay}`).innerHTML = "";
  document.getElementById(`${visId}_${constants.selectedCountry}`).style.display = "block";
  // map takes up 80% of visible screen to leave space for legend
  document.getElementById(`${visId}_${constants.visDisplay}`).style.width = constants.VIS_WIDTH_WORLDMAP;
  document.getElementById(`${visId}_${constants.visDisplay}`).style.height = visHeight;
  // make force graph specific attributes invisible
  document.getElementById(`${visId}_${constants.resetButton}`).style.display = "none";
  worldMap.populateMap(options);
}

/** 
* Description. Initialize force graph mode (see force-directed-graph.js)
* @param  options   a dictionary of user-defined options (see README for details)
*/
function enableForce(options) {
  // pull out necessary options attributes
  const visId = options.visId;
  const visHeight = options[`${constants.force}${constants.properties}`].visHeight;
  const interactive = options[`${constants.force}${constants.properties}`].interactive;

  // set up force graph
  document.getElementById(`${visId}_${constants.visDisplay}`).innerHTML = "";
  // force graph should take up the whole width of the visible screen
  document.getElementById(`${visId}_${constants.visDisplay}`).style.width = constants.VIS_WIDTH_FORCE;
  // make world map specific attributes invisible
  document.getElementById(`${visId}_${constants.selectedCountry}`).innerHTML = "";
  document.getElementById(`${visId}_${constants.attrTable}`).innerHTML = "";
  document.getElementById(`${visId}_${constants.visDisplay}`).style.height = visHeight;
  // make force graph specific attributes visible
  if (interactive) {
    document.getElementById(`${visId}_${constants.resetButton}`).style.display = "flex";
  }
  force.generateForceDirected(options);
}

/**
* Description. Converts an alpha 3 country code e.g. USA to a country name i.e. United States using
* an externally loaded JSON mapper
* @param  alpha3  a 3-letter country code
* @return   Returns the country name that matches the alpha 3 code
*/
export function alpha3ToCountryName(alpha3) {
  const countryFound = allCountries.filter(countryInfo => countryInfo["Alpha-3 code"] === alpha3);
  return countryFound.length > 0 ? countryFound[0]["Country"] : alpha3;
}

/**
* Description. Converts a country name e.g. United States to an alpha 3 country code i.e. USA using
* an externally loaded JSON mapper
* @param  countryName   a country name
* @return   Returns the 3-letter country code that matches the country name
*/
export function countryNameToAlpha3(countryName) {
  const countryFound = allCountries.filter(countryInfo => countryInfo["Country"] === countryName);
  return countryFound.length > 0 ? countryFound[0]["Alpha-3 code"] : constants.SELECTED_COUNTRY;
}

/** 
* Description. From an object where values are floats, returns a list
*    [[key, value], ...]
* Sorted by value.
* @param  obj   an object with key of any type and float values, may be unsorted
* @return   Returns a list of key-value pairs sorted (descending) by value
*/
function sortedObject (obj) {
  let sortable = [];
  for (let item in obj) {
    sortable.push([item, obj[item]]);
  }
  sortable.sort(function(a, b) {
    return b[1] - a[1];
  });
  return sortable;
}

/**
* Description. Given input data, creates a data object that will be passed into the chloropleth map
* and used for special operations on highlighted / selected countries (e.g. hover text)
* @param  inputData   an object mapping country pairs e.g. USA->CHN to an object containing further
* information about the pair, including calculated metrics
* @return   Returns an object with alpha 3 country code keys e.g. USA, and values that are nested
* objects corresponding to each possible pair containing the key in the following format:
* {
*   USA: {
*     CHN: {
*       // USA->CHN metrics  
*     },
*     ...
*   } 
* }
*/
export function generateDataObj (inputData) {
  let dataObj = {};
  let countryA, countryB;
  for (let countryPair of Object.keys(inputData)) {
    [countryA, countryB] = countryPair.split('->');
    if (!dataObj[countryA]) {
      dataObj[countryA] = {};
    }
    if (!dataObj[countryB]) {
      dataObj[countryB] = {};
    }

    let pairDataObj = {};

    for (let attr of Object.keys(inputData[countryPair])) {
      pairDataObj[attr] = inputData[countryPair][attr];
    }
    
    dataObj[countryA][countryB] = pairDataObj;
    dataObj[countryB][countryA] = pairDataObj;
  }
  return dataObj;
}

/** 
* Description. Given a country and the attr values object containing pair attr data (and any
* other data attributes) generates a table displaying each row in the form
*   [alpha3 country code] | [attr value]
* @param  selectedCountryName   name of selected country e.g. United States
* @param  attrVals          attr value data for all country pairs of the form USA->XXX
* @param  options               a dictionary of user-defined options (see README for details)
* @return   Returns the html corresponding to a attr table that displays the sorted 
* attr values data
*/
function createTableHTML(selectedCountryName, attrVals, options) {
  const tableProperties = options.tableProperties;
  const digitsRounded = options.digitsRounded;
  const attrNames = options.tableColumnNames;

  if (tableProperties.length < 1) {
    return ``;
  }

  let html = `<table class="dataTable">
    <tr>
      <th>Country</th>
  `;

  for (let attrName of attrNames) {
    html += `<th>${attrName} to ${selectedCountryName}</th>`;
  }

  html += '</tr>';

  for (let [countryName, attrVal] of sortedObject(attrVals)) {
    let properties = ``;
    tableProperties.forEach(property => {
      let value = attrVal[property];
      if (!value) {
        return;
      }
      if (typeof value === "number") {
        value = value.toFixed(digitsRounded);
      }
      properties += `<td>${value}</td>`;
    });

    html+=`<tr>
              <td>${countryName}</td>
              ${properties}
            </tr>`
  }
  html+='</table>'
  return html
}

/**
* Description. Performs shared mode actions when a country in the main visualization view is selected, 
* including checking if the country has country pair data, displaying the selected country name, 
* and, if the attr table is enabled, displaying the pair data
* @param  dataObj               an object with alpha 3 country code keys e.g. USA, and values that 
* are nested objects corresponding to each possible pair containing the key i.e. the form USA->XXX
* @param  selectedCountryName   the selected country name
* @param  options               dictionary of user parameters to visualization
* @return   Returns 
*/
export function selectCountry(dataObj, selectedCountryName, options) {
  const selectedCountry = countryNameToAlpha3(selectedCountryName);
  const visId = options.visId;
  const showTable = options.showTable;
  const currMode = options.currMode;
  const modeProperties = options[`${currMode}${constants.properties}`];
  const selectedFill = modeProperties.selectedFill;

  // check that the country has corresponding data
  const selectedCountryData = dataObj[`${selectedCountry}`];
  if (!selectedCountryData || Object.keys(selectedCountryData).length <= 0) {
    return;
  }
  
  // display selected country name
  document.getElementById(`${visId}_${constants.selectedCountry}`).innerHTML =
    `Selected Country: <div class="${constants.countryName}" id="${visId}_${constants.countryName}">${selectedCountryName}</div>`;
  document.getElementById(`${visId}_${constants.countryName}`).style.color = selectedFill;

  options[`${currMode}${constants.properties}`].selectedCountry = selectedCountry;
  toggleTable(options, options.showTable);

  modeProperties.selectedCountry = selectedCountry;
  return selectedCountryData;
}

export function toggleTable(options, showTable) {
  const visId = options.visId;
  const currMode = options.currMode;
  const dataObj = generateDataObj(options.data);
  const selectedCountryAlpha3 = options[`${currMode}${constants.properties}`].selectedCountry;
  const selectedCountryName = alpha3ToCountryName(selectedCountryAlpha3);
  const selectedCountryData = dataObj[`${selectedCountryAlpha3}`];

  if (showTable) {
    document.getElementById(`${visId}_${constants.attrTable}`).innerHTML =
      createTableHTML(selectedCountryName, selectedCountryData, options);
    document.getElementById(`${visId}_${constants.attrTable}`).style.display = 'flex';
  } else {
    document.getElementById(`${visId}_${constants.attrTable}`).style.display = 'none';
  }

  options.showTable = showTable;
}

/**
* Description. Given a attr float value and the options dictionary defined by the user,
* returns the legend color that the attr falls into (given the number of increments and color
* scheme)
* @param  attrVal  float value between 0 and 1 inclusive
* @param  options     dictionary of user parameters to visualization
* @return Returns hex color that matches the attr value rounded down to the nearest legend increment
* color
*/
export function attrToLegendColor(attrVal, options) {
  const numIncrements = options.numIncrements;
  const minAttrVal = options.minAttrVal;
  const maxAttrVal = options.maxAttrVal;
  const colorScheme = options.colorScheme;

  const incrementNumber = Math.floor((attrVal - minAttrVal) / (maxAttrVal - minAttrVal) * numIncrements);
  return d3Color[colorScheme][numIncrements][incrementNumber];
}

/** 
* Description. Given input data in the following format, finds the min & max attr values of 
* any country in the dataset.
*  {
*    AND->AUT: {
*      Overall_Similarity: 0.646,
*      country_code_alpha2_A: "AD",
*      country_code_alpha2_B: "AT",
*      country_code_alpha3_A: "AND",
*      country_code_alpha3_B: "AUT"
*  }
* @param inputData  formatted dictionary mapping country pairs e.g. AND->AUT to a dictionary of 
* calculated metrics
* @return Returns an array of the form
*    [minimum attr value, maximum attr value]
*/
export function findMinMaxAttrVal(inputData, attrName) {
  let maxAttrVal = -Infinity;
  let minAttrVal = Infinity;
  for (let metrics of Object.values(inputData)) {
    const attrVal = metrics[attrName];
    if (attrVal < minAttrVal) {
      minAttrVal = attrVal;
    }
    if (attrVal > maxAttrVal) {
      maxAttrVal = attrVal;
    }
  }
  return [minAttrVal, maxAttrVal];
}

/**
* Description. Generates a legend with numIncrements number of labels based on the bounds of the 
* attr values.
* @param options  A dictionary object representing the parameters to the visualization. Contains
* a set mininum and maximum attr values, and a number of legend increments.
*/
export function createLegendHTML(options) {
  // pull out necessary options attributes
  const visId = options.visId;
  const minAttrVal = options.minAttrVal;
  const maxAttrVal = options.maxAttrVal;
  const numIncrements = options.numIncrements;
  const legendCreated = options.legendCreated;
  const colorScheme = options.colorScheme;
  const digitsRounded = options.digitsRounded;

  // prevent legend from reloading if it has already been created, make the completed legend visible
  if (legendCreated) {
    document.getElementById(`${visId}_${constants.visLegend}`).style.display = "inline-block";
    return;
  }

  // find colors at the top (max) and bottom (min) of the legend gradient
  const legendColorScheme = d3Color[colorScheme][numIncrements];
  
  // generates numIncrements number of legend labels at equidistant positions along the gradient
  let legendElemTag;
  let legendElemDiv;
  let legendElemText;
  let incrementedAttrVal;
  let incrementSize = (maxAttrVal - minAttrVal) / numIncrements;
  for (let i = 0; i < numIncrements; i++) {
    incrementedAttrVal = (minAttrVal + incrementSize * i).toFixed(digitsRounded);
    legendElemTag = document.createElement("div");
    legendElemText = document.createTextNode(incrementedAttrVal.toString());
    legendElemTag.appendChild(legendElemText);
    legendElemTag.style.flex = 1;
    document.getElementById(`${visId}_${constants.visLegendLabels}`).appendChild(legendElemTag);

    legendElemDiv = document.createElement("div");
    legendElemDiv.style.flex = 1;
    legendElemDiv.style["background-color"] = legendColorScheme[i];
    document.getElementById(`${visId}_${constants.visLegendGradient}`).appendChild(legendElemDiv);
  }
  // add the final legend label (min) aligned to the bottom of the gradient
  legendElemTag = document.createElement("div");
  legendElemText = document.createTextNode(maxAttrVal.toFixed(digitsRounded).toString());
  legendElemTag.appendChild(legendElemText);
  document.getElementById(`${visId}_${constants.visLegendLabels}`).appendChild(legendElemTag);

  options.legendCreated = true;
}
