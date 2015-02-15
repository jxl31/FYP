'use strict';

angular.module('myappApp')
	.directive('customTrend', ['$modal','$location','$rootScope',function ($modal,$location,$rootScope) {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/trend.html',
			scope: {
				data: '=',
				change: '&',
			},
			link: function (scope, iElement, iAttrs) {
					var margin = {
							top: 100,
							right: 20,
							bottom: 50,
							left: 70
						},
					width = $('.visualisation-panel').width(),
					height = 400;

				var parseDate = d3.time.format('%m/%Y').parse;

				//x axis
				var x = d3.time.scale()
    					.range([0, width]);

    			var xAxis = d3.svg.axis()
					    .scale(x)
					    .orient('bottom');

    			//y axis
    			var y = d3.scale.linear()
    				.range([height, 0]);

    			var yAxis = d3.svg.axis()
				    .scale(y)
				    .orient('left');

				var line = d3.svg.line()
				    .x(function(d) { return x(d.tDate); })
				    .y(function(d) { return y(d.amount); });

				var svg = d3.select(iElement[0]).append('svg')
				    .attr('width', width + margin.left + margin.right)
				    .attr('height', height + margin.top + margin.bottom)
				  .append('g')
				    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

				processData(function(){
					scope.data.trendData.forEach(function(d){
						d.tDate = parseDate(d.date);
					});
					//Setting up how far the data will go to the top and from the side so
					//it wont overflow to any other div in the template
					x.domain(d3.extent(scope.data.trendData, function(d) { return d.tDate; }));
					y.domain([0,d3.max(scope.data.trendData, function(d) { return d.amount; })]);
					yAxis.ticks(d3.max(scope.data.trendData, function(d) { return d.amount }));

					svg.append('g')
				      .attr('class', 'trend-x trend-axis')
				      .attr('transform', 'translate(0,' + height + ')')
				      .call(xAxis);

				    svg.append('g')
				      .attr('class', 'trend-y trend-axis')
				      .call(yAxis);

				    svg.append('path')
				      .datum(scope.data.trendData)
				      .attr('class', 'trend-line')
				      .attr('d', line);

				   	//initialize tooltip
				   	var tip = d3.tip()
						.attr('class', 'd3-tip')
						.offset([-5,0])
						.html(function(d) {
						    return constructTooltipHTML(d);
						});

					svg.call(tip);

				    //x-axis label
				    svg.append('text')
					  .attr('class', 'xlabel')
					  .attr('text-anchor', 'middle')
					  .attr('x', width / 2)
					  .attr('y', height + margin.bottom)
					  .text('Years');
					//y-axis label
					svg.append("text")
					  .attr("class", "ylabel")
					  .attr("y", 0 - margin.left) // x and y switched due to rotation!!
					  .attr("x", 0 - (height / 2))
					  .attr("dy", "1em")
					  .attr("transform", "rotate(-90)")
					  .style("text-anchor", "middle")
					  .text("Number of Publication");

					//add dots
					svg.selectAll(".dot")
					  .data(scope.data.trendData)
					  .enter().append("circle")
					  .attr('class', 'datapoint')
					  .attr('cx', function(d) { return x(d.tDate); })
					  .attr('cy', function(d) { return y(d.amount); })
					  .attr('r', 9)
					  .attr('fill', 'white')
					  .attr('stroke', 'steelblue')
					  .attr('stroke-width', '3')
					  .on('mouseover', function(d){
					  	tip.show(d);
					  })
					  .on('mouseout', tip.hide)
					  .on('click', function(d){ goToCloudGraph(d); });
				});

				
				function goToCloudGraph(d){
					scope.change({viz: $rootScope.topics[1].visualisations[1], docs: d.titles });
					scope.$apply();
				}


				function processData(callback){
					var docs = scope.data.docs;
					var tempData = [];
					docs.forEach(function(d,i){
						if(i === 0){
							tempData.push({
								date: d.publication_date,
								amount: 1,
								titles: [d.title],
								indexes: [i]
							});
						} else {
							for(var y = 0; y < tempData.length; y++){
								if(tempData[y].date === d.publication_date){
									tempData[y].amount++;
									tempData[y].titles.push(d.title);
									tempData[y].indexes.push(i);
									return;
								} else if(y+1 === tempData.length){
									tempData.push({
										date: d.publication_date,
										amount : 1,
										titles: [d.title],
										indexes: [i]
									});
									return;
								}
							} //for
						} //else
					});

					scope.data['trendData'] = tempData;

					callback();
				}

				function constructTooltipHTML(d){
					var htmlToBeReturned = ''
					var titles = '<strong><b>Titles: </b></strong><br>';
					var amount = '<strong><b>Amount: </b></strong>';
					var date = '<strong><b>Date: </b></strong>';

					d.titles.forEach(function(data){
						titles += data + '<br>'
					});

					amount += d.amount+ '<br>';
					date += d.date + '<br>';

					htmlToBeReturned = titles + amount + date;

					return htmlToBeReturned
				}

				function getAmountDoc(date){

				}

			}
		};
	}]);