// global variables
var currMode = "world-map"; // world-map or force

// This method is called in `body onload` in index.html
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
// See geomap.js
function enableWorldMap() {
  // set up map
  document.getElementById("basic_chloropleth").innerHTML = "";
  document.getElementById("basic_chloropleth").style.width = "80%";
  document.getElementById("resetButton").style.display = "none";
  populateMap(750);
}

// Initialize force directed graph
// See force-directed-graph.js
function enableForce() {
  document.getElementById("basic_chloropleth").innerHTML = "";
  document.getElementById("basic_chloropleth").style.width = "100%";
  document.getElementById("selectedCountry").innerHTML = "";
  document.getElementById("similarityTable").innerHTML = "";
  document.getElementById("resetButton").style.display = "flex";
  document.getElementById("worldMapLegend").style.display = "none";
  generateForceDirected();
}


