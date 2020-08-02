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

function calculateMeanSimilarity (links) {
  var count = 0;
  var similaritySum = 0;
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
  var meanSimilarity = calculateMeanSimilarity(links);
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
  function mouseover(d) {
    d3.select(this).transition()
        .duration(100)
        .attr("r", radius * 2)
        .attr("background-color", "#FFFBCC")
        .attr("opacity", 0.5);
  }

  function mouseout(d) {
    d3.select(this).transition()
      .duration(100)
      .attr("r", radius)
      .attr("color", "black")
      .attr("opacity", 1);
  }

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
      .text(d => d.id);
  // Add circles to each node
  var circle = node.append("circle")
      .attr("r", d => radius)
      .on("mouseover", mouseover)
      .on("mouseout", mouseout);

  function selectCircle(d) {
    force.stop();
    var thisNode = d.id;
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
    })
    link.remove();
    link = svgElement.selectAll('.link')
    .data(links)
    .enter().append('line')
        .attr("class", "link")
        .attr("stroke","#625EED")
        .attr("stroke-width", 1)
    flag = true;
    clickedNode = d;
    force.links(links);
    force.nodes(nodes);
    force.charge(-100)
    force.linkDistance(d => d.weight * 5)
    force.start()
  }

  var flag = false;
  var clickedNode;

  // This function will be executed for every tick of force layout
  force.on("tick", function(){
    // Set X and Y of node
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
    // Set X, Y of link
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

    // Shift node a little
    node.attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
  });

  var removedLinks;
  // var oldLink = jQuery.extend(true, [], link);
  var oldLinks = jQuery.extend(true, [], links);
  var count = 0;

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
    // node.remove();
    circle.on("click", selectCircle)
    flag = false
    force.links(links);
    force.nodes(nodes);
    force.charge(-3000)
    force.linkDistance(d => d.weight * 7)
    force.start()
  })

  circle.on("click", selectCircle)
  d3.select(".container").on("click",function(){
    link.attr("opacity", 1);
  });

  // Start the force layout calculation
  force.start();
}
