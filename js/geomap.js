var INPUT_DATA; // HACK we want to be passing this in.
const MAP_HEIGHT = 750; // height of world map in pixels

const GRAY = "#d3d3d3"; // default country color (no data)
const SELECTED = "#228B22"; // selected country color
const HIGHLIGHTED = "orange"; // highlighted (moused-over) country color

// maximum and minimum expected similarity scores
const MAX_SIMILARITY = 1
const MIN_SIMILARITY = 0

// highlight border width for countries with data
const HIGHLIGHT_BORDER_WIDTH = 2

const NUM_INCREMENTS = 5;
const DIGITS_ROUNDED = 2;

const MIN_LEGEND_COLOR = [255, 255, 255];
const MAX_LEGEND_COLOR = [0, 0, 255];

var legendCreated = false; // prevents legend from reloading every time a country is selected

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

/* Convert a similarity score into a hex color.

  TODO Similarity scores range from min similarity of all pairs in the dataset 
  to max similarity of all pairs in the dataset. This may change; we may want to
  programmatically generate min and max in the future. */
function similarityToHexColor(similarity, minSimilarity, maxSimilarity) {
	var adjustedSimilarity =
      (similarity - minSimilarity) / (maxSimilarity - minSimilarity);
	return numToHex(adjustedSimilarity, MIN_LEGEND_COLOR, MAX_LEGEND_COLOR);
}

function similarityToLegendColor(similarity, minSimilarity, maxSimilarity, numIncrements) {
  var incrementNumber = Math.floor((similarity - minSimilarity) / (maxSimilarity - minSimilarity) * numIncrements);
  return d3.schemeBlues[NUM_INCREMENTS][incrementNumber];
}

/* Given a country, finds similiarities to it.

  Returns an object of the from

    {UKR: 0.1, ...}

  This method handles logic around the fact that our data.json may not be
  symmetrical; in other words, the data file may contain USA->CAN but not
  CAN->USA. */
function similaritiesWith (country, inputData) {
	var sims = {};
  for (var [countryPair, metrics] of Object.entries(inputData)) {
    var [countryA, countryB] = countryPair.split('->');
    // if this pair contains our country as country A,
    if (countryA == country) {
      // update the fill key for countryB
      sims[countryB] = metrics.Overall_Similarity;
    }
    // if this pair contains our country as country B
    else if (countryB == country) {
      sims[countryA] = metrics.Overall_Similarity;
    }
  }
	return sims;
}

/* Given input data, creates a data object that will be passed into the chloropleth map
  and used for special operations on highlighted / selected countries (e.g. hover text) */
function generateDataObj(inputData) {
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

/* Given a country and the similarities object containing pair similarity data (and any
  other data attributes) generates a table displaying each row in the form

  [alpha3 country code] | [similarity score] */
function createTableHTML (selectedCountry, similarities) {
  var html = `<table class="dataTable">
    <tr>
      <th>Country</th>
      <th>Similarity to ${selectedCountry}</th>
    </tr>`
    for (var [countryName, similarityScore] of sortedObject(similarities)) {
      html+=`<tr>
                <td>${countryName}</td>
                <td>${similarityScore.similarity.toFixed(DIGITS_ROUNDED)}</td>
              </tr>`
    }
    html+='</table>'
    return html
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
function findMinMaxSimilarity (inputData) {
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
function createLegendHTML (minSimilarity, maxSimilarity, numIncrements) {
  if (legendCreated) {
    document.getElementById("worldMapLegend").style.display = "inline-block"; // make the completed legend visible
    return;
  }

  // find colors at the top (max) and bottom (min) of the legend gradient
  var colorScheme = d3.schemeBlues[numIncrements];
  
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
    document.getElementById("legendLabels").appendChild(legendElemTag);

    legendElemDiv = document.createElement("div");
    legendElemDiv.style.flex = 1;
    legendElemDiv.style["background-color"] = colorScheme[i];
    document.getElementById("legendGradient").appendChild(legendElemDiv);
  }
  // add the final legend label (min) aligned to the bottom of the gradient
  legendElemTag = document.createElement("div");
  legendElemText = document.createTextNode(maxSimilarity.toFixed(DIGITS_ROUNDED).toString());
  legendElemTag.appendChild(legendElemText);
  document.getElementById("legendLabels").appendChild(legendElemTag);

  var legendTitle = document.getElementById("legendTitle");
  legendCreated = true;
}

function moveTooltip (pt) {
  let tooltip = document.getElementById("tooltip");
  pt.x = event.clientX;
  pt.y = event.clientY;
  var cursorpt =  pt.matrixTransform(document.getElementsByClassName("datamap")[0].getScreenCTM().inverse());

  tooltip.style.left = cursorpt.x;
  tooltip.style.top = cursorpt.y;
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

function selectCountry (dataObj, selectedCountry, selectedCountryId, minSimilarity, maxSimilarity) {
  // check that the country has corresponding data
  var selectedCountryData = dataObj[`${selectedCountryId}`];
  if (!selectedCountryData || Object.keys(selectedCountryData).length <= 0) {
    return;
  }
  
  // recalculate fillKeys based on newly selected country
  var fillKeys = getFillKeys(selectedCountryId, selectedCountryData, minSimilarity, maxSimilarity);
  
  // display selected country name
  document.getElementById("selectedCountry").innerHTML =
    `Selected Country: <div id="countryName">${selectedCountry}</div>`;
  document.getElementById("countryName").style.color = SELECTED;

  // display selected country similarity data with other countries
  document.getElementById("similarityTable").innerHTML =
    createTableHTML(selectedCountry, selectedCountryData);

  let tooltip = document.getElementById("tooltip");
  tooltip.style.display = "none";

  return fillKeys;
}

function countryNameFromId (countryId, allCountries) {
  let idMatch = allCountries.filter(countryData => countryData.id == countryId);
  let idMatchName = idMatch[0].properties.name;
  return idMatchName;
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
function createMap (inputData, selectedCountryId) {
  INPUT_DATA = inputData; // HACK we want to be passing this in.
  var dataObj = generateDataObj(inputData); // creates data object for special operations on highlighted / selected map countries
  
  // finds min & max similarity values between any country pair in the dataset
  var similarityBounds = findMinMaxSimilarity(inputData);
  var minSimilarity = similarityBounds[0];
  var maxSimilarity = similarityBounds[1];

  // tracks current selected country name e.g. "Canada", and corresponding data from dataObj
  var allCountries = Datamap.prototype.worldTopo.objects.world.geometries;
  var selectedCountry = countryNameFromId(selectedCountryId, allCountries);
  var selectedCountryData;

  var hoverPriorColor;

  createLegendHTML(minSimilarity, maxSimilarity, NUM_INCREMENTS);

  new Datamap({
		element: document.getElementById("basic_chloropleth"),
		projection: "mercator",
    data: dataObj,
    fills: {
      defaultFill: GRAY,
    },
		done: function(datamap) {
      var tooltip = document.createElement("div");
      tooltip.id = "tooltip";
      tooltip.style.position = "absolute";
      tooltip.style.display = "none";
      tooltip.style["min-height"] = "20"
      tooltip.style["width"] = "100"
      document.getElementById("basic_chloropleth").appendChild(tooltip);

      var pt = document.getElementsByClassName("datamap")[0].createSVGPoint();

      var selectedFillKeys = selectCountry(dataObj, selectedCountry, selectedCountryId, minSimilarity, maxSimilarity);
      datamap.updateChoropleth(selectedFillKeys);
			
      datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
        selectedCountry = geography.properties.name;
        selectedCountryId = geography.id;
				var selectedFillKeys = selectCountry(dataObj, selectedCountry, selectedCountryId, minSimilarity, maxSimilarity);
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
function populateMap(selectedCountryId) {
  $.ajax({
		url: "data/data.json",
		type: "GET",
		contentType: "application/json; charset=utf-8",
		async: true,
		dataType: "json",
		success: (function(data) {
      createMap(JSON.parse(data), selectedCountryId);
    }),
	});
}
