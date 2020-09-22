export const geomap = 'geomap';
export const forceGraph = 'force';
export const visDisplay = 'visDisplay';

/* global variables set to default values */
export var VIS_ID = 'visContainer';
export var MAP_HEIGHT = "750px"; // height of world map in pixels

export var SELECTED_COUNTRY = "USA";

export var DEFAULT_FILL = '#d3d3d3'; // default country color (no data)
export var SELECTED_FILL = '#228B22'; // selected country color
export var HIGHLIGHTED_FILL = 'orange'; // highlighted (moused-over) country color
export var COLOR_SCHEME = 'schemeBlues';

// maximum and minimum expected similarity scores
export var MAX_SIMILARITY = 1
export var MIN_SIMILARITY = 0

// highlight border width for countries with data
export var HIGHLIGHT_BORDER_WIDTH = 2

export var NUM_INCREMENTS = 7;
export var DIGITS_ROUNDED = 2;

// visualization modes
export var ENABLED_MODES = [geomap, forceGraph];
export var DEFAULT_MODE = geomap;

export var TABLE_PROPERTIES = [];
export var SHOW_TABLE = true;
