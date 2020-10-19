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

export const data = JSON.parse(require('../data/data.json'));

const allCountries = Datamap.prototype.worldTopo.objects.world.geometries;

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
export function InteroperabilityVisualization(options) {
    // modify default parameters according to passed-in options
    if (options.visId === undefined) options.visId = constants.VIS_ID;
    if (options.maxSimilarity === undefined) options.maxSimilarity = constants.MAX_SIMILARITY;
    if (options.minSimilarity === undefined) options.minSimilarity = constants.MIN_SIMILARITY;
    if (options.numIncrements === undefined) options.numIncrements = constants.NUM_INCREMENTS;
    if (options.digitsRounded === undefined) options.digitsRounded = constants.DIGITS_ROUNDED;
    if (options.colorScheme === undefined) options.colorScheme = constants.COLOR_SCHEME;
    if (options.defaultMode === undefined) options.defaultMode = constants.DEFAULT_MODE;
    if (options.enabledModes === undefined) options.enabledModes = constants.ENABLED_MODES;
    if (options.tableProperties === undefined) options.tableProperties = constants.TABLE_PROPERTIES;
    if (options.showTable === undefined) options.showTable = constants.SHOW_TABLE;

    // geomap-specific parameters
    if (options.enabledModes.includes(constants.geomap)) {
      var geomapProperties = options.geomapProperties;
      if (geomapProperties.selectedCountry === undefined) geomapProperties.selectedCountry = constants.SELECTED_COUNTRY;
      if (geomapProperties.visHeight === undefined) geomapProperties.visHeight = constants.VIS_HEIGHT;
      if (geomapProperties.defaultFill === undefined) geomapProperties.defaultFill = constants.DEFAULT_FILL;
      if (geomapProperties.selectedFill === undefined) geomapProperties.selectedFill = constants.SELECTED_FILL;
      if (geomapProperties.highlightedFill === undefined) geomapProperties.highlightedFill = constants.HIGHLIGHTED_FILL;
      if (geomapProperties.highlightBorderWidth === undefined) geomapProperties.highlightBorderWidth = constants.HIGHLIGHT_BORDER_WIDTH;
      if (geomapProperties.interactive === undefined) geomapProperties.interactive = constants.INTERACTIVE;
      geomapProperties.startCountry = geomapProperties.selectedCountry;
    }

    // force graph-specific parameters
    if (options.enabledModes.includes(constants.forceGraph)) {
      var forceProperties = options.forceProperties;
      if (forceProperties.visHeight === undefined) forceProperties.visHeight = constants.VIS_HEIGHT;
      if (forceProperties.multiplier === undefined) forceProperties.multiplier = constants.MULTIPLIER;
      if (forceProperties.interactive === undefined) forceProperties.interactive = constants.INTERACTIVE;
      forceProperties.startCountry = forceProperties.selectedCountry;
    }

    options.currMode = options.defaultMode;
    options.legendCreated = false; // prevents legend from reloading every time a country is selected

    setupVisualizationStructure(options);
    displayToggleMode(options);
}

function setupVisualizationStructure(options) {
  // pull out necessary options attributes
  var visId = options.visId;

  document.getElementById(visId).innerHTML = `
    <b><h3 class="content" id="${visId}_selectedCountry"></h3></b>

    <div class="resetButton" id="${visId}_resetButton"><button>Reset</button></div>
    <div class="visDisplay" id="${visId}_${constants.visDisplay}"></div>
    <br />

    <div class="visLegend" id="${visId}_visLegend">
      <div class="visLegendTitle" id="${visId}_visLegendTitle">Similarity</div>
      <div class="visLegendBody" id="${visId}_visLegendBody">
        <div class="visLegendGradient" id="${visId}_visLegendGradient"></div>
        <div class="visLegendLabels" id ="${visId}_visLegendLabels"></div>
      </div>
    </div>

    <div class="content visMode" id="${visId}_visMode">
    </div>

    <!-- Show selected country -->
    <div class="content similarityTable" id="${visId}_similarityTable"></div>
  `;

  window.addEventListener('resize', function(event) {
    modeToEnableFunction[options.currMode]["enableFunction"](options);
  });

  document.getElementById(`${visId}_${constants.visDisplay}`).style.height = options.geomapProperties.visHeight;
}

function displayToggleMode(options) {
  // pull out necessary options attributes
  var visId = options.visId;
  var enabledModes = options.enabledModes;
  var currMode = options.currMode;
  var defaultMode = options.defaultMode;
  var selectedCountry = options[defaultMode + 'Properties'].selectedCountry;

  if (enabledModes.length <= 1) {
    modeToEnableFunction[currMode]["enableFunction"](options);
    return;
  }

  var visModeHTML = "";

  enabledModes.forEach(mode => {
    visModeHTML += `
      <div class="modeInput">
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
      options[options.currMode + 'Properties'].selectedCountry = options[options.currMode + 'Properties'].startCountry;
      modeToEnableFunction[mode]["enableFunction"](options);
    });
  });

  document.getElementById(`${visId}_${defaultMode}`).checked = true;
  modeToEnableFunction[defaultMode]["enableFunction"](options);
}

// Initialize world map
// See geomap.js
function enableWorldMap(options) {
  // pull out necessary options attributes
  var visId = options.visId;
  var visHeight = options[constants.geomap + 'Properties'].visHeight;

  // set up map
  document.getElementById(visId + "_" + constants.visDisplay).innerHTML = "";
  document.getElementById(visId + "_" + "selectedCountry").style.display = "block";
  // map takes up 80% of visible screen to leave space for legend
  document.getElementById(visId + "_" + constants.visDisplay).style.width = "80%";
  document.getElementById(visId + "_" + constants.visDisplay).style.height = visHeight;
  // make force graph specific attributes invisible
  document.getElementById(visId + "_" + "resetButton").style.display = "none";
  geomap.populateMap(options);
}

// Initialize force directed graph
// See force-directed-graph.js
function enableForce(options) {
  // pull out necessary options attributes
  var visId = options.visId;
  var visHeight = options[constants.forceGraph + 'Properties'].visHeight;
  var interactive = options[constants.forceGraph + 'Properties'].interactive;

  // set up force graph
  document.getElementById(visId + "_" + constants.visDisplay).innerHTML = "";
  // force graph should take up the whole width of the visible screen
  document.getElementById(visId + "_" + constants.visDisplay).style.width = "100%";
  // make world map specific attributes invisible
  document.getElementById(visId + "_" + "selectedCountry").innerHTML = "";
  document.getElementById(visId + "_" + "similarityTable").innerHTML = "";
  document.getElementById(visId + "_" + constants.visDisplay).style.height = visHeight;
  // make force graph specific attributes visible
  if (interactive) {
    document.getElementById(visId + "_" + "resetButton").style.display = "flex";
  }
  forceGraph.generateForceDirected(options);
}

export function alpha3ToCountryName(alpha3) {
  const countryFound = allCountries.filter(countryInfo => countryInfo.id === alpha3);
  return countryFound.length > 0 ? countryFound[0].properties.name : alpha3;
}

export function countryNameToAlpha3(countryName) {
  const countryFound = allCountries.filter(countryInfo => countryInfo.properties.name === countryName);
  return countryFound.length > 0 ? countryFound[0].id : constants.SELECTED_COUNTRY;
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
function createTableHTML(selectedCountryName, similarities, options) {
  var tableProperties = options.tableProperties;
  var digitsRounded = options.digitsRounded;

  if (tableProperties.length < 1) {
    return ``;
  }

  var html = `<table class="dataTable">
    <tr>
      <th>Country</th>
      <th>Similarity to ${selectedCountryName}</th>
    </tr>
  `;

  for (var [countryName, similarityScore] of sortedObject(similarities)) {
    var properties = ``;
    tableProperties.forEach(property => {
      var value = similarityScore[property];
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

export function selectCountry(dataObj, selectedCountryName, options) {
  var maxSimilarity = options.maxSimilarity;
  var minSimilarity = options.minSimilarity;
  var selectedCountry = countryNameToAlpha3(selectedCountryName);
  var visId = options.visId;
  var showTable = options.showTable;
  const currMode = options.currMode;
  const modeProperties = options[currMode + 'Properties'];
  var selectedFill = modeProperties.selectedFill;

  // check that the country has corresponding data
  var selectedCountryData = dataObj[`${selectedCountry}`];
  if (!selectedCountryData || Object.keys(selectedCountryData).length <= 0) {
    return;
  }
  
  // display selected country name
  document.getElementById(`${visId}_selectedCountry`).innerHTML =
    `Selected Country: <div class="countryName" id="${visId}_countryName">${selectedCountryName}</div>`;
  document.getElementById(`${visId}_countryName`).style.color = selectedFill;

  // display selected country similarity data with other countries
  if (showTable) {
    document.getElementById(`${visId}_similarityTable`).innerHTML =
      createTableHTML(selectedCountryName, selectedCountryData, options);
    document.getElementById(`${visId}_similarityTable`).style.display = 'flex';
  }

  modeProperties.selectedCountry = selectedCountry;
  return selectedCountryData;
}

export function similarityToLegendColor(similarity, options) {
  var numIncrements = options.numIncrements;
  var minSimilarity = options.minSimilarity;
  var maxSimilarity = options.maxSimilarity;
  var colorScheme = options.colorScheme;

  var incrementNumber = Math.floor((similarity - minSimilarity) / (maxSimilarity - minSimilarity) * numIncrements);
  return d3Color[colorScheme][numIncrements][incrementNumber];
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
export function createLegendHTML(options) {
  // pull out necessary options attributes
  var visId = options.visId;
  var minSimilarity = options.minSimilarity;
  var maxSimilarity = options.maxSimilarity;
  var numIncrements = options.numIncrements;
  var legendCreated = options.legendCreated;
  var colorScheme = options.colorScheme;
  var digitsRounded = options.digitsRounded;

  if (legendCreated) {
    document.getElementById(`${visId}_visLegend`).style.display = "inline-block"; // make the completed legend visible
    return;
  }

  // find colors at the top (max) and bottom (min) of the legend gradient
  var legendColorScheme = d3Color[colorScheme][numIncrements];
  
  // generates numIncrements number of legend labels at equidistant positions along the gradient
  var legendElemTag;
  var legendElemDiv;
  var legendElemText;
  var incrementedSimilarity;
  var incrementSize = (maxSimilarity - minSimilarity) / numIncrements;
  for (var i = 0; i < numIncrements; i++) {
    incrementedSimilarity = (minSimilarity + incrementSize * i).toFixed(digitsRounded);
    legendElemTag = document.createElement("div");
    legendElemText = document.createTextNode(incrementedSimilarity.toString());
    legendElemTag.appendChild(legendElemText);
    legendElemTag.style.flex = 1;
    document.getElementById(`${visId}_visLegendLabels`).appendChild(legendElemTag);

    legendElemDiv = document.createElement("div");
    legendElemDiv.style.flex = 1;
    legendElemDiv.style["background-color"] = legendColorScheme[i];
    document.getElementById(`${visId}_visLegendGradient`).appendChild(legendElemDiv);
  }
  // add the final legend label (min) aligned to the bottom of the gradient
  legendElemTag = document.createElement("div");
  legendElemText = document.createTextNode(maxSimilarity.toFixed(digitsRounded).toString());
  legendElemTag.appendChild(legendElemText);
  document.getElementById(`${visId}_visLegendLabels`).appendChild(legendElemTag);

  var legendTitle = document.getElementById(`${visId}_visLegendTitle`);
  options.legendCreated = true;
}
