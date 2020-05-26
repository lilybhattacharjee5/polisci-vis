function condenseGDPRICLab(data) {
  const dataArray = Object.entries(data);
  return dataArray;
}

function getDomainDataICLab(country, inputData) {
  $.ajax( {
    url: "notebooks/new_common_domains/" + country + "-common-domains.csv",
    type: "GET",
    async: true,
    dataType: "text",
    error: function () {
      document.getElementById("domain_table").innerHTML = '<table class="table table-bordered table-striped">No data available</table>';
    },
    success: function ( rawDomainData ) {
      var domainData = rawDomainData.split(/\r?\n|\r/);
      var tableData = {};
      var currCountry;
      var countryCount = 0;
      var currDomains = [];
      var skipRow = false;
      for (var count = 0; count < domainData.length - 1; count++) {
        var cellData = domainData[count].split(",");
        if (count == 0) {
        } else {
          if (cellData[1] === country || cellData[2] === country) {
            var otherCountry = cellData[1];
            if (cellData[1] === country) {
              otherCountry = cellData[2];
            }
            if (count == 1) {
              currCountry = otherCountry;
            }
            if (otherCountry === currCountry && count < domainData.length - 2) {
              countryCount += 1;
              currDomains.push(cellData[3] + '.' + cellData[4]);
            } else {
              if (count >= domainData.length - 2) {
                countryCount += 1;
                currDomains.push(cellData[3] + '.' + cellData[4]);
              }
              if (currCountry) {
                var correctCurrCountry = currCountry;
                if (currCountry == 'Lichtenstein') {
                  correctCurrCountry = 'Liechtenstein';
                }
                if (currCountry == "Russia") {
                  correctCurrCountry = "Russian Federation";
                }
                var inputDataKey = "('" + country + "', '" + ccMap['"' + correctCurrCountry + '"'] + "')";
                if (currCountry == "Moldova") {
                  inputDataKey = "('" + country + "', 'MDA')";
                }

                if (inputData[inputDataKey]) {
                  tableData[currCountry] = {"count": countryCount, "domains": [], "similarity": inputData[inputDataKey][0].similarity}
                  for (var c = 0; c < currDomains.length; c++) {
                    tableData[currCountry].domains.push(currDomains[c]);
                  }
                }     
              }
              countryCount = 0;
              currDomains = [];
              currCountry = otherCountry;
              countryCount += 1;
              currDomains.push(cellData[3] + '.' + cellData[4]);
            }
          }
        }
      }
      sortedTableData = sortResults(condenseGDPRICLab(tableData), 'count');
      formatResults(sortedTableData);
  }});
}

function populateMapICLab(map_height, country) {
  var similarity_limits;
  var min_similarity;
  var max_similarity;
  const num_intervals = 5;
  const countryCodesURL = "https://raw.githubusercontent.com/daylight-lab/III/master/shared/data/country-codes/countries_codes_and_coordinates.csv";
  if (!includedCountries.includes(country)) {
    return;
  }
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

      $.ajax( {
      url: "new-combined-similarities.json",
      type: "GET",
      contentType: "application/json; charset=utf-8",
      async: true,
      dataType: "json",
      success: function ( inputData ) {
          combined_similarities = inputData;
          var fills = deriveColorScale(inputData);
          var fillKeys = generateFillKeys(country, inputData);
          getDomainDataICLab(country, inputData);
          var basic_choropleth = new Datamap({
            element: document.getElementById("basic_chloropleth"),
            projection: 'mercator',
            fills: fills,
            data: fillKeys,
            done: function(datamap) {
              datamap.svg.selectAll('.datamaps-subunit').on('click', function(geography) {
                  country = geography.properties.name;
                  if (!includedCountries.includes(country)) {
                    return;
                  }
                  fillKeys = generateFillKeys(country, inputData);
                  datamap.updateChoropleth(fillKeys, {reset: true});
                  getDomainDataICLab(country, inputData);
                  document.getElementById("selected_country").innerHTML = "Selected Country: <div style = 'display: inline; color: blue;'>" + country + "</div>";
                  similarity_limits = drawLegend(country, fills, fillKeys);
                  min_similarity = similarity_limits[0];
                  max_similarity = similarity_limits[1];
                  drawLegendIntervals(min_similarity, max_similarity, num_intervals);
              });
            },
            geographyConfig: {
              borderColor: function(data) {
                return '#b1b1b1';
              },
              popupTemplate: function(geography, data) {
                return;
              },
              highlightOnHover: false,
            },
          });
          similarity_limits = drawLegend(country, fills, fillKeys);
          min_similarity = similarity_limits[0];
          max_similarity = similarity_limits[1];
          drawLegendIntervals(min_similarity, max_similarity, num_intervals);
    }});
  }});
}
