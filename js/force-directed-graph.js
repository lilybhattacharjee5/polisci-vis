var LINK_COLOR = "#625EED";

/* Separate node and link data from global INPUT_DATA variable */
function getNodesAndLinks (inputData) {
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

/* Calculate the average similarity value in the dataset to determine which edges will
have high (low similarity, almost transparent) vs. low opacity (high similarity) */
function calculateMeanSimilarity (links) {
  var count = 0;
  var similaritySum = 0;
  for (var link of links) {
    similaritySum += link.similarity;
    count++;
  }
  return similaritySum / count;
}

/* Generate the SVG image holding the visualization */
function generateSvg (width, height, marginLeft, marginTop) {
  return d3.select("#basic_chloropleth")
      .append("svg")
      .attr({"width": width, "height": height})
      .append("g")
}

/* Calculate the height of the force visualization as the max edge length * 2 
(in case there are 2 such edge lengths that end up spanning the height after rebalancing) */
function calculateHeight (links) {
  var maxLength = -Infinity;
  var currLength;
  for (var link of links) {
    currLength = link.weight * 7;
    if (currLength > maxLength) {
      maxLength = currLength;
    }
  }
  return maxLength * 2;
}

/* Uses the global INPUT_DATA variable to generate a force graph with undirected edges
  between countries with corresponding edge lengths based on pairwise similarity */
function generateForceDirected() {
  /* Initial force graph settings */
  var radius = 6; // node size
  var padding = 100; // pads graph from edges of visualization
  var width = $('#basic_chloropleth').width();
  var height = $('#basic_chloropleth').height();
  // the constant by which the similarity score is multiplied
  // toggled based on whether or not a country node is selected
  var multiplier = 7;
  
  // extract data from dataset
  var [nodes, links] = getNodesAndLinks(INPUT_DATA);
  // vary visualization height based on maximum edge length
  height = calculateHeight(links, multiplier);
  document.getElementById("basic_chloropleth").style.height = height;

  // create an SVG element and append it to the DOM
  var svgElement = generateSvg(width, height, 50, 20);

  // calculate average similarity of all visible nodes to find edge weight threshhold
  var meanSimilarity = calculateMeanSimilarity(links);
  
  // create force layout
  var force = d3.layout.force()
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
    .attr("stroke", LINK_COLOR)
    .attr("stroke-width", 1)
    .attr("class", "link");
  
  // Increase node size & decrease opacity on node mouseover
  function mouseover(d) {
    d3.select(this).transition()
      .duration(100)
      .attr("r", radius * 2)
      .attr("background-color", "#FFFBCC")
      .attr("opacity", 0.5);
  }

  // Reverse the effects of mouseover on the node
  function mouseout(d) {
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
    .call(force.drag);
  
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
    force.stop();
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
      .attr("stroke", LINK_COLOR)
      .attr("stroke-width", 1);
    // toggle multiplier to a lower value to resize visualization proportionally
    multiplier = 5;
    height = calculateHeight(links, multiplier);
    document.getElementById("basic_chloropleth").style.height = height;
    
    flag = true;
    clickedNode = d;

    // redefine visualization settings & start force to rebalance graph with new links
    force.links(links);
    force.nodes(nodes);
    force.charge(-100)
    force.linkDistance(d => d.weight * multiplier)
    force.start()
  }

  // This function will be executed for every tick of force layout
  force.on("tick", function(){
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
        .attr("opacity", function(d) { 
          if (d.similarity > meanSimilarity) {
            return 1;
          }
          return 0.1;
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

  // when reset button is pressed, restore all of the links in the original dataset
  d3.select("#resetButton").on("click", function() {
    links = oldLinks
    link.remove();
    node.remove()
    link = svgElement.selectAll('.link')
    .data(links)
    .enter().append('line')
        .attr("class", "link")
        .attr("stroke","#625EED")
        .attr("stroke-width", 1)
    node = svgElement.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag);
    label = node.append("text")
      .attr("dx", 12)
      .attr("dy", "0.35em")
      .attr("font-size", 14)
      .text(d => d.id);
    circle = node.append("circle")
      .attr("r", d => radius)
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);
    circle.on("click", selectCircle);
    height = calculateHeight(links) * 1.5;
    document.getElementById("basic_chloropleth").style.height = height;
    flag = false
    force.links(links);
    force.nodes(nodes);
    force.charge(-3000)
    force.linkDistance(d => d.weight * 7)
    force.start()
  })

  // call the selectCircle function whenever a circle is clicked
  circle.on("click", selectCircle);

  // start the force layout calculation
  force.start();
}
