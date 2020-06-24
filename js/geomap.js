var ccMap = {}; // maps country code to country name
const gray = "#d3d3d3"; // default country color (no data)

var blue_line = [0, 0, 255];
var red_line = [255, 0, 0];


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
  return "#" + red+green+blue;
}

function numToHex(num, color_line) {
  curr_hex = fullColorHex(
    Math.round(num * color_line[0]),
    Math.round(num * color_line[1]),
    Math.round(num * color_line[2]));
  return curr_hex;
}

function similarityToHexColor(similarity, minSimilarity, maxSimilarity) {
	var adjustedSimilarity =
      (similarity - minSimilarity) / (maxSimilarity - minSimilarity);
	if (maxSimilarity - minSimilarity == 0) {
		adjustedSimilarity = 0;
	}
	return numToHex(adjustedSimilarity, blue_line);
}



/* Map utilities */

function getSimilarityBounds(country, inputData) {
	var minSimilarity = Infinity;
	var maxSimilarity = -Infinity;

	var currSimilarity;

	var countryData = inputData[country];
	// console.log(country, countryData);

	for (const [key, value] of Object.entries(countryData)) {
		currSimilarity = value.sim;
		if (currSimilarity > maxSimilarity) {
			maxSimilarity = currSimilarity;
		}
		if (currSimilarity < minSimilarity) {
			minSimilarity = currSimilarity
		}
	}

	return [minSimilarity, maxSimilarity];
}

function dataToFills(inputData) {
	var fills = {};
	for (const [currCountryA, currCountryData] of Object.entries(inputData)) {
		var similarityBounds = getSimilarityBounds(currCountryA, inputData);
		var minSimilarity = similarityBounds[0];
		var maxSimilarity = similarityBounds[1];

		for (const [currCountryB, similarityData] of Object.entries(currCountryData)) {
			var similarity = similarityData.sim;
			var fillKey = "(" + currCountryA + "," + currCountryB + ")";
			fills[fillKey] = similarityToHexColor(similarity, minSimilarity, maxSimilarity);
		}
	}
	return fills;
}

function fillsToFillKeys(inputData, country) {
	var fillKeys = {};
	var countryData = inputData[country];

	// console.log(country, inputData, countryData);
	for (const [currCountryB, similarityData] of Object.entries(countryData)) {
		var currFillKey = "(" + country + "," + currCountryB + ")";
		fillKeys[currCountryB] = { fillKey: currFillKey, similarity: similarityData.sim };
	}

	return fillKeys;
}

function createMap (inputData) {
	// console.log(inputData);
	var similarityBounds = getSimilarityBounds(country, inputData);
	var minSimilarity = similarityBounds[0];
	var maxSimilarity = similarityBounds[1];

	// console.log(minSimilarity, maxSimilarity);

	var fills = dataToFills(inputData);
	// console.log(fills);

	var fillKeys = fillsToFillKeys(inputData, country);
	// console.log(fillKeys);

  new Datamap({
		element: document.getElementById("basic_chloropleth"),
		projection: "mercator",
		fills: fills,
		data: fillKeys,
		done: function(datamap) {
			datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
				country = geography.properties.name;
				fillKeys = fillsToFillKeys(inputData, ccMap['"' + country + '"']);
				datamap.updateChoropleth(fillKeys, { reset: true });
				document.getElementById("selected_country").innerHTML = "Selected Country: <div style = 'display: inline; color: blue;'>" + country + "</div>";
			});
		},
		geographyConfig: {
			popupTemplate: function(geography, data) {
				return '<div class="hoverinfo">' + geography.properties.name + '<br>' + data.similarity / 100 + '</div>';
			}
		},
	});
}

function populateMap(mapHeight, country) {
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

