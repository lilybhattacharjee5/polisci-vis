function calculateForceData(country) {
	var nodeNames = Object.keys(combined_similarities);
	var forceNodes = [];
	var forceLinks = [];
	// console.log(combined_similarities);
	for (var i = 0; i < nodeNames.length; i++) {
		forceNodes.push({ "character" : nodeNames[i] });
		var source = nodeNames[i];
		var targets = Object.entries(combined_similarities[source]);
		for (var j = 0; j < targets.length; j++) {
			var target = targets[j][0];
			var targetIndex = nodeNames.indexOf(target);
			console.log(target, targetIndex);
			if (targetIndex >= 0) {
				forceLinks.push({
					"source" : i,
					"target" : nodeNames.indexOf(target),
					"weight" : targets[j][1].sim,
				})
			}
		}
	}
	// console.log(forceNodes);
	// console.log(forceLinks);
	return {
		"nodes" : forceNodes,
		"links" : forceLinks,
	}
}

function generateForceDirected() {
  var margin = {
    top: 20,
    bottom: 50,
    right: 30,
    left: 50
  };
  var width = $('#basic_chloropleth').width();
  var height = $('#basic_chloropleth').height();
  // Create an SVG element and append it to the DOM
  var svgElement = d3.select("#basic_chloropleth")
            .append("svg")
            .attr({"width": width, "height": height})
            .append("g")
            .attr("transform","translate("+margin.left+","+margin.top+")");
  // Load External Data
  dataset = calculateForceData();
  // Extract data from dataset
  var nodes = dataset.nodes;
  var links = dataset.links;
  var radius = 6;
  var padding = 20;
  console.log(nodes);
  console.log(links);
  // Create Force Layout
  var force = d3.layout.force()
          .size([width, height])
          .nodes(nodes)
          .links(links)
          .gravity(0)
          .charge(0)
          .linkDistance(function(d) { return d.weight * 50; });
  // Add links to SVG
  var link = svgElement.selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("stroke", "#add8e6")
        .attr("stroke-width", function(d){ return d.weight / 20; })
        .attr("class", "link");
  // Add nodes to SVG
  var node = svgElement.selectAll(".node")
        .data(nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .call(force.drag);
  // Add labels to each node
  var label = node.append("text")
          .attr("dx", 12)
          .attr("dy", "0.35em")
          .attr("font-size", 14)
          .text(function(d){ return d.character; });
  // Add circles to each node
  var circle = node.append("circle")
          .attr("r", function(d){ return radius; })
  // This function will be executed for every tick of force layout
  force.on("tick", function(){
    // Set X and Y of node
    node.attr("r", function(d){ return d.influence; })
    .attr("cx", function(d) { return d.x = Math.max(radius, Math.min(width - radius - padding, d.x)); })
    .attr("cy", function(d) { return d.y = Math.max(radius, Math.min(height - radius - padding, d.y)); });
    // Set X, Y of link
    link.attr("x1", function(d){ return d.source.x; });
    link.attr("y1", function(d){ return d.source.y; });
    link.attr("x2", function(d){ return d.target.x; });
    link.attr("y2", function(d){ return d.target.y; });
    // Shift node a little
    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });
  // Start the force layout calculation
  force.start();
}
