'use strict';

angular.module('myappApp')
	.directive('customBar', [function () {
		return {
			restrict: 'EA',
			scope: {
				data: '=data',
				viz: '='
			},
			templateUrl:'views/visualisation/bar.html',
			link: function (scope, iElement, iAttrs) {
				scope.filters = [{
						name: 'Date Co-Authored',
						type: 'select',
						values: scope.dates
					},{
						name: 'Number of times co-authored:',
						type: 'select',
						values: [{
							label: '1-5', 
							value: '1-5', 
							filterLabel: 'No. Times: ', 
							filterType: 'freq'
						},
						{
							label: '6-10', 
							value: '6-10', 
							filterLabel: 'No. Times: ', 
							filterType: 'freq'
						},
						{
							label: '11-15', 
							value: '11-15', 
							filterLabel: 'No. Times: ', 
							filterType: 'freq'
						}]
					}];
				scope.selectedFilters = [];
				var el = $('.bar-visualisation-container')[0]
				var margin = {top: 40, right: 100, bottom: 200, left: 23};
				var width = $('.bar-visualisation-container').width(),
	    			height = 550 - margin.top - margin.bottom;

	    		var color = d3.scale.category20(),
	    			tempColor;

	    		var svg = d3.select(el).append('svg')
		    			.attr('width', width + margin.right + margin.left)
		    			.attr('height', height + margin.top + margin.bottom)
		    		.append('g')
		    			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
				//y scale which scales every height into proportion from the max height
				processData(scope.data.coauthors, function(data){
					var yScale = d3.scale.linear()
									.domain([0, d3.max(data, function(d){
										return d.count;
									})])
									.range([0, height]);

					//vertical line to indicate what the heigh is about
					var vGuideScale = d3.scale.linear()	
										.domain([0,d3.max(data, function(d){return d.count;}) ])
										.range([height, 0]);
					var vAxis = d3.svg.axis()
								.scale(vGuideScale)
								.orient('left')
								.ticks(d3.max(data, function(d){return d.count;}));
					var vGuide = svg.append('g');
					    vAxis(vGuide);
					    vGuide.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
					    vGuide.selectAll('path')
					        .style({ fill: 'none', stroke: "#000"});
					    vGuide.selectAll('line')
					        .style({ stroke: "#000"});
					    vGuide.append('text')
					    	.attr('transform', 'rotate(-90)' )
					    	.attr('x', -40)
					    	.attr('y', -45 )
							.attr('dy','.71em' )
							.style({
								'fill': 'black',
								'text-anchor': 'end',
								'font-size': '1.3em'
							})
							.text('Number of times co-authored');


					var xScale = d3.scale.ordinal().domain(data.map(function(d){ 
										return d.name; }))
									.rangeBands([0, width - margin.right - margin.left], 0.3);

					var hAxis = d3.svg.axis()
					    .scale(xScale)
					    .orient('bottom')
					    .tickValues(xScale.domain());

					var hGuide = svg.append('g');
					    hAxis(hGuide);
					    hGuide.attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')');
					    hGuide.selectAll('path')
					        .style({ fill: 'none', stroke: "#000"});
					    hGuide.selectAll('line')
					        .style({ stroke: "#000"});
					    hGuide.selectAll('text')
					    	.style('text-anchor', 'start')
				      			.attr("dx", ".5em")
		            			.attr("dy", ".5em")
		            			.attr("transform", function(d) {
				               		return "rotate(20)"; 
				                });
				    var barChart = svg.selectAll('rect').data(data)
				    	.enter().append('rect')
				    		.style('fill', function(d,i){
				    			return color(i);
				    		})
				    		.attr('width', xScale.rangeBand())
				    		.attr('x' , function(d){
				    			return xScale(d.name) + margin.left;
				    		})
				    		.attr('height', 0)
				    		.attr('y', height)
				    	.on('mouseover',function(d){
							tempColor = this.style.fill;
					        d3.select(this)
					            .style('opacity', .5)
					            .style('fill', 'yellow');
						})
						.on('mouseout',function(d){
							d3.select(this)
					            .style('opacity', 1)
					            .style('fill', tempColor);
						});
					barChart.transition()
						.attr('height', function(d) {
					        return yScale(d.count);
					    })
					    .attr('y', function(d) {
					        return height - yScale(d.count) + margin.top;
					    })
					    .delay(function(d, i) {
					        return i * 50;
					    })
					    .duration(1000)
						.ease('elastic');
				});

				scope.openFilterModal = function(size){
					var modalInstance = $modal.open({
				      templateUrl: 'bubble_filter.html',
				      controller: 'BubbleModalCtrl',
				      size: size,
				      resolve: {
				        filters: function () {
				          return scope.filters;
				        }
				      }
				    });

				    modalInstance.result.then(function (reply) {
				    	if(scope.selectedFilters.length === 0){
				    		scope.selectedFilters = reply;
				    	} else {
				    		reply.forEach(function(newFilter){
				    			scope.selectedFilters.forEach(function(oldFilter,i){
				    				if(newFilter.type === oldFilter.type){
				    					if(newFilter.value === oldFilter.value){
				    						return;
				    					} else {
				    						scope.selectedFilters[i] = newFilter;
				    					}
				    				}
				    			});
				    		});
				    	}
					    updateViz();
				    }, function () {
				    	console.log('Modal dismissed at: ' + new Date());
				    });
				}

				function processData(data, callback){
					var temp = [];
					temp = data;

					callback(temp);
				}

				scope.removeFilter = function(filterToBeRemoved){
					scope.selectedFilters.forEach(function(filter,i,array){
						if(filterToBeRemoved.filterType === filter.filterType){
							array.splice(i,1);
						}
					});
					console.log(scope.selectedFilters);
					updateViz();
				}

				function filterByDate(fDate, filteredData){
					var temp = [];
					if(filteredData === undefined){
						scope.authorData.coauthors.forEach(function(author){
							author.dates.forEach(function(date){
								if(fDate === date){
									temp.push(author);
									return;
								}
							});
						});
					} else {
						filteredData.forEach(function(author){
							author.dates.forEach(function(date){
								if(fDate === date){
									temp.push(author);
									return;
								}
							});
						});
					}

					return temp;
				}

				function filterByFreq(fFreq, filteredData){
					var temp = [];
					var fFreqs = fFreq.split('-');
					if(filteredData === undefined){
						scope.authorData.coauthors.forEach(function(author){
							if(inRange(parseInt(fFreqs[0]), author.count, parseInt(fFreqs[1]))){
								temp.push(author);
							}
						});
					} else {
						filteredData.forEach(function(author){
							if(inRange(parseInt(fFreqs[0]), author.count, parseInt(fFreqs[1]))){
								temp.push(author);
							}
						});
					}
					return temp;
				}

				function inRange(min, number, max){
					return number >= min && number <= max;
				}
			}
		};
	}])