import { populateMap } from "./geomap.js";
import { generateForceDirected } from "./force_directed_graph.js";

// global variables
var currMode = "world-map"; // world-map or force

// This method is called in `body onload` in index.html
export function input_load() {
  var input = document.getElementById('world-map');
  input.checked = "checked";
}

// Toggle between world map and force modes
// Called in index.html radio button.
function toggleMode(selectedCountryId) {
  if (currMode == "force") {
    enableWorldMap(selectedCountryId);
    currMode="world-map";
  } else if (currMode == "world-map") {
    enableForce();
    currMode="force";
  }
}

function displayToggleMode() {
  document.getElementById("vis_mode").innerHTML = `
    <div class="content_elem">
      <!-- Toggle map type -->
      <div class="mode_input">
        <input type="radio" id="world-map" name="mode", value="world-map">
        <label for="world-map"></label>World Map<br>
      </div>
      <div class="mode_input">
        <input type="radio" id="force" name="mode", value="force">
        <label for="force"></label>Force</br>
      </div>
    </div>
  `;
  document.getElementById("world-map").checked = "checked";
  document.getElementById("world-map").addEventListener("change", function() {
    toggleMode("USA");
  });
  document.getElementById("force").addEventListener("change", function() {
    toggleMode();
  });
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

populateMap("USA");
displayToggleMode();
