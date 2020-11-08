export const worldMap = 'worldMap';
export const force = 'force';

/* global variables set to default values */
export var VIS_ID = 'visContainer';
export var VIS_HEIGHT = '750px'; // height of visualization in pixels
export var VIS_WIDTH_WORLDMAP = '80%';
export var VIS_WIDTH_FORCE = '100%';

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
export var ENABLED_MODES = [worldMap, force];
export var DEFAULT_MODE = worldMap;

export var TABLE_PROPERTIES = [];
export var SHOW_TABLE = true;

export var MULTIPLIER = 5;
export var INTERACTIVE = true;

export const tooltipOffset = 10;

// component names
export var content = 'content';
export var selectedCountry = 'selectedCountry';
export const visDisplay = 'visDisplay';
export const resetButton = 'resetButton';
export const visLegend = 'visLegend';
export const visLegendTitle = 'visLegendTitle';
export const visLegendBody = 'visLegendBody';
export const visLegendGradient = 'visLegendGradient';
export const visLegendLabels = 'visLegendLabels';
export const visMode = 'visMode';
export const similarityTable = 'similarityTable';
export const modeInput = 'modeInput';
export const properties = 'Properties';
export const countryName = 'countryName';
export const tooltip = 'tooltip';
export const hoverinfo = 'hoverinfo';
