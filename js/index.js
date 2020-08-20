// global variables
var currMode = "world-map"; // world-map or force

// This method is called in `body onload` in index.html
function input_load() {
  var input = document.getElementById('world-map');
  input.checked = "checked";
}

// Toggle between world map and force modes
// Called in index.html radio button.
function toggleMode(selectedCountryId) {
  if (currMode == "force") {
    enableWorldMap("USA");
    currMode="world-map";
  } else if (currMode == "world-map") {
    enableForce();
    currMode="force";
  }
}

// Initialize world map
// See geomap.js
function enableWorldMap(selectedCountryId) {
  // set up map
  document.getElementById("basic_chloropleth").innerHTML = "";
  // map takes up 80% of visible screen to leave space for legend
  document.getElementById("basic_chloropleth").style.width = "80%";
  document.getElementById("basic_chloropleth").style.height = "750px";
  // make force graph specific attributes invisible
  document.getElementById("resetButton").style.display = "none";
  // make legend invisible until a country is selected
  document.getElementById("worldMapLegend").style.display = "none";
  populateMap(selectedCountryId);
}

// Initialize force directed graph
// See force-directed-graph.js
function enableForce() {
  // set up force graph
  document.getElementById("basic_chloropleth").innerHTML = "";
  // force graph should take up the whole width of the visible screen
  document.getElementById("basic_chloropleth").style.width = "100%";
  // make world map specific attributes invisible
  document.getElementById("selectedCountry").innerHTML = "";
  document.getElementById("similarityTable").innerHTML = "";
  document.getElementById("worldMapLegend").style.display = "none";
  // make force graph specific attributes visible
  document.getElementById("resetButton").style.display = "flex";
  generateForceDirected();
}


