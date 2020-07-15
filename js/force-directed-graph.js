// function calculateForceData(country) {
// 	var nodeNames = Object.keys(inputData);
// 	var forceNodes = [];
// 	var forceLinks = [];
// 	// console.log(combined_similarities);
// 	for (var i = 0; i < nodeNames.length; i++) {
// 		forceNodes.push({ "character" : nodeNames[i] });
// 		var source = nodeNames[i];
// 		var targets = Object.entries(inputData[source]);
// 		for (var j = 0; j < targets.length; j++) {
// 			var target = targets[j][0];
// 			var targetIndex = nodeNames.indexOf(target);
// 			console.log(target, targetIndex);
// 			if (targetIndex >= 0) {
// 				forceLinks.push({
// 					"source" : i,
// 					"target" : nodeNames.indexOf(target),
// 					"weight" : targets[j][1].sim,
// 				})
// 			}
// 		}
// 	}
// 	// console.log(forceNodes);
// 	// console.log(forceLinks);
// 	return {
// 		"nodes" : forceNodes,
// 		"links" : forceLinks,
// 	}
// }

// function calculateForceData () {

// }

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
  for (var [countryPair, similarityScore] of Object.entries(inputData)) {
    var [countryA, countryB] = countryPair.split('->');
    // links.push({
    //   source: alphaToIndex[countryA],
    //   target: alphaToIndex[countryB],
    //   weight: similarityScore,
    // });
    if (100 - similarityScore >= 0 && similarityScore > 0) {
      links.push({
        source: alphaToIndex[countryA],
        target: alphaToIndex[countryB],
        similarity: similarityScore,
        weight: 100 - similarityScore,
      });
    }
    // } else {
    //   links.push({
    //     source: alphaToIndex[countryA],
    //     target: alphaToIndex[countryB],
    //     weight: 100,
    //   });
    // }
  }

  return [nodes, links];
}

function calculateMeanSimilarity (links) {
  var count = 0;
  var similaritySum = 0;
  console.log(links);
  for (var link of links) {
    similaritySum += link.similarity;
    count++;
  }
  return similaritySum / count;
}


function generateSvg (width, height, marginLeft, marginTop) {
  return d3.select("#basic_chloropleth")
      .append("svg")
      .attr({"width": width, "height": height})
      .append("g")
      .attr("transform","translate("+marginLeft+","+marginTop+")");
}


function generateForceDirected() {
  // node circles
  var radius = 6;
  var padding = 100;
  var width = $('#basic_chloropleth').width();
  var height = $('#basic_chloropleth').height();
  // Create an SVG element and append it to the DOM
  var svgElement = generateSvg(width, height, 50, 20);
  // Extract data from dataset
  var [nodes, links] = getNodesAndLinks(INPUT_DATA);
  // var links = getLinks(INPUT_DATA)
  var meanSimilarity = calculateMeanSimilarity(links);
  console.log("mean similarity", meanSimilarity);
  // Create Force Layout
  var force = d3.layout.force()
      .size([width, height])
      .nodes(nodes)
      .links(links)
      .gravity(0)
      .charge(-3000)
      .linkDistance(d => d.weight * 7);
  // Add links to SVG
  var link = svgElement.selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("stroke", "#625EED")
      .attr("stroke-width", 1)
      .attr("class", "link");
  // Add nodes to SVG
  function mouseover() {
    d3.select(this).select("circle").transition()
        .duration(750)
        .attr("r", radius * 1.5);
  }

  function mouseout() {
    d3.select(this).select("circle").transition()
      .duration(750)
      .attr("r", radius);
  }

  var node = svgElement.selectAll(".node")
      .data(nodes)
      .enter()
      .append("g")
      .attr("class", "node")
      .call(force.drag)
      // .on("mouseover", mouseover)
      // .on("mouseout", mouseout);
  // Add labels to each node
  var label = node.append("text")
      .attr("dx", 12)
      .attr("dy", "0.35em")
      .attr("font-size", 14)
      .text(d => d.id);
  // Add circles to each node
  var circle = node.append("circle")
      .attr("r", d => radius);

  var flag = false;

  // This function will be executed for every tick of force layout
  force.on("tick", function(){
    // Set X and Y of node
    node
      // .attr("r", d => d.influence)
      .attr("cx", d =>
            d.x = Math.max(radius + padding, Math.min(width - radius - padding, d.x)))
      .attr("cy", d =>
            d.y = Math.max(radius + padding, Math.min(height - radius - padding, d.y)));
    // Set X, Y of link
    if (flag) {
      link.attr("x1", d => nodes[d.source].x)
        .attr("y1", d => nodes[d.source].y)
        .attr("x2", d => nodes[d.target].x)
        .attr("y2", d => nodes[d.target].y)
        .attr("opacity", function(d) { 
          if (d.similarity > meanSimilarity) {
            return 1;
          }
          return 0.1;
        });
        force.linkDistance(d => d.weight * 7)
        force.gravity(0)
        // force.charge(-100)
    } else {
      link.attr("x1", d => d.source.x);
      link.attr("y1", d => d.source.y);
      link.attr("x2", d => d.target.x);
      link.attr("y2", d => d.target.y);
    }
    

    // Shift node a little
    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });

  var removedLinks;
  var oldLink = jQuery.extend(true, [], link);
  var oldLinks = jQuery.extend(true, [], links);
  var count = 0;

  node.on("click", function(d) {
    force.stop();
    var thisNode = d.id;
    links = oldLinks.filter(function(l) {
      var sourceName = nodes[l["source"]]["id"];
      var targetName = nodes[l["target"]]["id"];

      return (sourceName === thisNode) || (targetName === thisNode);
    })
    link.remove();
    link = svgElement.selectAll('.link')
    .data(links)
    .enter().append('line')
        .attr("class", "link")
        .attr("stroke","#625EED")
        .attr("stroke-width", 1)
    // force("charge").strength(0)
    flag = true;
    force.start()
  });

  d3.select(".container").on("click",function(){
    link.attr("opacity", 1);
  });

  // Start the force layout calculation
  force.start();
}
