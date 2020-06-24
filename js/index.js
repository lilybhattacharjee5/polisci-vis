// global variables
var ccMap = {}; // maps country code to country name
const gray = "#d3d3d3"; // default country color (no data)

var currMode = "world-map";

var blue_line = [0, 0, 255];
var red_line = [255, 0, 0];

String.prototype.replaceAll = function(search, replacement) {
    var target = this;
    return target.split(search).join(replacement);
};

// This method is called in body onload
function input_load() {
  var input = document.getElementById('world-map');
  input.checked = "checked";
}

// Toggle between world map and force modes
// Called in index.html radio button.
function toggleMode(mode) {
  if (currMode == "force") {
    enableWorldMap();
    currMode="world-map";
  } else if (currMode == "world-map") {
    enableForce();
    currMode="force";
  }
}

// Initialize world map
function enableWorldMap() {
  // set up map
  document.getElementById("basic_chloropleth").innerHTML = "";
  document.getElementById("basic_chloropleth").style.width = "80%";
  // select USA by default
  var country = "USA";
  populateMap(750, country);
  document.getElementById("selected_country").innerHTML = "Selected Country: <div style = 'display: inline; color: blue;'>" + country + "</div>";
}

// Initialize force directed graph
function enableForce() {
  document.getElementById("basic_chloropleth").innerHTML = "";
  document.getElementById("basic_chloropleth").style.width = "100%";
  document.getElementById("selected_country").innerHTML = "";
  generateForceDirected();
}


