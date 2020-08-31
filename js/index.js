import { populateMap } from "./geomap.js";
import { generateForceDirected } from "./force_directed_graph.js";

var currMode = "world-map"; // world-map or force

// global variables
export const data = JSON.parse(require('../data/data.json'));

export var MAP_HEIGHT = 750; // height of world map in pixels

export var DEFAULT = "#d3d3d3"; // default country color (no data)
export var SELECTED = "#228B22"; // selected country color
export var HIGHLIGHTED = "orange"; // highlighted (moused-over) country color

// maximum and minimum expected similarity scores
export var MAX_SIMILARITY = 1
export var MIN_SIMILARITY = 0

// highlight border width for countries with data
export var HIGHLIGHT_BORDER_WIDTH = 2

export var NUM_INCREMENTS = 7;
export var DIGITS_ROUNDED = 2;

// This method is called in `body onload` in index.html
export function inputLoad(
  mapHeight,
  defaultFill,
  selectedFill,
  highlightedFill,
  maxSimilarity,
  minSimilarity,
  highlightBorderWidth,
  numIncrements,
  digitsRounded) {
  // set global variables
  MAP_HEIGHT = mapHeight;
  DEFAULT = defaultFill;
  SELECTED = selectedFill;
  HIGHLIGHTED = highlightedFill;
  MAX_SIMILARITY = maxSimilarity;
  MIN_SIMILARITY = minSimilarity;
  HIGHLIGHT_BORDER_WIDTH = highlightBorderWidth;
  NUM_INCREMENTS = numIncrements;
  DIGITS_ROUNDED = digitsRounded;

  populateMap("USA");
  displayToggleMode();
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
