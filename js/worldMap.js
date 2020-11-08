// import necessary libraries from root index file
import {
  Datamap,
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
  createLegendHTML,
  alpha3ToCountryName
} from './index.js';

// import constants from external file
const constants = require('./constants.js');

/**
* Description. Given a country and the similarities object containing pair similarity data (and any 
* other data attributes) returns the fill keys for the chloropleth map. Country passed in will be 
* given the SELECTED color.
* @param  selectedCountryName name of selected country e.g. United States
* @param  similarities        similarities data for all country pairs of the form USA->XXX
* @param  options             a dictionary of user-defined options (see README for details)
* @return Returns an object of the form
*
*   { UKR: "#f0f00", ...}
*/
function getFillKeys (selectedCountryName, similarities, options) {
  const worldMapProperties = options[`${constants.worldMap}${constants.properties}`];
  const selectedCountry = worldMapProperties.selectedCountry;
  const selectedFill = worldMapProperties.selectedFill;

  let fillKeys = {};
  for (let [countryName, countryData] of Object.entries(similarities)) {
    // color each country by similarity score
    fillKeys[countryName] = similarityToLegendColor(countryData.similarity, options);
  }
  // color selected country
  fillKeys[selectedCountry] = selectedFill;
  return fillKeys;
}

/**
* Description. Places / moves a tooltip at a constant offset from the current position of the mouse.
* @param  mousePos        current position of the mouse
* @param  options         a dictionary of user-defined options (see README for details)
*/
function moveTooltip (mousePos, options) {
  const visId = options.visId;

  const map = document.getElementById(`${visId}_${constants.visDisplay}`).getElementsByTagName("svg")[0];
  let tooltip = document.getElementById(`${visId}_${constants.tooltip}`);
  mousePos.x = event.clientX;
  mousePos.y = event.clientY;
  const mousePosTransformed =  mousePos.matrixTransform(document.getElementById(`${visId}_${constants.visDisplay}`).getElementsByTagName("svg")[0].getScreenCTM().inverse());

  const left = (map.getBoundingClientRect().left + mousePosTransformed.x + window.scrollX + constants.tooltipOffset) + 'px';
  const top = (map.getBoundingClientRect().top + mousePosTransformed.y + window.scrollY + constants.tooltipOffset) + 'px';

  tooltip.style.left = left;
  tooltip.style.top = top;
}

/**
* Description. Handles world map visualization mode actions on mouse over -- including, moving the
* tooltip and populating it with updated data, changing the color of the newly hovered country
* @param  dataObj               an object with alpha 3 country code keys e.g. USA, and values that 
* are nested objects corresponding to each possible pair containing the key i.e. the form USA->XXX
* @param  geography             contains hovered country-specific data, including name
* @param  selectedCountryName   name of selected country e.g. United States
* @param  mousePos              current position of the mouse
* @param  hoveredElement        the datamaps country object that is now being hovered over
* @param  options               a dictionary of user-defined options (see README for details)
* @return   Returns the previous color of the country that is now being hovered over
*/
function mouseoverCountry (dataObj, geography, selectedCountryName, mousePos, hoveredElement, options) {
  const visId = options.visId;
  const digitsRounded = options.digitsRounded;
  const worldMapProperties = options[`${constants.worldMap}${constants.properties}`];
  const selectedCountry = worldMapProperties.selectedCountry;
  const highlightedFill = worldMapProperties.highlightedFill;
  const highlightBorderWidth = worldMapProperties.highlightBorderWidth;
  const interactive = worldMapProperties.interactive;

  const hoveredCountry = geography.id;
  const hoveredCountryData = dataObj[hoveredCountry];
  const selectedCountryData = dataObj[selectedCountry];
  let hoverPriorColor;
  if (selectedCountry != hoveredCountry && hoveredCountryData && Object.keys(hoveredCountryData).length > 0) {
    let tooltip = document.getElementById(`${visId}_${constants.tooltip}`);

    tooltip.innerHTML = `<div class='${constants.hoverinfo}'><center><b>` + geography.properties.name + "</b></center>";
    if (selectedCountry) {
      tooltip.innerHTML = `<div class='${constants.hoverinfo}'><center><b>` 
        + geography.properties.name + "</b></center>Similarity with " + selectedCountry + ": <b>" 
        + selectedCountryData[hoveredCountry].similarity.toFixed(digitsRounded) + "</b></div>";
    }
    
    tooltip.style.display = "block";
    
    moveTooltip(mousePos, options);

    if (!interactive){
      return;
    }

    hoverPriorColor = hoveredElement.style['fill'];
    hoveredElement.style['fill'] = highlightedFill;
    hoveredElement.style['stroke-width'] = highlightBorderWidth;
  }
  return hoverPriorColor;
}

/**
* Description. Handles world map visualization mode actions on mouse out -- including removing the
* tooltip, resetting the color of the previously hovered country
* @param  dataObj           an object with alpha 3 country code keys e.g. USA, and values that 
* are nested objects corresponding to each possible pair containing the key i.e. the form USA->XXX
* @param  geography         contains hovered country-specific data, including name
* @param  hoveredElement    the datamaps country object that is now being hovered over
* @param  hoverPriorColor   the previous (hex) color of the hovered country (that is now being moused out)
* @param  options           a dictionary of user-defined options (see README for details)
*/
function mouseoutCountry (dataObj, geography, hoveredElement, hoverPriorColor, options) {
  const visId = options.visId;
  const worldMapProperties = options[`${constants.worldMap}${constants.properties}`];
  const selectedCountry = worldMapProperties.selectedCountry;
  const selectedFill = worldMapProperties.selectedFill;
  const interactive = worldMapProperties.interactive;
  
  let tooltip = document.getElementById(`${visId}_${constants.tooltip}`);
  const hoveredCountry = geography.id;
  const hoveredCountryData = dataObj[hoveredCountry];
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

/*
* Description. Handles world map mode-specific actions when a country is selected, including calculating
* new fill keys for non-selected countries based on selected country->XXX metrics, removing the tooltip
* which should not be visible when mousing over a selected country
* @param  dataObj               an object with alpha 3 country code keys e.g. USA, and values that 
* are nested objects corresponding to each possible pair containing the key i.e. the form USA->XXX
* @param  selectedCountryName   name of selected country e.g. United States
* @param  options               a dictionary of user-defined options (see README for details)
* @return   Returns a fillKeys object mapping 3-letter country codes to hex color e.g. AUS->#xxxxxx
*/
function selectCountryWorldMap (dataObj, selectedCountryName, options) {
  const visId = options.visId;

  const selectedCountryData = selectCountry(dataObj, selectedCountryName, options);

  // recalculate fillKeys based on newly selected country
  const fillKeys = getFillKeys(selectedCountryName, selectedCountryData, options);
  
  let tooltip = document.getElementById(`${visId}_${constants.tooltip}`);
  tooltip.style.display = "none";
  
  return fillKeys;
}

/** 
* Description. Given input data in the following format, generates a chloropleth map.
* {
*   AND->AUT: {
*     Overall_Similarity: 0.646,
*     country_code_alpha2_A: "AD",
*     country_code_alpha2_B: "AT",
*     country_code_alpha3_A: "AND",
*     country_code_alpha3_B: "AUT"
*   }
* } 
* @param  inputData   formatted dictionary mapping country pairs e.g. AND->AUT to a dictionary of 
* calculated metrics
* @param  options     a dictionary of user-defined options (see README for details)
*/
function createMap(inputData, options) {
  // pull out necessary options attributes
  const visId = options.visId;
  const digitsRounded = options.digitsRounded;
  const worldMapProperties = options[`${constants.worldMap}${constants.properties}`];
  let selectedCountry = worldMapProperties.selectedCountry;
  const defaultFill = worldMapProperties.defaultFill;
  const interactive = worldMapProperties.interactive;

  const dataObj = generateDataObj(inputData); // creates data object for special operations on highlighted / selected map countries

  // tracks current selected country name e.g. "Canada", and corresponding data from dataObj
  let selectedCountryName = alpha3ToCountryName(selectedCountry);
  let selectedCountryData;

  let hoverPriorColor;

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
      let tooltip = document.createElement("div");
      tooltip.id = `${visId}_tooltip`;
      tooltip.style.position = "absolute";
      tooltip.style.display = "none";
      tooltip.style["min-height"] = "20"
      tooltip.style["width"] = "100"
      document.getElementById(`${visId}_${constants.visDisplay}`).appendChild(tooltip);

      let mousePos = document.getElementById(`${visId}_${constants.visDisplay}`).getElementsByTagName("svg")[0].createSVGPoint();

      let selectedFillKeys = selectCountryWorldMap(dataObj, selectedCountryName, options);
      datamap.updateChoropleth(selectedFillKeys);
			
      datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
        if (!interactive) {
          return;
        }
        selectedCountryName = geography.properties.name;
        selectedCountry = geography.id;
				let selectedFillKeys = selectCountryWorldMap(dataObj, selectedCountryName, options);
        datamap.updateChoropleth(selectedFillKeys);
			})

      datamap.svg.selectAll('.datamaps-subunit').on('mouseover', function(geography) {
        hoverPriorColor = mouseoverCountry(dataObj, geography, selectedCountryName, mousePos, this, options);
      })

      datamap.svg.on('mousemove', function() {
        moveTooltip(mousePos, options);
      });

      datamap.svg.selectAll('.datamaps-subunit').on('mouseout', function(geography) {
        mouseoutCountry(dataObj, geography, this, hoverPriorColor, options);
      });

      datamap.svg.width = "100%";
      datamap.svg.height = "100%";
		},
		geographyConfig: {
      // display country name & corresponding similarity with selected country on mouseover
      popupTemplate: function(geography) {
        if (geography != null && selectedCountryData != null) {
          return `<div class="${constants.hoverinfo}"><b>` + geography.properties.name + '</b><br>' 
            + selectedCountryData[geography.id].similarity.toFixed(digitsRounded) + '</div>'
        }
      }
		},
	});
}

/** 
* Description. Calls `createMap` to generate the chloropleth after parsing the data JSON file 
* @param  options a dictionary of user-defined options (see README for details)
*/
export function populateMap(options) {
  createMap(data, options);
}
