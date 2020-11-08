// import necessary libraries from root index file
import {
  jQuery,
} from './index.js';

// import global constants from root index file
import {
  data,
} from './index.js';

// import general methods from root index file
import {
  alpha3ToCountryName,
  selectCountry,
  similarityToLegendColor,
  generateDataObj,
  findMinMaxSimilarity,
  createLegendHTML,
} from './index.js';

// import constants from external file
const constants = require('./constants.js');

/**
* Description. Separate node and link data from global INPUT_DATA variable
* @param  inputData   [?]
* @return   Returns [?]
*/
function getNodesAndLinks(inputData) {
  var countryCodes = {}
  // construct a dict with the country code of every country as its key
  for (var [countryPair, similarityScore] of Object.entries(inputData)) {
    var [countryA, countryB] = countryPair.split('->');
    countryCodes[countryA] = null;
    countryCodes[countryB] = null;
  }
  // marshall that into the d3-force shape
  // [{"id": "nodeName", ...}]
  var nodes = [];
  // simultaneously, associate alpha codes to node index
  var alphaToIndex = {}
  var i = 0
  for (var alpha3 of Object.keys(countryCodes)) {
    nodes.push({"id": alpha3});
    alphaToIndex[alpha3] = i;
    i+=1;
  }

  // now we produce links
  var links = []
  for (var [countryPair, metrics] of Object.entries(inputData)) {
    // TODO why do we need to *100? hidden constants?
    var similarityScore = metrics.Overall_Similarity*100;
    var [countryA, countryB] = countryPair.split('->');
    if (100 - similarityScore >= 0 && similarityScore > 0) {
      links.push({
        source: alphaToIndex[countryA],
        target: alphaToIndex[countryB],
        similarity: similarityScore,
        weight: 100 - similarityScore,
      });
    }
  }

  return [nodes, links];
}

/** 
* Description. Calculate the average similarity value in the dataset to determine which edges will
* have high (low similarity, almost transparent) vs. low opacity (high similarity)
* @param  links   [?]
* @return   Returns [?]
*/
function calculateMeanSimilarity (links) {
  var count = 0;
  var similaritySum = 0;
  for (var link of links) {
    similaritySum += link.similarity;
    count++;
  }
  return similaritySum / count;
}

/**
* Description. Generate the SVG image holding the visualization 
* @param  width       [?]
* @param  height      [?]
* @param  marginLeft  [?]
* @param  marginTop   [?]
* @param  options     [?]
*/
function generateSvg (width, height, marginLeft, marginTop, options) {
  var visId = options.visId;

  return d3.select(`#${visId}_${constants.visDisplay}`)
      .append("svg")
      .attr({"width": width, "height": height})
      .append("g")
}

/** 
* Description. Calculate the height of the force visualization as the max edge length * 2 
* (in case there are 2 such edge lengths that end up spanning the height after rebalancing)
* @param  links   [?]
* @return   Returns [?]
*/
function calculateHeight (links) {
  var maxLength = -Infinity;
  var currLength;
  for (var link of links) {
    currLength = link.weight * 5;
    if (currLength > maxLength) {
      maxLength = currLength;
    }
  }
  return maxLength * 2;
}

/**
* Description. [?]
* @param  nodes   [?]
* @param  alpha3  [?]
* @return Returns [?]
*/
function findNode(nodes, alpha3) {
  const countryNode = nodes.filter(nodeInfo => nodeInfo.id === alpha3);
  return countryNode.length > 0 ? countryNode[0] : null;
}

/**
* Description. Uses the global data variable to generate a force graph with undirected edges
* between countries with corresponding edge lengths based on pairwise similarity 
* @param  options   [?]
*/
export function generateForceDirected(options) {
  // finds min & max similarity values between any country pair in the dataset
  var minSimilarity = options.minSimilarity;
  var maxSimilarity = options.maxSimilarity;
  var visId = options.visId;
  var numIncrements = options.numIncrements;
  const forceProperties = options[`${constants.force}${constants.properties}`];
  var mapHeight = forceProperties.mapHeight;
  var multiplier = forceProperties.linkMultiplier;
  var selectedCountry = forceProperties.selectedCountry;
  var interactive = forceProperties.interactive;
  
  createLegendHTML(options);

  /* Initial force graph settings */
  var radius = 6; // node size
  var padding = 100; // pads graph from edges of visualization
  const forceGraph = document.getElementById(`${visId}_${constants.visDisplay}`);
  var width = forceGraph.offsetWidth;
  var height = forceGraph.offsetHeight;
  
  // extract data from dataset
  var [nodes, links] = getNodesAndLinks(data);
  forceGraph.style.height = mapHeight;

  // create an SVG element and append it to the DOM
  var svgElement = generateSvg(width, height, 50, 20, options);

  // calculate average similarity of all visible nodes to find edge weight threshhold
  var meanSimilarity = calculateMeanSimilarity(links);
  
  // create force layout
  var forceLayout = d3.layout.force()
    .size([width, height])
    .nodes(nodes)
    .links(links)
    .gravity(0) // no attraction between nodes
    .charge(-3000) // repulse nodes so text is more visible & to prevent overlapping
    .linkDistance(d => d.weight * multiplier); // set edge length based on multiplier

  // add links to SVG
  var link = svgElement.selectAll(".link")
    .data(links)
    .enter()
    .append("line")
    .attr("stroke", d => {
      return similarityToLegendColor(d.similarity / 100, options)
    })
    .attr("stroke-width", 1)
    .attr("class", "link");
  
  // Increase node size & decrease opacity on node mouseover
  function mouseover(d) {
    if (!interactive) {
      return;
    }

    d3.select(this).transition()
      .duration(100)
      .attr("r", radius * 2)
      .attr("background-color", "#FFFBCC")
      .attr("opacity", 0.5);
  }

  // Reverse the effects of mouseover on the node
  function mouseout(d) {
    if (!interactive) {
      return;
    }

    d3.select(this).transition()
      .duration(100)
      .attr("r", radius)
      .attr("color", "black")
      .attr("opacity", 1);
  }

  // add nodes to SVG
  var node = svgElement.selectAll(".node")
    .data(nodes)
    .enter()
    .append("g")
    .attr("class", "node")
    .call(forceLayout.drag);
  
  // add labels to each node
  var label = node.append("text")
    .attr("dx", 12)
    .attr("dy", "0.35em")
    .attr("font-size", 14)
    .text(d => d.id);
  
  // add circles to each node & attach mouseover, mouseout functions
  var circle = node.append("circle")
    .attr("r", d => radius)
    .on("mouseover", mouseover)
    .on("mouseout", mouseout);

  var flag = false; // reload all nodes if flag is set
  var clickedNode; // keep track of selected node in the scope of the function

  // reload force graph data when a node is selected
  function selectCircle(d) {
    if (!interactive) {
      return;
    }

    // make similarity table visible again
    document.getElementById(`${visId}_${constants.similarityTable}`).style.display = 'flex';
    document.getElementById(`${visId}_${constants.selectedCountry}`).style.display = 'block';

    forceLayout.stop();
    var thisNode = d.id;

    // only include links connected to selected node
    links = oldLinks.filter(function(l) {
      var source = l.source;
      var target = l.target;
      if (typeof source != "number") {
        source = l.source.index;
      }
      if (typeof target != "number") {
        target = l.target.index;
      }
      var sourceName = nodes[source].id;
      var targetName = nodes[target].id;

      return (sourceName === thisNode) || (targetName === thisNode);
    });
    link.remove();
    link = svgElement.selectAll('.link')
      .data(links)
      .enter().append('line')
      .attr("class", "link")
      .attr("stroke", d => {
        return similarityToLegendColor(d.similarity / 100, options)
      })
      .attr("stroke-width", 1);
    
    flag = true;
    clickedNode = d;

    // redefine visualization settings & start force to rebalance graph with new links
    forceLayout.links(links);
    forceLayout.nodes(nodes);
    forceLayout.charge(-100)
    forceLayout.linkDistance(d => d.weight * multiplier)
    forceLayout.start()

    selectCountry (generateDataObj(data), alpha3ToCountryName(d.id), options);
  }

  // This function will be executed for every tick of force layout
  forceLayout.on("tick", function(){
    // set node positions (x, y)
    node
      .attr("cx", d => {
        if (clickedNode && d.id === clickedNode.id) {
          d.x = d.x + Math.round(width / 2 - d.x);
        } else {
          d.x = Math.max(radius + padding, Math.min(width - radius - padding, d.x));
        }
      })
      .attr("cy", d => {
        if (clickedNode && d.id === clickedNode.id) {
          d.y = d.y + Math.round(height / 2 - d.y);
        } else {
          d.y = Math.max(radius + padding, Math.min(height - radius - padding, d.y));
        }
      });
    
    // set link positions (x, y)
    if (flag) {
      link.attr("x1", d => nodes[d.source.index].x)
        .attr("y1", d => nodes[d.source.index].y)
        .attr("x2", d => nodes[d.target.index].x)
        .attr("y2", d => nodes[d.target.index].y)
        .attr("stroke", d => {
          return similarityToLegendColor(d.similarity / 100, options)
        });
    } else {
      link.attr("x1", d => d.source.x);
      link.attr("y1", d => d.source.y);
      link.attr("x2", d => d.target.x);
      link.attr("y2", d => d.target.y);
    }

    // shift node a little for rebalancing
    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });

  // track removed & original set of links
  var removedLinks;
  var oldLinks = jQuery.extend(true, [], links);

  // when the reset button is pressed, restore all of the links in the original dataset
  d3.select(`#${visId}_${constants.resetButton}`).on('click', function() {
    // remove similarity table
    document.getElementById(`${visId}_${constants.similarityTable}`).style.display = 'none';
    document.getElementById(`${visId}_${constants.selectedCountry}`).style.display = 'none';

    links = oldLinks;
    link.remove();
    node.remove();
    link = svgElement.selectAll('.link')
      .data(links)
      .enter().append('line')
      .attr('class', 'link')
      .attr("stroke", d => {
        return similarityToLegendColor(d.similarity / 100, options)
      })
      .attr('stroke-width', 1)
    node = svgElement.selectAll('.node')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .call(forceLayout.drag);
    label = node.append('text')
      .attr('dx', 12)
      .attr('dy', '0.35em')
      .attr('font-size', 14)
      .text(d => d.id);
    circle = node.append('circle')
      .attr('r', d => radius)
      .on('mouseover', mouseover)
      .on('mouseout', mouseout);
    circle.on('click', selectCircle);
    flag = false
    forceLayout.links(links);
    forceLayout.nodes(nodes);
    forceLayout.charge(-3000)
    forceLayout.linkDistance(d => d.weight * 5)
    forceLayout.start()
  })

  // call the selectCircle function whenever a circle is clicked
  circle.on('click', selectCircle);

  const selectedNode = findNode(nodes, selectedCountry);
  if (selectedNode) {
    const tempInteractive = interactive;
    interactive = true;
    selectCircle(selectedNode);
    interactive = tempInteractive;
  }

  // start the force layout calculation
  forceLayout.start();
}
