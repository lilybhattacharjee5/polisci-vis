const GRAY = "#d3d3d3"; // default country color (no data)
const SELECTED = "#00ff00";

// maximum and minimum expected similarity scores
const MAX_SIMILARITY = 100
const MIN_SIMILARITY = 0

var ccMap = {}; // maps country code to country name

var blue_line = [0, 0, 255];

var inputData; // HACK pass this into stuff instead. used by force directed graph right now


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
	// console.log(country, inputData, countryData);
  for (var [countryPair, similarityScore] of Object.entries(inputData)) {
    var [countryA, countryB] = countryPair.split('->');
    // if this pair contains our country as country A,
    if (countryA == country) {
      // update the fill key for countryB
      sims[countryB] = similarityScore;
    }
    // if this pair contains our country as country B
    else if (countryB == country) {
      sims[countryA] = similarityScore;
    }
  }
	return sims;
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
  for (var [countryName, similarityScore] of Object.entries(similarities)) {
    // color each country by similariy score
    fillKeys[countryName] =
      similarityToHexColor(similarityScore);
  }
  // color selected country
  fillKeys[selectedCountry] = SELECTED
  return fillKeys
}

function createTableHTML (country, similarities) {
  var html = '';
  for (var [countryName, similarityScore] of Object.entries(similarities)) {
  }
}

function createMap (inputData) {
  inputData = JSON.parse(inputData); // HACK - not sure why we have to do this when we specify request is json in our ajax call

  new Datamap({
		element: document.getElementById("basic_chloropleth"),
		projection: "mercator",
    fills: {
      defaultFill: GRAY,
    },
		done: function(datamap) {
			datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
        // HACK setting this globally; should be passing it down.
				country = geography.properties.name;
        var alpha3 = ccMap[`"${country}"`]
        // console.log(country, alpha3)
        var similarities = similaritiesWith(alpha3, inputData)
        console.log(similarities)
				fillKeys = getFillKeys(alpha3, similarities);
        // console.log(fillKeys)
				datamap.updateChoropleth(fillKeys, { reset: true });
				// document.getElementById("selected_country").innerHTML = "Selected Country: <div style = 'display: inline; color: blue;'>" + country + "</div>";
			});
		},
		// geographyConfig: {
		// 	popupTemplate: function(geography, data) {
		// 		return '<div class="hoverinfo">' + geography.properties.name + '<br>' + data.similarity / 100 + '</div>';
		// 	},
		// },
	});
}

function populateMap(mapHeight) {
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

