function top10(sorted_id, unsortedArray){
    var sorted = []
    for(var i=0; i < sorted_id.length; i++){
        sorted.push(unsortedArray[sorted_id[i]])}
    return sorted.slice(0,10)}

function buildMetadata(sample) {
    // buildGauge(data.WFREQ);
    var metaElement = d3.select("#sample-metadata")
    var washGauge = d3.select("#gauge")
    metaElement.html("")
    
    
    var url = `/metadata/${sample}`
    d3.json(url).then(function(response) {
        Object.entries(response).forEach(([key, value]) => {
        metaElement.append("p").text(`${key}: ${value}`); })
        
        var level = response['WFREQ'];
        

        // trig to calculate meter point
        var degrees = 180 - level*20,
             radius = .8;
        var radians = degrees * Math.PI / 180;
        var x = radius * Math.cos(radians);
        var y = radius * Math.sin(radians);
        var mainPath = 'M -.0 -0.025 L .0 0.025 L ',
             pathX = String(x),
             space = ' ',
             pathY = String(y),
             pathEnd = ' Z';
        var path = mainPath.concat(pathX,space,pathY,pathEnd);

        var data = [{ type: 'scatter',
           x: [0], y:[0],
            marker: {size: 28, color:'850000'},
            showlegend: false,
            name: 'Wash Frequency',
            text: level,
            hoverinfo: 'text+name'},
          { values: [10, 10, 10, 10, 10, 10, 10, 10, 10, 90],
          rotation: 90,
          text: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1'],
          textinfo: 'text',
          textposition:'inside',      
          marker: {
          colors:['rgba(132, 181, 137, .9)', 'rgba(141, 191, 145, .9)', 'rgba(138, 192, 134, .9)', 
                      'rgba(183, 205, 143, .9)', 'rgba(213, 229, 153, .9)', 'rgba(229, 232, 176, .9)',
                  'rgba(233, 230, 201, .9)', 'rgba(244, 241, 228, .9)', 'rgba(248, 243, 236, .9)',
                  'rgba(255, 255, 255, 0)']},
          labels: ['8-9', '7-8', '6-7', '5-6', '4-5', '3-4', '2-3', '1-2', '0-1', ''],
          hoverinfo: 'text',
          hole: .5,
          type: 'pie',
          showlegend: false
        }];

        var layout = {
          shapes:[{
              type: 'path',
              path: path,
              fillcolor: '850000',
              line: {
                color: '850000'
              }
            }],
          title: '<b>Belly Button Washing Frequency</b> <br> Scrubs Per Week',
          height: 500,
          width: 500,
          xaxis: {zeroline:false, showticklabels:false,
                     showgrid: false, range: [-1, 1]},
          yaxis: {zeroline:false, showticklabels:false,
                     showgrid: false, range: [-1, 1]}
        };

        Plotly.newPlot('gauge', data, layout);
        
    })
    
    
}

function buildCharts(sample) {

    var url = `/samples/${sample}`
    d3.json(url).then(function(response) {

        var values = response.sample_values
        var sorted_id = Array.from(Array(values.length).keys()).sort((a, b) => values[a] > values[b] ? -1 : (values[b] > values[a]) | 0)

        var trace1 = {
        type: "pie",
        values: top10(sorted_id, values),
        hovertext: top10(sorted_id, response.otu_labels),
        labels: top10(sorted_id, response.otu_ids),
        hoverinfo: 'text',
        };
    
        var trace2 = {
          x: response.otu_ids,
          y: response.sample_values,
          mode: "markers",
          type: "scatter",
          hovertext: response.otu_labels,
          marker: {
            color: response.otu_ids,
            size: response.sample_values,
            colorscale: "Earth"
          },
        };
    
    
    var layout1 = {
        title: "Pie Chart",
    };
    
    var layout2 = {
        title: "Bubble Plot",
        xaxis: {title: "otu_ids"},
        yaxis: {title: "sample values"},
        hovermode: 'closest'
    };

    Plotly.newPlot("pie", [trace1], layout1);
    Plotly.newPlot("bubble", [trace2], layout2);
    
})
}

function init() {
  // Grab a reference to the dropdown select element
  var selector = d3.select("#selDataset");

  // Use the list of sample names to populate the select options
  d3.json("/names").then((sampleNames) => {
    sampleNames.forEach((sample) => {
      selector
        .append("option")
        .text(sample)
        .property("value", sample);
    });

    // Use the first sample from the list to build the initial plots
    const firstBB = sampleNames[0];
    buildCharts(firstBB);
    buildMetadata(firstBB);
  });
}

function optionChanged(changeBB) {
  //get new data for dropdown menu selection
  buildCharts(changeBB);
  buildMetadata(changeBB);
}

// initialize dashboard
init();
