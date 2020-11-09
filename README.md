# interoperability-viz 
## Internationally Blocked Domains Demo

[Live Demo](https://lilybhattacharjee5.github.io/interoperability-viz-package-demo/index.html)

This interactive demo visualizes countries with similar website blocking
patterns. See [our data processing
repository](https://github.com/daylight-lab/uclab-data-processing) for how we
generated our data source.

## Getting started

`interoperability-viz` is a Node.js module. It can be installed via npm:

```
npm install @lbhattac/interoperability-viz
```

## Creating a visualization

Note: Refer to our [demo repository]() for an example implementation.

To include this visualization on a webpage, take the following steps:
1. Import the `InteroperabilityVisualization` function from `@lbhattac/interoperability-viz` in your JS file.
```
import { InteroperabilityVisualization } from '@lbhattac/interoperability-viz';
```

2. Import your bundled JS file in your base HTML file below the div in which the visualization will appear:
```
<div id='visContainer'></div>

<script src="index.bundle.js"></script>
```

4. Inside the JS file, call the function `index.InteroperabilityVisualization` to initialize the display.
```
<script>
index.InteroperabilityVisualization({
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
    showTable: true,
    worldMapProperties: {
        visHeight: '750px',
        defaultFill: '#d3d3d3',
        selectedFill: '#228B22',
        highlightedFill: 'orange',
        highlightBorderWidth: 2,
        selectedCountry: 'USA',
        interactive: true,
    },
    forceProperties: {
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
- **data**: a JSON object that follows the formatting described in this [README](https://github.com/lilybhattacharjee5/interoperability-demo/tree/master/data)
- **defaultMode**: string; the mode of the visualization that is initially visible to the user
	- defaults to 'geomap'
	- possible values: 'geomap', 'force'

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
	- defaults to ['geomap', 'force']
	- only supports combinations of 'geomap', 'force' (the 2 currently supported modes)
- **tableProperties**: list of strings; the input data country-pair-specific properties that will be visible in the similarity table
	- defaults to []
	- if `tableProperties` = [], the similarity table will not appear
- **showTable**: boolean; determines whether or not the similarity table is visible
- **geomapProperties**: geomap-specific properties
	- *visHeight*: string; height in pixels of the visualization's geomap mode e.g. '750px'
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
	- *visHeight*
	- *selectedCountry*: initially selected country in force mode
		- no default value -- if not passed in, the full force graph with all input data will be visible
	- *linkMultiplier*: int / float; constant by which edge lengths are multiplied in the force graph for visual reasons (i.e. so edges aren't too short)
		- defaults to 5
	- *interactive*

It is not necessary to pass in mode-specific properties if the mode is not within `enabledModes` for the specific visualization. For example, if `enabledModes` does not contain `force`, `forceProperties` may be omitted from the passed properties.

Note: Parameter order doesn't matter, as all arguments are passed in map format.

## Repository structure

- `data/`: marshalled data produced by [our data processing
  repo](https://github.com/daylight-lab/uclab-data-processing)
- `js`: includes individual JS files for implementing specific visualization modes
- `libraries`: code dependencies unavailable via `npm install`
- `local_country_variables/`: logic for marshalling country names

## License
BSD-3
