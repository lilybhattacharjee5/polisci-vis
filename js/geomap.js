var INPUT_DATA; // HACK we want to be passing this in.
const MAP_HEIGHT = 750; // height of world map in pixels

const GRAY = "#d3d3d3"; // default country color (no data)
const SELECTED = "#00ff00";
const HIGHLIGHTED = "orange";

// maximum and minimum expected similarity scores
const MAX_SIMILARITY = 1
const MIN_SIMILARITY = 0

// highlight border width for countries with data
const HIGHLIGHT_BORDER_WIDTH = 2

const NUM_INCREMENTS = 5;
const DIGITS_ROUNDED = 5;

var ccMap = {}; // maps country code to country name

var blue_line = [0, 0, 255];

var inputData; // HACK pass this into stuff instead. used by force directed graph right now


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


/* Color utilities */

function rgbToHex(rgb) {
  var hex = Number(rgb).toString(16);
  if (hex.length < 2) {
    hex = "0" + hex;
  }
  return hex;
}

function fullColorHex(r,g,b) {
  var red = rgbToHex(r);
  var green = rgbToHex(g);
  var blue = rgbToHex(b);
  return `#${red}${green}${blue}`
}

function numToHex(num, color_line) {
  return fullColorHex(
    Math.round(num * color_line[0]),
    Math.round(num * color_line[1]),
    Math.round(num * color_line[2])
  );
}

/*
  Convert a similarity score into a hex color.

  TODO Simliarity scores range from 0 to 100. This may change; we may want to
  programmatically generate min and max in the future.
  */
function similarityToHexColor(similarity) {
	var adjustedSimilarity =
      (similarity - MIN_SIMILARITY) / (MAX_SIMILARITY - MIN_SIMILARITY);
	return numToHex(adjustedSimilarity, blue_line);
}


/*
  Given a country, finds simliarities to it.

  Returns an object of the from

    {UKR: 0.1, ...}

  This method handles logic around the fact that our data.json may not be
  symmetrical; in other words, the data file may contain USA->CAN but not
  CAN->USA.
  */
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

function generateDataObj(inputData) {
  var dataObj = {};
  for (var countryPair of Object.keys(inputData)) {
    var [countryA, countryB] = countryPair.split('->');
    dataObj[countryA] = {'hasData': true};
    dataObj[countryB] = {'hasData': true};
  }
  return dataObj;
}

/*
  Given a country and the similarities object produced by `similaritiesWith`,
  returns the fill keys for the chloropleth map.

  Returns an object of the form

    { UKR: "#f0f00", ...}

  Country passed in will be given the SELECTED color.
*/
function getFillKeys (selectedCountry, similarities) {
  var fillKeys = {}
  var maxSimilarity = -Infinity
  var minSimilarity = Infinity
  for (var [countryName, similarityScore] of Object.entries(similarities)) {
    // color each country by similariy score
    fillKeys[countryName] =
      similarityToHexColor(similarityScore);
    if (similarityScore < minSimilarity) {
      minSimilarity = similarityScore;
    }
    if (similarityScore > maxSimilarity) {
      maxSimilarity = similarityScore;
    }
  }
  // color selected country
  fillKeys[selectedCountry] = SELECTED
  return [fillKeys, minSimilarity, maxSimilarity]
}

function createTableHTML (selectedCountry, similarities) {
  var html = `<div id="selectedCountrySimilarities"><table class="dataTable">
    <tr>
      <th>Country</th>
      <th>Similarity to ${selectedCountry}</th>
    </tr>`
    for (var [countryName, similarityScore] of sortedObject(similarities)) {
      html+=`<tr>
                <td>${countryName}</td>
                <td>${similarityScore.toFixed(2)}</td>
              </tr>`
    }
    html+='</table></div>'
    return html
}

function createLegendHTML (currMinSimilarity, currMaxSimilarity, numIncrements) {
  console.log(currMinSimilarity, currMaxSimilarity);
  document.getElementById("legendGradient").style.height = MAP_HEIGHT;
  var minColor = similarityToHexColor(currMinSimilarity);
  var maxColor = similarityToHexColor(currMaxSimilarity);
  document.getElementById("legendGradient").style["background-image"] = "linear-gradient(to top, " + minColor + ", " + maxColor + ")"
  document.getElementById("legendGradient").style.width = "40px";
  var legendElemTag;
  var legendElemText;
  var incrementSize = (currMaxSimilarity - currMinSimilarity) / numIncrements;
  for (var i = 0; i < numIncrements; i++) {
    legendElemTag = document.createElement("div");
    legendElemText = document.createTextNode(Math.round((currMaxSimilarity - incrementSize * i) * Math.pow(10, DIGITS_ROUNDED), DIGITS_ROUNDED) / Math.pow(10, DIGITS_ROUNDED).toString());
    legendElemTag.appendChild(legendElemText);
    legendElemTag.style.flex = 1;
    legendElemTag.style["padding-left"] = "20px";
    document.getElementById("legendLabels").appendChild(legendElemTag);
  }
  legendElemTag = document.createElement("div");
  legendElemText = document.createTextNode(Math.round((currMinSimilarity) * Math.pow(10, DIGITS_ROUNDED), DIGITS_ROUNDED) / Math.pow(10, DIGITS_ROUNDED).toString());
  legendElemTag.appendChild(legendElemText);
  legendElemTag.style.flex = 0;
  legendElemTag.style["padding-left"] = "20px";
  document.getElementById("legendLabels").appendChild(legendElemTag);
  document.getElementById("worldMapLegend").style.display = "inline";
}

function createMap (inputData) {
  inputData = JSON.parse(inputData); // HACK - not sure why we have to do this when we specify request is json in our ajax call

  INPUT_DATA = inputData; // HACK we want to be passing this in.
  var dataObj = generateDataObj(inputData);
  var fillKeyData;

  new Datamap({
		element: document.getElementById("basic_chloropleth"),
		projection: "mercator",
    data: dataObj,
    fills: {
      defaultFill: GRAY,
    },
		done: function(datamap) {
			datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
        // HACK setting this globally; should be passing it down.
				country = geography.properties.name;
        // check that the country has corresponding data
        var alpha3 = ccMap[`"${country}"`]
        var similarities = similaritiesWith(alpha3, inputData)
        if (Object.keys(similarities).length == 0) {
          return
        }
        fillKeyData = getFillKeys(alpha3, similarities);
				fillKeys = fillKeyData[0];
        currMinSimilarity = fillKeyData[1];
        currMaxSimilarity = fillKeyData[2];
				datamap.updateChoropleth(fillKeys, { reset: true });
				document.getElementById("selectedCountry").innerHTML =
          `Selected Country: <div id="countryName">${country}</div>`;
				document.getElementById("similarityTable").innerHTML =
          createTableHTML(country, similarities);
        document.getElementById("worldMapLegend").innerHTML = `<div id="legendTitle">Legend</div>
        <div id="legendBody">
        <div id="legendGradient">
        </div>
        <div id ="legendLabels">
        </div>
        </div>`;
        createLegendHTML(currMinSimilarity, currMaxSimilarity, NUM_INCREMENTS)
			})
		},
		geographyConfig: {
      highlightOnHover: true,
      highlightFillColor: function(country) {
        if (country.hasData) {
          return HIGHLIGHTED;
        }
        return GRAY;
      },
      highlightBorderColor: function(country) {
        if (!country.hasData) {
          return;
        }
      },
      highlightBorderWidth: function(country) {
        if (!country.hasData) {
          return;
        }
        return HIGHLIGHT_BORDER_WIDTH;
      }
		},
	});
}

function populateMap() {
  // load country codes
	const countryCodesURL = "local_country_variables/countries_codes_and_coordinates.csv";
	$.ajax( {
		url: countryCodesURL,
		type: "GET",
		async: true,
		dataType: "text",
		success: function ( rawCCData ) {
			var ccData = rawCCData.split(/\r?\n|\r/);
			var currRow;
			var name;
			var cc3;
			for (var i = 1; i < ccData.length; i++) {
		    currRow = ccData[i].split(", ");
		    name = currRow[0];
		    cc3 = currRow[2].slice(1, currRow[2].length - 1);
		    ccMap[name] = cc3;
	    }

	    $.ajax({
				url: "data/data.json",
				type: "GET",
				contentType: "application/json; charset=utf-8",
				async: true,
				dataType: "json",
				success: createMap,
			});
		}
	});
}

