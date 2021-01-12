# polisci-vis
[View a demo!](https://lilybhattacharjee5.github.io/polisci-vis-live-demo/index.html)

This interactive demo visualizes countries with similar website blocking
patterns. See [our data processing
repository](https://github.com/daylight-lab/uclab-data-processing) for how we
generated our data source.

## Getting started

`polisci-vis` is a Node.js module. It can be installed via npm:

```
npm install polisci-vis
```

## Creating a visualization

Note: Refer to our [demo repository](https://github.com/lilybhattacharjee5/polisci-vis-live-demo) for an example implementation.

To include this visualization on a webpage, take the following steps:
1. Import the `createVisualization` function from `polisci-vis` in your JS file.
```
import { createVisualization } from 'polisci-vis';
```

2. Import your bundled JS file in your base HTML file below the div in which the visualization will appear:
```
<div id='visContainer'></div>

<script src="index.bundle.js"></script>
```

4. Inside the JS file, call the function `createVisualization` to initialize the display.
```
<script>
createVisualization({
    visId: 'visContainer',
    data: data,
    numIncrements: 5,
    minSimilarity: 0,
    maxSimilarity: 1,
    digitsRounded: 2,
    colorScheme: 'schemeBlues',
    defaultMode: 'force',
    enabledModes: ['force'],
    tableProperties: ['similarity'],
    tableColumnNames: ['Similarity'],
    showTable: true,
    worldMapProperties: {
    	visibleProperty: 'similarity',
        visHeight: '750px',
        defaultFill: '#d3d3d3',
        selectedFill: '#228B22',
        highlightedFill: 'orange',
        highlightBorderWidth: 2,
        selectedCountry: 'USA',
        interactive: true,
    },
    forceProperties: {
    	visibleProperty: 'similarity',
        visHeight: '750px',
        selectedCountry: 'CHN',
        linkMultiplier: 5,
        interactive: false,
    },
});
</script>
```

The function accepts the following **required** parameters:
- **visId**: string; the id of the div that the visualization will be in
	- defaults to 'visContainer' (but will error if this id is not on the embedding page)
- **data**: a JSON object that follows the formatting described in this [README](https://github.com/lilybhattacharjee5/polisci-vis/tree/master/data)
- **defaultMode**: string; the mode of the visualization that is initially visible to the user
	- defaults to 'worldMap'
	- possible values: 'worldMap', 'force'

The following parameters are **optional**:
- **numIncrements**: int; the number of increments in the visualization legend
	- defaults to 5
- **minSimilarity**: int / float; the minimum country-pair similarity value
	- defaults to 0
- **maxSimilarity**: int / float; the maximum country-pair similarity value
	- defaults to 1
- **digitsRounded**: int; the number of digits past the decimal point that any table values should be rounded to
	- defaults to 2
- **colorScheme**: string; the color theming for the visualization
	- **must** be a valid color scheme from the [d3-chromatic library](https://github.com/d3/d3-scale-chromatic)
	- sequential color scales are recommended for the most meaningful visual results
	- defaults to 'schemeBlues'
- **enabledModes**: list of strings; the modes of the visualization that the user can toggle between
	- defaults to ['worldMap', 'force']
	- only supports combinations of 'worldMap', 'force' (the 2 currently supported modes)
- **tableProperties**: list of strings; the input data country-pair-specific properties that will be visible in the similarity table
	- defaults to []
	- if `tableProperties` = [], the similarity table will not appear
- **tableColumnNames**: list of strings; the corresponding column labels that will be visible in the similarity table, and radio button labels for displaying layered data
	- defaults to []
	- if `tableColumnNames` = [], the similarity table will not appear
- **showTable**: boolean; determines whether or not the similarity table is visible
- **worldMapProperties**: worldMap-specific properties
	- *visibleProperty*: the country-pair property that will be visible by default in the current mode
		- should be specified even if there is only one unique pair property in the dataset
		- defaults to 'similarity'
	- *visHeight*: string; height in pixels of the visualization's worldMap mode e.g. '750px'
		- defaults to '750px'
	- *defaultFill*: string (hex or color name); color of countries on map for which no data is available
		- defaults to '#d3d3d3'
	- *selectedFill*: string (hex or color name); color of currently selected country on map
		- defaults to '#228B22'
	- *highlightedFill*: string (hex or color name); color of currently moused-over / highlighted country on map
		- defaults to 'orange'
	- *highlightBorderWidth*: int; border width in pixels of currently moused-over / highlighted country
		- defaults to 2
	- *selectedCountry*: initially selected country in map mode
		- defaults to 'USA'
	- *interactive*: boolean; determines whether viewers can interact with the visualization to change its appearance (e.g. clicking)
		- defaults to true
- **forceProperties**: force graph-specific properties
	- *visibleProperty*
	- *visHeight*
	- *selectedCountry*: initially selected country in force mode
		- no default value -- if not passed in, the full force graph with all input data will be visible
	- *linkMultiplier*: int / float; constant by which edge lengths are multiplied in the force graph for visual reasons (i.e. so edges aren't too short)
		- defaults to 5
	- *interactive*

It is not necessary to pass in mode-specific properties if the mode is not within `enabledModes` for the specific visualization. For example, if `enabledModes` does not contain `force`, `forceProperties` may be omitted from the passed properties.

Note: Parameter order doesn't matter, as all arguments are passed in map format.

## API

You can also call other functions to manipulate visualization state after initializing with `createVisualization`:

**`loadData(options, data)`**
*Description*: Changes the data object that populates the visualization. The new data object should follow the formatting directions specified in the `data/` directory README.
*Parameters:*
- options: the current options object
- data: the new data object

*Example call:*
```
const newData = JSON.parse(require('./new_data.json'));

loadData(options, newData);
```

**`selectCountry(countryName, options)`**
*Description:* Sets the selected country in the current mode.
*Parameters:*
- countryName: the name of the country to be selected e.g. 'Norway', 'United States', etc.
- options: the current options object

*Example call:*
```
selectCountry("United States", options);
```

**`showDataTable(options)`**
*Description:* Shows the data table with country-pair properties under the visualization.
*Parameters:*
- options: the current options object

*Example call:*
```
showDataTable(options);
```

**`hideDataTable(options)`**
*Description:* Hides the data table with country-pair properties under the visualization.
*Parameters:*
- options: the current options object

*Example call:*
```
hideDataTable(options);
```

**`changeLayer(options, layer)`**
*Description:* Changes the visible data layer in the current mode.
*Parameters:*
- options: the current options object
- layer: the property name that will be visible in the current mode

*Example call:*
```
changeLayer(options, 'similarity');
```

**`disableLayering(options, layer, layerName)`**
*Description*: Disables data layering, leaving only a specified layer visible without toggle options.
*Parameters:*
- options: the current options object
- layer: the property name that will be the *only* property visible in the visualization
- layerName: the column label name corresponding to layer

*Example call:*
```
disableLayering(options, 'similarity', 'Similarity');
```

**`enableLayering(options, layers, layerNames)`**
*Description*: Enables data layering, with toggling available between specified layers.
*Parameters:*
- options: the current options object
- layers: an array of property names that can be toggled in the visualization
- layerNames: the column label names corresponding to layers

*Example call:*
```
enableLayering(options, ['similarity', 'x'], ['Similarity', 'X_Prop']);
```

**`disableInteractive(options, mode)`**
*Description*: Disables clickable changes / interactivity in the specified mode.
*Parameters:*
- options: the current options object
- mode: the mode to disable interactivity

*Example call:*
```
disableInteractive(options, 'force');
```

**`enableInteractive(options, mode)`**
*Description*: Enables clickable changes / interactivity in the specified mode.
*Parameters:*
- options: the current options object
- mode: the mode to enable interactivity

*Example call:*
```
enableInteractive(options, 'force');
```

**`getState(options)`**
*Description*: Returns a condensed current state of the visualization, containing some manipulated options attributes. Useful for testing.
*Parameters:*
- options: the current options object

*Example call:*
```
getState(options)
```

**`setState(options)`**
*Description*: Sets the state of the visualization to the specified options object and reloads the visualization.
*Parameters:*
- options: the new options object

*Example call:*
```
setState(options)
```

## Repository structure

- `data/`: marshalled data produced by [our data processing
  repo](https://github.com/daylight-lab/uclab-data-processing)
- `js/`: includes individual JS files for implementing specific visualization modes
- `css/`: includes CSS styling files
- `libraries/`: code dependencies unavailable via `npm install`
- `local_country_variables/`: logic for marshalling country names

## License
BSD-3
