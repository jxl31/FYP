'use strict';

angular.module('myappApp')
	.directive('customTrend', ['$modal','$location','$rootScope','$window',function ($modal,$location,$rootScope,$window) {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/trend.html',
			scope: {
				data: '=',
				change: '&',
				viz: '='
			},
			link: function (scope, iElement, iAttrs) {
				var margin = {
						top: 50,
						right: 20,
						bottom: 50,
						left: 70
					},
				width = $('.trend-visualisation-container').width(),
				height = 450;
				var tip;
				scope.dates = getDates();
				var firstClick = true;
				scope.selectedFilters = [];
				scope.filters = 
				[{
					name: 'Peer Reviewed Publication',
					type: 'select',
					values: [{
						label: 'Peer Reviewed', 
						value: true, 
						filterLabel: 'Peer Reviewed', 
						filterType: 'peer',
						sortValue: 1
					},
					{
						label: 'Not Peer Reviewed', 
						value: false, 
						filterLabel: 'Peer Reviewed ', 
						filterType: 'peer',
						sortValue: 5
					}]
				},{
					name: 'Publication Title',
					type: 'select',
					values: getPublicationTitles(scope.data.docs),
				}];

				scope.to = d3.max(scope.dates, function(d){
					return parseInt(d);
				});
				scope.from = d3.min(scope.dates, function(d){
					return parseInt(d);
				});

				var parseDate = d3.time.format('%Y').parse;

				//x axis
				var x = d3.time.scale()
    					.range([0, width - margin.left - margin.right]);

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

				var el = $('.trend-visualisation-container')[0];
				var svg = d3.select(el).append('svg')
				    .attr('width', width + margin.left + margin.right)
				    .attr('height', height + margin.top + margin.bottom)
				  .append('g')
				    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

				processData(scope.data.docs, function(data){
					data.forEach(function(d){
						d.tDate = parseDate(d.date);
					});
					//Setting up how far the data will go to the top and from the side so
					//it wont overflow to any other div in the template
					x.domain(d3.extent(data, function(d) { return d.tDate; }));
					console.log(x.domain());
					y.domain([0,d3.max(data, function(d) { return d.amount; })]);
					yAxis.ticks(d3.max(data, function(d) { return d.amount }));
					console.log(data);
					svg.append('g')
				      .attr('class', 'trend-x trend-axis')
				      .attr('transform', 'translate(0,' + height + ')')
				      .call(xAxis);

				    svg.append('g')
				      .attr('class', 'trend-y trend-axis')
				      .call(yAxis);

				    var path = svg.append('path')
				      .datum(data)
				      .attr('class', 'trend-line')
				      .attr('d', line);

				   	//initialize tooltip
				   	tip = d3.tip()
						.attr('class', 'd3-tip tooltip-trend')
						.offset([0,-10])
						.direction(function(d){
							if(y(d.amount) < height * .4) return 's';
							else return 'n';
						})
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
					svg.append('text')
					  .attr('class', 'ylabel')
					  .attr('y', 0 - margin.left) // x and y switched due to rotation!!
					  .attr('x', 0 - (height / 2))
					  .attr('dy', '1em')
					  .attr('transform', 'rotate(-90)')
					  .style('text-anchor', 'middle')
					  .text('Number of Publication');

					//add dots
					svg.selectAll('.dot')
					  .data(data)
					  .enter().append("circle")
					  .attr('class', 'datapoint')
					  .attr('cx', function(d) { return x(d.tDate); })
					  .attr('cy', function(d) { return y(d.amount); })
					  .attr('r', 9)
					  .attr('fill', 'white')
					  .attr('stroke', 'steelblue')
					  .attr('stroke-width', '3')
					  .style('cursor', 'pointer')
					  .on('click', function(d){
					  	firstClick = true;
					  	tip.show(d);
					  })
					  .on('dblclick', function(d){ 
					  	tip.hide(d);
					  	scope.goToCloudGraph(d);
					  });
				});

				function updateViz(){
					var filteredData;
					if(scope.selectedFilters.length === 0){
						filteredData = scope.data.docs;
					} else {
						scope.selectedFilters.forEach(function(filter){
							if(filter.filterType === 'peer'){
								filteredData = filterByPeer(filter.value, filteredData);
							} else if(filter.filterType === 'p_title'){
								filteredData = filterByPublicationTitle(filter.value, filteredData);
							}
						});
					}

					if(filteredData.length === 0){
						svg.selectAll('g').remove();
						svg.append('svg:text')
							.attr('x', 100)
							.attr('y', diameter/3)
							.text('No authors with the following constrainst. Please remove or select another.');
					} else {
						processData(filteredData, function(data){
							data.forEach(function(d){
								d.tDate = parseDate(d.date);
							});
							console.log(data);
							x.domain(d3.extent(data, function(d) { return d.tDate; }));
							xAxis.scale(x);
							y.domain([0,d3.max(data, function(d) { return d.amount; })]);
							yAxis.scale(y);
							yAxis.ticks(d3.max(data, function(d) { return d.amount }));
							console.log(x.domain());

							svg.select('.trend-x.trend-axis').remove();
							svg.select('.trend-y.trend-axis').remove();
							svg.selectAll('path.trend-line').remove();
							svg.selectAll('circle.datapoint').remove();

							svg.append('g')
						      .attr('class', 'trend-x trend-axis')
						      .attr('transform', 'translate(0,' + height + ')')
						      .call(xAxis);

						    svg.append('g')
						      .attr('class', 'trend-y trend-axis')
						      .call(yAxis);

						    var path = svg.append('path')
						      .datum(data)
						      .attr('class', 'trend-line')
						      .attr('d', line);

						    svg.append('text')
							  .attr('class', 'xlabel')
							  .attr('text-anchor', 'middle')
							  .attr('x', width / 2)
							  .attr('y', height + margin.bottom)
							  .text('Years');
							//y-axis label
							svg.append('text')
							  .attr('class', 'ylabel')
							  .attr('y', 0 - margin.left) // x and y switched due to rotation!!
							  .attr('x', 0 - (height / 2))
							  .attr('dy', '1em')
							  .attr('transform', 'rotate(-90)')
							  .style('text-anchor', 'middle')
							  .text('Number of Publication');

							//add dots
							svg.selectAll('.dot')
							  .data(data)
							  .enter().append("circle")
							  .attr('class', 'datapoint')
							  .attr('cx', function(d) { return x(d.tDate); })
							  .attr('cy', function(d) { return y(d.amount); })
							  .attr('r', 9)
							  .attr('fill', 'white')
							  .attr('stroke', 'steelblue')
							  .attr('stroke-width', '3')
							  .style('cursor', 'pointer')
							  .on('click', function(d){
							  	firstClick = true;
							  	tip.show(d);
							  })
							  .on('dblclick', function(d){ 
							  	tip.hide(d);
							  	scope.goToCloudGraph(d);
							  });


						});
					}
				}

				
				scope.goToCloudGraph = function(d){
					scope.change({viz: $rootScope.topics[1].visualisations[1], docs: d.titles });
					scope.$apply();
				}


				function processData(docs,callback){
					console.log(docs);
					var tempData = [];
					docs.forEach(function(d,i){
						if(i === 0){
							tempData.push({
								date: d.publication_date.match('\\d+[/\\-](\\d+)')[1],
								amount: 1,
								titles: [d.title],
								indexes: [i],
								peerReviewd: d.peer_reviewed
							});
						} else {
							for(var y = 0; y < tempData.length; y++){
								if(tempData[y].date === d.publication_date.match('\\d+[/\\-](\\d+)')[1]){
									tempData[y].amount++;
									tempData[y].titles.push(d.title);
									tempData[y].indexes.push(i);
									return;
								} else if(y+1 === tempData.length){
									tempData.push({
										date: d.publication_date.match('\\d+[/\\-](\\d+)')[1],
										amount : 1,
										titles: [d.title],
										indexes: [i],
										peerReviewd: d.peer_reviewed
									});
									return;
								}
							} //for
						} //else
					});

					scope.data['trendData'] = tempData;

					callback(tempData);
				}

				scope.openFilterModal = function(size){
					var messageFromBubblejs = 'Hello';
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

				scope.removeFilter = function(filterToBeRemoved){
					scope.selectedFilters.forEach(function(filter,i,array){
						if(filterToBeRemoved.filterType === filter.filterType){
							array.splice(i,1);
						}
					});
					console.log(scope.selectedFilters);
					updateViz();
				}

				function constructTooltipHTML(d){
					var heading = d.date;
					var amount = d.amount;
					console.log(d);

					var titles = '<ul class="tooltip-title-list">';
					d.titles.forEach(function(data){
						titles += '<li> ' + data + '</li>'
					});
					titles+= '</ul>'

					var html = 
						'<div class="panel panel-primary tooltip-trend">' + 
							'<div class="panel-heading">Publications of Year: ' +
								heading +
							'</div>' +
							'<div class="panel-body">' + 
								'<strong class="tooltip-body-title">Publication Titles: </strong><br>' + 
								titles +
								'<strong class="tooltip-body-title">Number of Publications: </strong>' +
								amount +
							'</div>'
						' </div>';


					return html;
				}

				function filterByPeer(bPeer){
					var temp = [];
					scope.data.docs.forEach(function(doc){
						if(doc.peer_reviewed === bPeer) temp.push(doc);
					})

					return temp;
				}

				function filterByPublicationTitle(sPTitle){
					var temp = [];
					scope.data.docs.forEach(function(doc){
						if(doc.publication_title === sPTitle) temp.push(doc);
					})
					return temp;
				}

				function getPublicationTitles(docs){
					var temp = [];
					var sortValue = 0;
					docs.forEach(function(doc){
						if(temp.length === 0){
							temp.push({
								label: doc.publication_title,
								filterLabel: 'Publication Title',
								filterType: 'p_title',
								value: doc.publication_title,
								sortValue: sortValue++
							});
						} else {
							for(var i = 0; i < temp.length; i++){
								if(temp[i].value === doc.publication_title) return;
							}
							temp.push({
								label: doc.publication_title,
								filterLabel: 'Publication Title',
								filterType: 'p_title',
								value: doc.publication_title,
								sortValue: sortValue++
							});
						}
					});

					return temp;
				}

				function getDates (){
					var dates = [];
					scope.data.coauthors.forEach(function(author){
						author.dates.forEach(function(date){
							if(dates.length === 0){
								dates.push(date);
							} else {
								for(var i =0; i < dates.length; i++){
									if(dates[i].value === date) return;
								}
								dates.push(date);
							}
						});
					});
					return dates;
				}

				$window.onclick = function(){
					var jTip = $('.d3-tip');
					if(!firstClick){
						console.log(jTip);
						tip.hide();
					} else {
						firstClick = false;
					}
				}

			}
		};
	}]);