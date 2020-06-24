// global variables
var ccMap = {}; // maps country code to country name
const gray = "#d3d3d3"; // default country color (no data)

const modes = ["world-map", "force"];
var currModeIdx = 0;
var currMode = modes[currModeIdx];

var combined_similarities; // holds loaded similarity ratios to prevent extra reloads
const combined_similarities_urls = ["similarity_data/combined-similarities.json", "data/dropped_us_combined_similarities.json"];

var blue_line = [0, 0, 255];
var red_line = [255, 0, 0];

var datasource_mode = 1;

var condenseGDPR;
var getDomainData;
// var populateMap;

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

function input_load() {
  var input = document.getElementById('world-map');
  input.checked = "checked";
}

function toggleDataSourceMode() {
  // datasource_mode = 1 - datasource_mode;
  datasource_mode = 1;
  // console.log(datasource_mode)

  if (datasource_mode == 0) {
    condenseGDPR = condenseGDPRDiff;
    getDomainData = getDomainDataDiff;
    populateMap = populateMapDiff;
  } else {
    condenseGDPR = condenseGDPRICLab;
    getDomainData = getDomainDataICLab;
    populateMap = populateMapICLab;
  }

  // reload combined similarities
  $.ajax( {
      url: combined_similarities_urls[datasource_mode],
      type: "GET",
      contentType: "application/json; charset=utf-8",
      async: true,
      dataType: "json",
      success: function ( inputData ) {
        combined_similarities = inputData;
      }
  } );
  toggleMode(currMode);
}

// toggle between world map and force modes
function toggleMode(mode) {
  currModeIdx = modes.indexOf(mode);
  currMode = modes[currModeIdx];
  // document.getElementById("curr_mode").innerHTML = currMode;
  if (currModeIdx == 0) {
    enableWorldMap();
  } else if (currModeIdx == 1) {
    enableForce();
  }
}

function setupMap() {
  document.getElementById("basic_chloropleth").innerHTML = "";
  document.getElementById("legend").style.display = "";
  document.getElementById("basic_chloropleth").style.width = "80%";
}

function enableWorldMap() {
  setupMap();
  var country = "USA";
  populateMap(750, country);
  document.getElementById("selected_country").innerHTML = "Selected Country: <div style = 'display: inline; color: blue;'>" + country + "</div>";
}

function enableForce() {
  document.getElementById("basic_chloropleth").innerHTML = "";
  document.getElementById("basic_chloropleth").style.width = "100%";
  document.getElementById("legend").style.display = "none";
  document.getElementById("selected_country").innerHTML = "";
  // document.getElementById("domain_table").innerHTML = "";
  generateForceDirected();
}


function generateForceDirected() {
  var margin = {
    top: 20,
    bottom: 50,
    right: 30,
    left: 50
  };
  var width = $('#basic_chloropleth').width();
  var height = $('#basic_chloropleth').height();
  // Create an SVG element and append it to the DOM
  var svgElement = d3.select("#basic_chloropleth")
            .append("svg")
            .attr({"width": width, "height": height})
            .append("g")
            .attr("transform","translate("+margin.left+","+margin.top+")");
  // Load External Data
  dataset = calculateForceData();
  // Extract data from dataset
  var nodes = dataset.nodes;
  var links = dataset.links;
  var radius = 6;
  var padding = 20;
  console.log(nodes);
  console.log(links);
  // Create Force Layout
  var force = d3.layout.force()
          .size([width, height])
          .nodes(nodes)
          .links(links)
          .gravity(0)
          .charge(0)
          .linkDistance(function(d) { return d.weight * 50; });
  // Add links to SVG
  var link = svgElement.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "#add8e6")
        .attr("stroke-width", function(d){ return d.weight / 20; })
        .attr("class", "link");
  // Add nodes to SVG
  var node = svgElement.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(force.drag);
  // Add labels to each node
  var label = node.append("text")
          .attr("dx", 12)
          .attr("dy", "0.35em")
          .attr("font-size", 14)
          .text(function(d){ return d.character; });
  // Add circles to each node
  var circle = node.append("circle")
          .attr("r", function(d){ return radius; })
  // This function will be executed for every tick of force layout
  force.on("tick", function(){
    // Set X and Y of node
    node.attr("r", function(d){ return d.influence; })
    .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius - padding, d.x)); })
    .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius - padding, d.y)); });
    // Set X, Y of link
    link.attr("x1", function(d){ return d.source.x; })
    link.attr("y1", function(d){ return d.source.y; })
    link.attr("x2", function(d){ return d.target.x; })
    link.attr("y2", function(d){ return d.target.y; });
    // Shift node a little
    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")"; 
    });
  });
  // Start the force layout calculation
  force.start();
}

function formatResults(sortedData) {
  if (!sortedData.length) {
    document.getElementById("domain_table").innerHTML = "<p>No known blocked websites, though website takedowns have been enacted. See <a href = 'https://www.ice.gov/factsheets/ipr-in-our-sites' target = '_blank'>Operation In Our Sites</a>.</p>";
    document.getElementById("domain_table").style.height = "100px";
    return;
  }
  document.getElementById("domain_table").style.height = "500px";
  var tableData = '<table class="table table-bordered table-striped">';
  tableData += '<th>Country</th>';
  tableData += '<th>Count</th>';
  tableData += '<th>Similarity</th>';
  tableData += '<th>Domains</th>';
  for (var i = 0; i < sortedData.length; i++) {
    tableData += '<tr>';
    tableData += '<td>'+sortedData[i][0]+'</td>';
    tableData += '<td>'+sortedData[i][1].count+'</td>';
    tableData += '<td>'+sortedData[i][1].similarity+'</td>';
    tableData += '<td>';
    var allDomains = sortedData[i][1].domains;
    for (var domainCount = 0; domainCount < allDomains.length; domainCount++) {
      tableData += allDomains[domainCount] + '<br>';
    }
    tableData += '</td>';
    tableData += '</tr>';
  }
  document.getElementById("domain_table").innerHTML = tableData;
}

function sortResults(data, valueName) {
  data.sort(function(a, b) {
    const aCount = a[1][valueName];
    const bCount = b[1][valueName];
    return bCount - aCount;
  });
  return data;
}

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
  curr_hex = fullColorHex(Math.round(num * color_line[0]), Math.round(num * color_line[1]), Math.round(num * color_line[2]));
  return curr_hex;
}

function deriveColorScale(data) {
    var fills = {};
    var curr_similarity;
    var country_limits = {};
    var split_country;
    var start_country;
    for (var country in data) {
        split_country = country.split(", ")[0];
        start_country = split_country.replace('(', '').replace(/'/g,'');
        curr_similarity = data[country][0].similarity;
        if (country_limits[start_country]) {
          var curr_max = country_limits[start_country].max;
          var curr_min = country_limits[start_country].min;
          if (curr_similarity > curr_max) {
            country_limits[start_country].max = curr_similarity;
          }
          if (curr_similarity < curr_min) {
            country_limits[start_country].min = curr_similarity;
          }
        } else {
          country_limits[start_country] = { "max": curr_similarity, "min": curr_similarity };
        }
    }
    var scaled_frac;
    for (var country in data) {
        split_country = country.split(", ")[0];
        start_country = split_country.replace('(', '').replace(/'/g,'');
        curr_similarity = data[country][0].similarity;

        var curr_max = country_limits[start_country].max;
        var curr_min = country_limits[start_country].min;

        scaled_frac = (curr_similarity - curr_min) / (curr_max - curr_min);
        curr_hex = numToHex(scaled_frac, blue_line);
        fills[country] = curr_hex;
    }
    fills["defaultFill"] = gray;
    fills["selected"] = "#218023";
    return fills;
}

function generateFillKeys(country, data) {
    var fillKeys = {};
    var c1;
    var c2;
    var split_pair;
    var uniqueCCs = [];
    for (var pair in data) {
      split_pair = pair.split(", ");
      c1 = split_pair[0].slice(2,split_pair[0].length - 1);
      c2 = split_pair[1].slice(1,split_pair[1].length - 2);
      if (c1 == country) {
        fillKeys[c2] = { "fillKey": pair, "similarity": data[pair][0].similarity };
      }
    }
    if (country == "United States of America") {
      fillKeys[ccMap["\"United States\""]] = { "fillKey": "selected" };
    } else {
      fillKeys[ccMap["\"" + country + "\""]] = { "fillKey": "selected" };
    }
    return fillKeys;
}

function drawLegendIntervals(map_height, min_similarity, max_similarity, num_intervals) {
  const similarity_range = max_similarity - min_similarity;
  const jump = similarity_range / num_intervals;
  const legend_labels = document.getElementById("legend_labels");
  const div_height = map_height/num_intervals;
  legend_labels.innerHTML = ""
  for (var i = num_intervals; i > 0; i--) {
    if (i == num_intervals) {
      legend_labels.innerHTML += "<div style = 'height:" + div_height + "'></div>"
      continue;
    }
    legend_labels.innerHTML += "<div class = 'legend_elem' style = 'height:" + div_height + ";'>" + Math.round((min_similarity + jump * i) * Math.pow(10,6))/Math.pow(10,6) + "</div>"
  }
}

function drawLegend(country, fills, fillKeys) {
  var legend_div = document.getElementById("legend_div");
  var min_similarity = 0;
  var max_similarity = -Infinity;
  var min_similarity_key;
  var max_similarity_key;
  var max_color;
  var min_color;
  var curr_similarity;
  var currFill;
  var newMax = -Infinity;
  var newMin = Infinity;
  for (const [key, value] of Object.entries(fills)) {
    if (value != "#NaNNaNNaN") {
      currFill = parseInt("0x" + value.slice(1, value.length).toUpperCase());
      if (currFill > newMax && key != "selected" && key != "defaultFill") {
        newMax = currFill;
        max_key = key;
      }
      if (currFill < newMin && key != "selected" && key != "defaultFill") {
        newMin = currFill;
        min_key = key;
      }
    }
  }
  min_similarity = combined_similarities[min_key][0].similarity;
  min_color = numToHex(min_similarity / (newMax - newMin), blue_line);
  max_similarity = combined_similarities[max_key][0].similarity;
  max_color = numToHex(max_similarity / (max_similarity - min_similarity), blue_line);
  if (min_color == "#NaNNaNNaN") {
    min_color = "black";
  }
  if (max_color == "#NaNNaNNaN") {
    max_color = "black";
  }
  const legend_input = "linear-gradient(to top, " + min_color + ", " + max_color + ")";
  document.getElementById("min_val").innerHTML = Math.round(min_similarity * Math.pow(10,6))/Math.pow(10,6);
  document.getElementById("max_val").innerHTML = Math.round(max_similarity * Math.pow(10,6))/Math.pow(10,6);
  legend_div.style.backgroundImage = legend_input;
  return [min_similarity, max_similarity];
}

