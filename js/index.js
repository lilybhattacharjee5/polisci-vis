/* import visualization mode-specific files => 1 compressed output file */
const geomap = require('./geomap.js');
const forceGraph = require('./force_directed_graph.js');
const constants = require('./constants.js');

/* import css */
import css from './index.css';

/* load required libraries that can be imported into other visualization-specific files */
export const d3 = require('d3');
export const topojson = require('topojson');
export const Datamap = require('../libraries/datamaps.js')
export const d3Color = require('d3-scale-chromatic');
export const jQuery = require('jquery');

export const data = JSON.parse(require('../data/data.json')); // 

/* global variables set to default values */
export var VIS_ID = 'visContainer';
export var MAP_HEIGHT = 750; // height of world map in pixels

var SELECTED_COUNTRY = "USA";

export var DEFAULT = '#d3d3d3'; // default country color (no data)
export var SELECTED = '#228B22'; // selected country color
export var HIGHLIGHTED = 'orange'; // highlighted (moused-over) country color
export var COLOR_SCHEME = 'schemeBlues';

// maximum and minimum expected similarity scores
export var MAX_SIMILARITY = 1
export var MIN_SIMILARITY = 0

// highlight border width for countries with data
export var HIGHLIGHT_BORDER_WIDTH = 2

export var NUM_INCREMENTS = 7;
export var DIGITS_ROUNDED = 2;

// visualization modes
export var ENABLED_MODES = [constants.geomap, constants.forceGraph];
var DEFAULT_MODE = constants.geomap;

var TABLE_PROPERTIES = [];
var SHOW_TABLE = true;

const allCountries = Datamap.prototype.worldTopo.objects.world.geometries;
var currMode = DEFAULT_MODE;
var legendCreated = false; // prevents legend from reloading every time a country is selected

export const modeToEnableFunction = {
  [constants.geomap]: {
    "enableFunction": enableWorldMap,
    "name": "World Map",
  },
  [constants.forceGraph]: {
    "enableFunction": enableForce,
    "name": "Force"
  },
};

// This method is called in a script tag in index.html
export function initializeVisualization(
  visId,
  mapHeight,
  defaultFill,
  selectedFill,
  highlightedFill,
  maxSimilarity,
  minSimilarity,
  highlightBorderWidth,
  numIncrements,
  digitsRounded,
  colorScheme,
  defaultMode,
  enabledModes,
  tableProperties,
  showTable,
  selectedCountry) {
  // set global variables
  VIS_ID = visId,
  MAP_HEIGHT = mapHeight;
  DEFAULT = defaultFill;
  SELECTED = selectedFill;
  HIGHLIGHTED = highlightedFill;
  MAX_SIMILARITY = maxSimilarity;
  MIN_SIMILARITY = minSimilarity;
  HIGHLIGHT_BORDER_WIDTH = highlightBorderWidth;
  NUM_INCREMENTS = numIncrements;
  DIGITS_ROUNDED = digitsRounded;
  COLOR_SCHEME = colorScheme;
  DEFAULT_MODE = defaultMode;
  ENABLED_MODES = enabledModes;
  TABLE_PROPERTIES = tableProperties;
  SHOW_TABLE = showTable;
  SELECTED_COUNTRY = countryNameToAlpha3(selectedCountry);

  currMode = DEFAULT_MODE;

  setupVisualizationStructure();
  displayToggleMode();
}

function setupVisualizationStructure() {
  document.getElementById(VIS_ID).innerHTML = `
    <b><h3 class="content" id="selectedCountry"></h3></b>

    <div id="resetButton"><button>Reset</button></div>
    <div class="mainDisplay" id="${constants.visDisplay}"></div>
    <br />

    <div class="mainDisplay" id="visLegend">
      <div id="visLegendTitle">Similarity</div>
      <div id="visLegendBody">
        <div id="visLegendGradient"></div>
        <div id ="visLegendLabels"></div>
      </div>
    </div>

    <div class="content" id="visMode">
    </div>

    <!-- Show selected country -->
    <div class="content" id="similarityTable"></div>
  `;
}

function displayToggleMode() {
  if (ENABLED_MODES.length <= 1) {
    modeToEnableFunction[currMode]["enableFunction"](SELECTED_COUNTRY);
    return;
  }

  var visModeHTML = "";

  ENABLED_MODES.forEach(mode => {
    visModeHTML += `
      <div class="modeInput">
        <input type="radio" id="${mode}" name="mode", value="${mode}">
        <label for="${mode}"></label>${modeToEnableFunction[mode]["name"]}<br>
      </div>
    `
  });

  document.getElementById("visMode").innerHTML = `
    <div class="contentElem">
      <!-- Toggle map type -->
      ${visModeHTML}
    </div>
  `;

  ENABLED_MODES.forEach(mode => {
    document.getElementById(mode).addEventListener("change", function() {
      currMode = mode;
      modeToEnableFunction[mode]["enableFunction"](SELECTED_COUNTRY);
    });
  });

  document.getElementById(DEFAULT_MODE).checked = "checked";
  modeToEnableFunction[DEFAULT_MODE]["enableFunction"](SELECTED_COUNTRY);
}

// Initialize world map
// See geomap.js
function enableWorldMap(selectedCountryId) {
  // set up map
  document.getElementById(constants.visDisplay).innerHTML = "";
  // map takes up 80% of visible screen to leave space for legend
  document.getElementById(constants.visDisplay).style.width = "80%";
  document.getElementById(constants.visDisplay).style.height = "750px";
  // make force graph specific attributes invisible
  document.getElementById("resetButton").style.display = "none";
  // make legend invisible until a country is selected
  document.getElementById("visLegend").style.display = "none";
  geomap.populateMap(selectedCountryId);
}

// Initialize force directed graph
// See force-directed-graph.js
function enableForce() {
  // set up force graph
  document.getElementById(constants.visDisplay).innerHTML = "";
  // force graph should take up the whole width of the visible screen
  document.getElementById(constants.visDisplay).style.width = "100%";
  // make world map specific attributes invisible
  document.getElementById("selectedCountry").innerHTML = "";
  document.getElementById("similarityTable").innerHTML = "";
  document.getElementById("visLegend").style.display = "none";
  // make force graph specific attributes visible
  document.getElementById("resetButton").style.display = "flex";
  forceGraph.generateForceDirected();
}

export function alpha3ToCountryName(alpha3) {
  const countryFound = allCountries.filter(countryInfo => countryInfo.id === alpha3);
  return countryFound.length > 0 ? countryFound[0].properties.name : alpha3;
}

export function countryNameToAlpha3(countryName) {
  const countryFound = allCountries.filter(countryInfo => countryInfo.properties.name === countryName);
  return countryFound.length > 0 ? countryFound[0].id : "USA";
}

/* From an object where values are floats, returns a list

   [[key, value], ...]

   Sorted by value. */
function sortedObject (obj) {
  var sortable = [];
  for (var item in obj) {
    sortable.push([item, obj[item]]);
  }
  sortable.sort(function(a, b) {
    return b[1] - a[1];
  });
  return sortable;
}

/* Given input data, creates a data object that will be passed into the chloropleth map
  and used for special operations on highlighted / selected countries (e.g. hover text) */
export function generateDataObj(inputData) {
  var dataObj = {};
  var countryA, countryB;
  var currSimilarity;
  for (var countryPair of Object.keys(inputData)) {
    [countryA, countryB] = countryPair.split('->');
    if (!dataObj[countryA]) {
      dataObj[countryA] = {};
    }
    if (!dataObj[countryB]) {
      dataObj[countryB] = {};
    }
    
    let pairDataObj = {
      'similarity': inputData[countryPair].Overall_Similarity,
    }
    dataObj[countryA][countryB] = pairDataObj;
    dataObj[countryB][countryA] = pairDataObj;
  }
  return dataObj;
}

/* Given a country and the similarities object containing pair similarity data (and any
  other data attributes) generates a table displaying each row in the form

  [alpha3 country code] | [similarity score] */
function createTableHTML(selectedCountry, similarities) {
  if (TABLE_PROPERTIES.length < 1) {
    return ``;
  }

  var html = `<table class="dataTable">
    <tr>
      <th>Country</th>
      <th>Similarity to ${selectedCountry}</th>
    </tr>
  `;

  for (var [countryName, similarityScore] of sortedObject(similarities)) {
    var properties = ``;
    TABLE_PROPERTIES.forEach(property => {
      var value = similarityScore[property];
      if (!value) {
        return;
      }
      if (typeof value === "number") {
        value = value.toFixed(DIGITS_ROUNDED);
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

export function selectCountry(dataObj, selectedCountry, selectedCountryId, minSimilarity, maxSimilarity) {
  // check that the country has corresponding data
  var selectedCountryData = dataObj[`${selectedCountryId}`];
  if (!selectedCountryData || Object.keys(selectedCountryData).length <= 0) {
    return;
  }
  
  // display selected country name
  document.getElementById("selectedCountry").innerHTML =
    `Selected Country: <div id="countryName">${selectedCountry}</div>`;
  document.getElementById("countryName").style.color = SELECTED;

  // display selected country similarity data with other countries
  if (SHOW_TABLE) {
    document.getElementById("similarityTable").innerHTML =
      createTableHTML(selectedCountry, selectedCountryData);
    document.getElementById("similarityTable").style.display = 'flex';
  }

  return selectedCountryData;
}

export function similarityToLegendColor(similarity, minSimilarity, maxSimilarity, numIncrements) {
  var incrementNumber = Math.floor((similarity - minSimilarity) / (maxSimilarity - minSimilarity) * numIncrements);
  return d3Color[COLOR_SCHEME][NUM_INCREMENTS][incrementNumber];
}

/* Given input data in the following format, finds the min & max similarities of any country
  in the dataset.

  {
    AND->AUT: {
      Overall_Similarity: 0.646,
      country_code_alpha2_A: "AD",
      country_code_alpha2_B: "AT",
      country_code_alpha3_A: "AND",
      country_code_alpha3_B: "AUT"
  }

  Returns an array of the form
    [minimum similarity, maximum similarity] */
export function findMinMaxSimilarity(inputData) {
  var maxSimilarity = -Infinity
  var minSimilarity = Infinity
  for (var [countryPair, metrics] of Object.entries(inputData)) {
    var similarityScore = metrics.Overall_Similarity;
    if (similarityScore < minSimilarity) {
      minSimilarity = similarityScore;
    }
    if (similarityScore > maxSimilarity) {
      maxSimilarity = similarityScore;
    }
  }
  return [minSimilarity, maxSimilarity]
}

/* Given the min & max similarity of any country pair in the dataset, generates a legend with
   numIncrements number of labels
  */
export function createLegendHTML(minSimilarity, maxSimilarity, numIncrements) {
  if (legendCreated) {
    document.getElementById("visLegend").style.display = "inline-block"; // make the completed legend visible
    return;
  }

  // find colors at the top (max) and bottom (min) of the legend gradient
  var colorScheme = d3Color[COLOR_SCHEME][numIncrements];
  
  // generates numIncrements number of legend labels at equidistant positions along the gradient
  var legendElemTag;
  var legendElemDiv;
  var legendElemText;
  var incrementedSimilarity;
  var incrementSize = (maxSimilarity - minSimilarity) / numIncrements;
  for (var i = 0; i < numIncrements; i++) {
    incrementedSimilarity = (minSimilarity + incrementSize * i).toFixed(DIGITS_ROUNDED);
    legendElemTag = document.createElement("div");
    legendElemText = document.createTextNode(incrementedSimilarity.toString());
    legendElemTag.appendChild(legendElemText);
    legendElemTag.style.flex = 1;
    document.getElementById("visLegendLabels").appendChild(legendElemTag);

    legendElemDiv = document.createElement("div");
    legendElemDiv.style.flex = 1;
    legendElemDiv.style["background-color"] = colorScheme[i];
    document.getElementById("visLegendGradient").appendChild(legendElemDiv);
  }
  // add the final legend label (min) aligned to the bottom of the gradient
  legendElemTag = document.createElement("div");
  legendElemText = document.createTextNode(maxSimilarity.toFixed(DIGITS_ROUNDED).toString());
  legendElemTag.appendChild(legendElemText);
  document.getElementById("visLegendLabels").appendChild(legendElemTag);

  var legendTitle = document.getElementById("visLegendTitle");
  legendCreated = true;
}

