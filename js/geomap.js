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
} from './index.js';

// import general methods from root index file
import {
  selectCountry,
  similarityToLegendColor,
  generateDataObj,
  findMinMaxSimilarity,
  createLegendHTML,
  alpha3ToCountryName
} from './index.js';

const constants = require('./constants.js');

/* Given a country and the similarities object containing pair similarity data (and any 
  other data attributes) returns the fill keys for the chloropleth map.

  Returns an object of the form

    { UKR: "#f0f00", ...}

  Country passed in will be given the SELECTED color. */
function getFillKeys (selectedCountryName, similarities, options) {
  var minSimilarity = options.minSimilarity;
  var maxSimilarity = options.maxSimilarity;
  var numIncrements = options.numIncrements;
  const geomapProperties = options[constants.geomap + 'Properties'];
  var selectedCountry = geomapProperties.selectedCountry;
  var selectedFill = geomapProperties.selectedFill;

  var fillKeys = {};
  for (var [countryName, countryData] of Object.entries(similarities)) {
    // color each country by similarity score
    fillKeys[countryName] = similarityToLegendColor(countryData.similarity, options);
  }
  // color selected country
  fillKeys[selectedCountry] = selectedFill;
  return fillKeys;
}

function moveTooltip (pt, options) {
  var visId = options.visId;

  let map = document.getElementById(`${visId}_${constants.visDisplay}`).getElementsByTagName("svg")[0];
  let tooltip = document.getElementById(`${visId}_tooltip`);
  pt.x = event.clientX;
  pt.y = event.clientY;
  var cursorpt =  pt.matrixTransform(document.getElementById(`${visId}_${constants.visDisplay}`).getElementsByTagName("svg")[0].getScreenCTM().inverse());

  const left = (map.getBoundingClientRect().left + cursorpt.x + window.scrollX + 10) + 'px';
  const top = (map.getBoundingClientRect().top + cursorpt.y + window.scrollY + 10) + 'px';

  tooltip.style.left = left;
  tooltip.style.top = top;
}

function mouseoverCountry (dataObj, geography, selectedCountryName, pt, hoveredElement, options) {
  var visId = options.visId;
  var digitsRounded = options.digitsRounded;
  const geomapProperties = options[constants.geomap + 'Properties'];
  var selectedCountry = geomapProperties.selectedCountry;
  var highlightedFill = geomapProperties.highlightedFill;
  var highlightBorderWidth = geomapProperties.highlightBorderWidth;
  var interactive = geomapProperties.interactive;

  var hoveredCountry = geography.id;
  var hoveredCountryData = dataObj[hoveredCountry];
  var selectedCountryData = dataObj[selectedCountry];
  var hoverPriorColor;
  if (selectedCountry != hoveredCountry && hoveredCountryData && Object.keys(hoveredCountryData).length > 0) {
    let tooltip = document.getElementById(`${visId}_tooltip`);

    tooltip.innerHTML = "<div class='hoverinfo'><center><b>" + geography.properties.name + "</b></center>";
    if (selectedCountry) {
      tooltip.innerHTML = "<div class='hoverinfo'><center><b>" + geography.properties.name + "</b></center>Similarity with " + selectedCountry + ": <b>" + selectedCountryData[hoveredCountry].similarity.toFixed(digitsRounded) + "</b></div>";
    }
    
    tooltip.style.display = "block";
    
    moveTooltip(pt, options);

    if (!interactive){
      return;
    }

    hoverPriorColor = hoveredElement.style['fill'];
    hoveredElement.style['fill'] = highlightedFill;
    hoveredElement.style['stroke-width'] = highlightBorderWidth;
  }
  return hoverPriorColor;
}

function mouseoutCountry (dataObj, geography, hoveredElement, hoverPriorColor, options) {
  var visId = options.visId;
  const geomapProperties = options[constants.geomap + 'Properties'];
  var selectedCountry = geomapProperties.selectedCountry;
  var selectedFill = geomapProperties.selectedFill;
  var interactive = geomapProperties.interactive;
  
  let tooltip = document.getElementById(`${visId}_tooltip`);
  var hoveredCountry = geography.id;
  var hoveredCountryData = dataObj[hoveredCountry];
  if (hoveredCountryData && Object.keys(hoveredCountryData).length > 0) {
    tooltip.style.display = "none";

    if (!interactive) {
      return;
    }

    if (selectedCountry == hoveredCountry) {
      hoveredElement.style['fill'] = selectedFill;
    } else {
      hoveredElement.style['fill'] = hoverPriorColor;
    }
    hoveredElement.style['stroke-width'] = 1;
  }
}

function selectCountryWorldMap (dataObj, selectedCountryName, options) {
  var selectedCountry = options[constants.geomap + 'Properties'].selectedCountry;
  var minSimilarity = options.minSimilarity;
  var maxSimilarity = options.maxSimilarity;
  var visId = options.visId;

  const selectedCountryData = selectCountry(dataObj, selectedCountryName, options);

  // recalculate fillKeys based on newly selected country
  var fillKeys = getFillKeys(selectedCountryName, selectedCountryData, options);
  
  let tooltip = document.getElementById(`${visId}_tooltip`);
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
function createMap(inputData, options) {
  // pull out necessary options attributes
  var visId = options.visId;
  var minSimilarity = options.minSimilarity;
  var maxSimilarity = options.maxSimilarity;
  var digitsRounded = options.digitsRounded;
  const geomapProperties = options[constants.geomap + 'Properties'];
  var selectedCountry = geomapProperties.selectedCountry;
  var defaultFill = geomapProperties.defaultFill;
  var interactive = geomapProperties.interactive;

  var dataObj = generateDataObj(inputData); // creates data object for special operations on highlighted / selected map countries

  // tracks current selected country name e.g. "Canada", and corresponding data from dataObj
  var allCountries = Datamap.prototype.worldTopo.objects.world.geometries;
  var selectedCountryName = alpha3ToCountryName(selectedCountry, allCountries);
  var selectedCountryData;

  var hoverPriorColor;

  createLegendHTML(options);

  new Datamap({
		element: document.getElementById(`${visId}_${constants.visDisplay}`),
		projection: "mercator",
    data: dataObj,
    fills: {
      defaultFill: defaultFill,
    },
		done: function(datamap) {
      document.getElementById(`${visId}_${constants.visDisplay}`).getElementsByTagName("svg")[0].style["position"] = "relative";
      var tooltip = document.createElement("div");
      tooltip.id = `${visId}_tooltip`;
      tooltip.style.position = "absolute";
      tooltip.style.display = "none";
      tooltip.style["min-height"] = "20"
      tooltip.style["width"] = "100"
      document.getElementById(`${visId}_${constants.visDisplay}`).appendChild(tooltip);

      var pt = document.getElementById(`${visId}_${constants.visDisplay}`).getElementsByTagName("svg")[0].createSVGPoint();

      var selectedFillKeys = selectCountryWorldMap(dataObj, selectedCountryName, options);
      datamap.updateChoropleth(selectedFillKeys);

      // datamap.svg['viewBox'] = "100%";
			
      datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
        if (!interactive) {
          return;
        }
        selectedCountryName = geography.properties.name;
        selectedCountry = geography.id;
				var selectedFillKeys = selectCountryWorldMap(dataObj, selectedCountryName, options);
        datamap.updateChoropleth(selectedFillKeys);
			})

      datamap.svg.selectAll('.datamaps-subunit').on('mouseover', function(geography) {
        hoverPriorColor = mouseoverCountry(dataObj, geography, selectedCountryName, pt, this, options);
      })

      datamap.svg.on('mousemove', function() {
        moveTooltip(pt, options);
      });

      datamap.svg.selectAll('.datamaps-subunit').on('mouseout', function(geography) {
        mouseoutCountry(dataObj, geography, this, hoverPriorColor, options);
      });

      datamap.svg.width = "100%";
      datamap.svg.height = "100%";
		},
		geographyConfig: {
      // display country name & corresponding similarity with selected country on mouseover
      popupTemplate: function(geography, data) {
        if (geography != null && selectedCountryData != null) {
          return '<div class="hoverinfo"><b>' + geography.properties.name + '</b><br>' + selectedCountryData[geography.id].similarity.toFixed(digitsRounded) + '</div>'
        }
      }
		},
	});
}

/* Makes an asynchronous request to the JSON data file and calls `createMap` to generate the
   chloropleth after parsing the resulting string data */
export function populateMap(options) {
  createMap(data, options);
}
