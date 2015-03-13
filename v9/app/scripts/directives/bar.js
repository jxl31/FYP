'use strict';

angular.module('BarsDirective',[])
	.directive('customBar', ['$modal','$location','$window',function ($modal, $location,$window) {
		return {
			restrict: 'EA',
			scope: {
				data: '=data',
				viz: '='
			},
			templateUrl:'views/visualisation/bar.html',
			link: function (scope, iElement, iAttrs) {
				scope.currentDate = new Date();
				scope.dates = getDates();
				scope.to = d3.max(scope.dates, function(d){
					return parseInt(d.value);
				});
				scope.from = d3.min(scope.dates, function(d){
					return parseInt(d.value);
				});
				scope.filters = [{
					name: 'Date Co-Authored',
					type: 'select',
					values: [
						{
							label: 'a year ago ('.concat(scope.currentDate.getFullYear()-1,'-',scope.currentDate.getFullYear(),')'),
							value: scope.currentDate.getFullYear()-1,
							filterLabel: 'Date Co-Authored',
							filterType: 'date',
							sortValue: 1
						},
						{
							label: 'last 2 years ('.concat(scope.currentDate.getFullYear()-2,'-',scope.currentDate.getFullYear(),')'),
							value: scope.currentDate.getFullYear()-2,
							filterLabel: 'Date Co-Authored',
							filterType: 'date',
							sortValue: 2 
						},
						{
							label: 'last 3 years ('.concat(scope.currentDate.getFullYear()-3,'-',scope.currentDate.getFullYear(),')'),
							value: scope.currentDate.getFullYear()-3,
							filterLabel: 'Date Co-Authored',
							filterType: 'date',
							sortValue: 3
						},
						{
							label: 'last 4 years ('.concat(scope.currentDate.getFullYear()-4,'-', scope.currentDate.getFullYear(),')'),
							value: scope.currentDate.getFullYear()-4,
							filterLabel: 'Date Co-Authored',
							filterType: 'date',
							sortValue: 4
						},
						{
							label: 'last 5 years ('.concat(scope.currentDate.getFullYear()-5,'-',scope.currentDate.getFullYear(),')'),
							value: scope.currentDate.getFullYear()-5,
							filterLabel: 'Date Co-Authored',
							filterType: 'date',
							sortValue: 5
						},
						{
							label: 'last 10 years ('.concat(scope.currentDate.getFullYear()-10,'-',scope.currentDate.getFullYear(),')'),
							value: scope.currentDate.getFullYear()-10,
							filterLabel: 'Date Co-Authored',
							filterType: 'date',
							sortValue: 10
						},
						{
							label: 'last 20 years ('.concat(scope.currentDate.getFullYear()-20,'-',scope.currentDate.getFullYear(),')'),
							value: scope.currentDate.getFullYear()-20,
							filterLabel: 'Date Co-Authored',
							filterType: 'date',
							sortValue: 20
						}
					]}
					,{
						name: 'Number of times co-authored:',
						type: 'select',
						values: [{
							label: 'more than once', 
							value: '1-500', 
							filterLabel: 'No. Times: ', 
							filterType: 'freq',
							sortValue: 1
						},
						{
							label: 'more than five times', 
							value: '5-500', 
							filterLabel: 'No. Times: ', 
							filterType: 'freq',
							sortValue: 5
						},
						{
							label: 'more than 10 times', 
							value: '10-500', 
							filterLabel: 'No. Times: ', 
							filterType: 'freq',
							sortValue: 10
					}]
				}];
				scope.selectedFilters = [];
				var el = $('.bar-visualisation-container')[0]
				var margin = {top: 40, right: 100, bottom: 200, left: 23};
				var width = $('.bar-visualisation-container').width(),
	    			height = 550 - margin.top - margin.bottom;

	    		var color = d3.scale.category20(),
	    			tempColor, barChart, tip;

	    		var svg = d3.select(el).append('svg')
		    			.attr('width', width + margin.right + margin.left)
		    			.attr('height', height + margin.top + margin.bottom)
		    		.append('g')
		    			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
				//y scale which scales every height into proportion from the max height
				processData(scope.data.coauthors, function(data){
					tip = d3.tip()
						.attr('class', 'd3-tip')
						.html(function(d) { 
							return constructTooltipHTML(d);
						})
						.offset([-12,0]);

					svg.call(tip);
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
					var vGuide = svg.append('g')
					.attr('class', 'y axis');
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

					var hGuide = svg.append('g')
								.attr('class','x axis');
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
				    barChart = svg.selectAll('rect').data(data);
				    var barChartEnter = barChart.enter().append('rect')
				    		.style('fill', function(d,i){
				    			return color(i);
				    		})
				    		.attr('width', xScale.rangeBand())
				    		.attr('x' , function(d){
				    			return xScale(d.name) + margin.left;
				    		})
				    		.attr('height', 0)
				    		.attr('y', height);

				    barChart.on('mouseover',function(d){
				    		tip.show(d);
							tempColor = this.style.fill;
					        d3.select(this)
					            .style('opacity', .5)
					            .style('fill', 'yellow');
						})
						.on('mouseout',function(d){
							if(firstClick){
								tip.hide(d);
							}
							tip.hide(d);
							d3.select(this)
					            .style('opacity', 1)
					            .style('fill', tempColor);
						})
						.on('click', function(d){
							firstClick = true;
							tip.show(d);
						})
						.on('dblclick', function(d){
							var path = '';
							if(!scope.authorData.corp){
								path = '/author/'+d.fname+'/'+d.lname+'/'+d.key+'/'+scope.viz.value;
							} else {
								path = '/author/' +
										'/' + d.fullname + 
										'/' + d.link +
										'/' + scope.viz.value;
							}
	      					$location.path(path);
	      					tip.hide();
	      					scope.$apply();
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

				function updateViz(){
					var filteredData;
					if(scope.selectedFilters.length === 0){
						filteredData = scope.data.coauthors;
					} else {
						scope.selectedFilters.forEach(function(filter){
							if(filter.filterType === 'date'){
								filteredData = filterByDate(filter.value, filteredData);

							} else if(filter.filterType === 'freq'){
								filteredData = filterByFreq(filter.value, filteredData);
							}
						});
					}
					if(filteredData.length === 0){
						d3.select('#legend-bubble').selectAll('tbody').remove();
						svg.selectAll('g').remove();
						svg.append('svg:text')
							.attr('x', 100)
							.attr('y', diameter/3)
							.text('No authors with the following constrainst. Please remove or select another.');
					} else {
						processData(filteredData, function(data){
							//remove y-axis and x-axis
							svg.select('.y.axis').remove();
							svg.select('.x.axis').remove();
							svg.selectAll('rect').remove();
							svg.selectAll('text').remove();
							svg.call(tip);
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

							var vGuide = svg.append('g').attr('class','y axis');
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

							var hGuide = svg.append('g')
										.attr('class','x axis');
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

							barChart = svg.selectAll('rect').data(data);
						    var barChartEnter = barChart.enter().append('rect')
						    		.style('fill', function(d,i){
						    			return color(i);
						    		})
						    		.attr('width', xScale.rangeBand())
						    		.attr('x' , function(d){
						    			return xScale(d.name) + margin.left;
						    		})
						    		.attr('height', 0)
						    		.attr('y', height);
						    		
						    barChart.on('mouseover',function(d){
						    		tip.show(d);
									tempColor = this.style.fill;
							        d3.select(this)
							            .style('opacity', .5)
							            .style('fill', 'yellow');
								})
								.on('mouseout',function(d){
									tip.hide(d);
									d3.select(this)
							            .style('opacity', 1)
							            .style('fill', tempColor);
								});
							barChartEnter.transition()
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

							barChart.exit().remove();
						});
					}
				}

				function constructTooltipHTML(d){
					var name = d.name;
					var count = d.count;
					var university = d.university;
					var title = name;
					var years = d.dates.toString();
					var find =',';
					var re = new RegExp(find,'g');
					var fYears = years.replace(re,', ');

					var html = 
					'<div class="panel panel-primary">' + 
						'<div class="panel-heading">' +
							name +
						'</div>' +
						'<div class="panel-body">' + 
							'<p><strong class="tooltip-body-title">University: </strong>' + university +
							'</p><p><strong class="tooltip-body-title">Number of times coauthored: </strong>' + count +
							'</p><p><strong class="tooltip-body-title">Years Co-Authored: </strong>' + fYears + '</p>'
						'</div>' 
					' </div>';

					return html;
				}

				function getDates (){
					var dates = [];
					scope.data.coauthors.forEach(function(author){
						author.dates.forEach(function(date){
							if(dates.length === 0){
								dates.push({ label: date, 
									value: date, 
									filterLabel: 'Date CoAuthored: ',
									filterType: 'date'
								});
							} else {
								for(var i =0; i < dates.length; i++){
									if(dates[i].value === date) return;
								}
								dates.push({ label: date, value: date, filterLabel: 'Date CoAuthored: ', filterType: 'date'});
							}
						});
					});
					return dates;
				}

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
				    		for(var i = 0; i < reply.length; i++){
				    			for(var j = 0; j < scope.selectedFilters.length; j++){
				    				if(reply[i].filterType === scope.selectedFilters[j]){
				    					break;
				    				}
				    			}
				    			scope.selectedFilters.push(reply[i]);
				    		}

				    	}
					    updateViz();
				    }, function () {
				    	console.log('Modal dismissed at: ' + new Date());
				    });
				}

				var firstClick = true;
				$window.onclick = function(){
					var jTip = $('.d3-tip');
					if(!firstClick){
						tip.hide();
					} else {
						firstClick = false;
					}
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
					var iFDate = parseInt(fDate);
					var temp = [];
					if(filteredData === undefined){
						scope.data.coauthors.forEach(function(author){
							author.dates.forEach(function(date){
								if(iFDate <= date){
									temp.push(author);
									return;
								}
							});
						});
					} else {
						filteredData.forEach(function(author){
							author.dates.forEach(function(date){
								if( iFDate <= date){
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
						scope.data.coauthors.forEach(function(author){
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