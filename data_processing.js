// function getData(country, )
function similarityToHexColor(similarity, minSimilarity, maxSimilarity) {
	var adjustedSimilarity = (similarity - minSimilarity) / (maxSimilarity - minSimilarity);
	if (maxSimilarity - minSimilarity == 0) {
		adjustedSimilarity = 0;
	}
	return numToHex(adjustedSimilarity, blue_line);
}

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

function populateMap(mapHeight, country) {
	var similarity_limits;
	var min_similarity;
	var max_similarity;
	const num_intervals = 5;
	const countryCodesURL = "https://raw.githubusercontent.com/daylight-lab/III/master/shared/data/country-codes/countries_codes_and_coordinates.csv";
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
	    	// console.log(ccMap);

	    	$.ajax( {
				url: "data/FinalUpdatedViz.json",
				type: "GET",
				contentType: "application/json; charset=utf-8",
				async: true,
				dataType: "json",
				success: function (inputData) {
					// console.log(inputData);
					combined_similarities = inputData;
					var similarityBounds = getSimilarityBounds(country, inputData);
					var minSimilarity = similarityBounds[0];
					var maxSimilarity = similarityBounds[1];

					// console.log(minSimilarity, maxSimilarity);

					var fills = dataToFills(inputData);
					// console.log(fills);

					var fillKeys = fillsToFillKeys(inputData, country);
					// console.log(fillKeys);

					var basicChloropleth = new Datamap({
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
							})
						},
						geographyConfig: {
							popupTemplate: function(geography, data) {
								return '<div class="hoverinfo">' + geography.properties.name + '<br>' + data.similarity / 100 + '</div>'
							}
						},
					})
				}
			
			} )

		}

	} )
}

function calculateForceData(country) {
	var nodeNames = Object.keys(combined_similarities);
	var forceNodes = [];
	var forceLinks = [];
	// console.log(combined_similarities);
	for (var i = 0; i < nodeNames.length; i++) {
		forceNodes.push({ "character" : nodeNames[i] });
		var source = nodeNames[i];
		var targets = Object.entries(combined_similarities[source]);
		for (var j = 0; j < targets.length; j++) {
			var target = targets[j][0];
			var targetIndex = nodeNames.indexOf(target);
			console.log(target, targetIndex);
			if (targetIndex >= 0) {
				forceLinks.push({
					"source" : i,
					"target" : nodeNames.indexOf(target),
					"weight" : targets[j][1].sim,
				})
			}
		}
	}
	// console.log(forceNodes);
	// console.log(forceLinks);
	return {
		"nodes" : forceNodes,
		"links" : forceLinks,
	}
}