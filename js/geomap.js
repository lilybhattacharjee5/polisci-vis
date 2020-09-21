// import necessary libraries from root index file
import {
  d3,
  topojson,
  Datamap,
  d3Color,
} from './index.js';

// import global constants from root index file
import {
  data,
  MAP_HEIGHT,
  DEFAULT,
  SELECTED,
  HIGHLIGHTED,
  MAX_SIMILARITY,
  MIN_SIMILARITY,
  HIGHLIGHT_BORDER_WIDTH,
  NUM_INCREMENTS,
  DIGITS_ROUNDED,
} from './index.js';

// import general methods from root index file
import {
  selectCountry,
  similarityToLegendColor,
  generateDataObj,
  findMinMaxSimilarity,
  createLegendHTML,
} from './index.js';

const constants = require('./constants.js');

/* Given a country and the similarities object containing pair similarity data (and any 
  other data attributes) returns the fill keys for the chloropleth map.

  Returns an object of the form

    { UKR: "#f0f00", ...}

  Country passed in will be given the SELECTED color. */
function getFillKeys (selectedCountry, similarities, minSimilarity, maxSimilarity) {
  var fillKeys = {};
  for (var [countryName, countryData] of Object.entries(similarities)) {
    // color each country by similarity score
    fillKeys[countryName] = similarityToLegendColor(countryData.similarity, minSimilarity, maxSimilarity, NUM_INCREMENTS);
  }
  // color selected country
  fillKeys[selectedCountry] = SELECTED;
  return fillKeys;
}

function moveTooltip (pt) {
  let map = document.getElementById(constants.visDisplay).getElementsByTagName("svg")[0];
  let tooltip = document.getElementById("tooltip");
  pt.x = event.clientX;
  pt.y = event.clientY;
  var cursorpt =  pt.matrixTransform(document.getElementsByClassName("datamap")[0].getScreenCTM().inverse());

  tooltip.style.left = map.getBoundingClientRect().left + cursorpt.x + window.scrollX + 10;
  tooltip.style.top = map.getBoundingClientRect().top + cursorpt.y + window.scrollY + 10;
}

function mouseoverCountry (dataObj, geography, selectedCountry, selectedCountryId, pt, hoveredElement) {
  var hoveredCountry = geography.id;
  var hoveredCountryData = dataObj[hoveredCountry];
  var selectedCountryData = dataObj[selectedCountryId];
  var hoverPriorColor;
  if (selectedCountryId != hoveredCountry && hoveredCountryData && Object.keys(hoveredCountryData).length > 0) {
    hoverPriorColor = hoveredElement.style['fill'];
    hoveredElement.style['fill'] = HIGHLIGHTED;
    hoveredElement.style['stroke-width'] = HIGHLIGHT_BORDER_WIDTH;
    let tooltip = document.getElementById("tooltip");

    tooltip.innerHTML = "<div class='hoverinfo'><center><b>" + geography.properties.name + "</b></center>";
    if (selectedCountryId) {
      tooltip.innerHTML = "<div class='hoverinfo'><center><b>" + geography.properties.name + "</b></center>Similarity with " + selectedCountry + ": <b>" + selectedCountryData[hoveredCountry].similarity.toFixed(DIGITS_ROUNDED) + "</b></div>";
    }
    
    tooltip.style.display = "block";
    
    moveTooltip(pt);
  }
  return hoverPriorColor;
}

function mouseoutCountry (dataObj, geography, selectedCountryId, hoveredElement, hoverPriorColor) {
  let tooltip = document.getElementById("tooltip");
  var hoveredCountry = geography.id;
  var hoveredCountryData = dataObj[hoveredCountry];
  if (hoveredCountryData && Object.keys(hoveredCountryData).length > 0) {
    if (selectedCountryId == hoveredCountry) {
      hoveredElement.style['fill'] = SELECTED;
    } else {
      hoveredElement.style['fill'] = hoverPriorColor;
    }
    hoveredElement.style['stroke-width'] = 1;
    tooltip.style.display = "none";
  }
}

function countryNameFromId (countryId, allCountries) {
  let idMatch = allCountries.filter(countryData => countryData.id == countryId);
  let idMatchName = idMatch[0].properties.name;
  return idMatchName;
}

function selectCountryWorldMap (dataObj, selectedCountry, selectedCountryId, minSimilarity, maxSimilarity) {
  const selectedCountryData = selectCountry(dataObj, selectedCountry, selectedCountryId, minSimilarity, maxSimilarity);

  // recalculate fillKeys based on newly selected country
  var fillKeys = getFillKeys(selectedCountryId, selectedCountryData, minSimilarity, maxSimilarity);
  
  let tooltip = document.getElementById("tooltip");
  tooltip.style.display = "none";
  
  return fillKeys;
}

/* Given input data in the following format, generates a chloropleth map.

  {
    AND->AUT: {
      Overall_Similarity: 0.646,
      country_code_alpha2_A: "AD",
      country_code_alpha2_B: "AT",
      country_code_alpha3_A: "AND",
      country_code_alpha3_B: "AUT"
    }
  } */
function createMap(inputData, selectedCountryId) {
  var dataObj = generateDataObj(inputData); // creates data object for special operations on highlighted / selected map countries
  
  // finds min & max similarity values between any country pair in the dataset
  var similarityBounds = findMinMaxSimilarity(inputData);
  var minSimilarity = MIN_SIMILARITY ? MIN_SIMILARITY : similarityBounds[0];
  var maxSimilarity = MAX_SIMILARITY ? MAX_SIMILARITY : similarityBounds[1];

  // tracks current selected country name e.g. "Canada", and corresponding data from dataObj
  var allCountries = Datamap.prototype.worldTopo.objects.world.geometries;
  var selectedCountry = countryNameFromId(selectedCountryId, allCountries);
  var selectedCountryData;

  var hoverPriorColor;

  console.log(minSimilarity, maxSimilarity, NUM_INCREMENTS);
  createLegendHTML(minSimilarity, maxSimilarity, NUM_INCREMENTS);

  new Datamap({
		element: document.getElementById(constants.visDisplay),
		projection: "mercator",
    data: dataObj,
    fills: {
      defaultFill: DEFAULT,
    },
		done: function(datamap) {
      document.getElementById(constants.visDisplay).getElementsByTagName("svg")[0].style["position"] = "relative";
      var tooltip = document.createElement("div");
      tooltip.id = "tooltip";
      tooltip.style.position = "absolute";
      tooltip.style.display = "none";
      tooltip.style["min-height"] = "20"
      tooltip.style["width"] = "100"
      document.getElementById(constants.visDisplay).appendChild(tooltip);

      var pt = document.getElementsByClassName("datamap")[0].createSVGPoint();

      var selectedFillKeys = selectCountryWorldMap(dataObj, selectedCountry, selectedCountryId, minSimilarity, maxSimilarity);
      datamap.updateChoropleth(selectedFillKeys);
			
      datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
        selectedCountry = geography.properties.name;
        selectedCountryId = geography.id;
				var selectedFillKeys = selectCountryWorldMap(dataObj, selectedCountry, selectedCountryId, minSimilarity, maxSimilarity);
        datamap.updateChoropleth(selectedFillKeys);
			})

      datamap.svg.selectAll('.datamaps-subunit').on('mouseover', function(geography) {
        hoverPriorColor = mouseoverCountry(dataObj, geography, selectedCountry, selectedCountryId, pt, this);
      })

      datamap.svg.on('mousemove', function() {
        moveTooltip(pt);
      });

      datamap.svg.selectAll('.datamaps-subunit').on('mouseout', function(geography) {
        mouseoutCountry(dataObj, geography, selectedCountryId, this, hoverPriorColor);
      })
		},
		geographyConfig: {
      // display country name & corresponding similarity with selected country on mouseover
      popupTemplate: function(geography, data) {
        if (geography != null && selectedCountryData != null) {
          return '<div class="hoverinfo"><b>' + geography.properties.name + '</b><br>' + selectedCountryData[geography.id].similarity.toFixed(DIGITS_ROUNDED) + '</div>'
        }
      }
		},
	});
}

/* Makes an asynchronous request to the JSON data file and calls `createMap` to generate the
   chloropleth after parsing the resulting string data */
export function populateMap(selectedCountryId) {
  createMap(data, selectedCountryId);
}
