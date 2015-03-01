'use strict';

angular.module('myappApp')
	.directive('customNetwork', ['$modal',function ($modal) {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/network.html',
			scope: {
				data: '=data'
			},
			link: function (scope, iElement, iAttrs) {
				scope.universities = [];
				var el = $('.network-visualisation-container')[0];
				var width = $('.visualisation-panel').width(),
					height = 600;

				var palette = {
			      'lightgray': '#819090',
			      'gray': '#708284',
			      'mediumgray': '#536870',
			      'darkgray': '#475B62',

			      'darkblue': '#0A2933',
			      'darkerblue': '#042029',

			      'paleryellow': '#FCF4DC',
			      'paleyellow': '#EAE3CB',
			      'yellow': '#A57706',
			      'orange': '#BD3613',
			      'red': '#D11C24',
			      'pink': '#C61C6F',
			      'purple': '#595AB7',
			      'blue': '#2176C7',
			      'green': '#259286',
			      'yellowgreen': '#738A05'
			  	};

			  	scope.filters = [{
						name: 'Date Co-Authored',
						type: 'select',
						values: getDates()
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

				var color = d3.scale.category10(),
					tempColor,
					tempCircle, tempTextSize;

				var nodes = [{name: scope.data.authorName}],
					links = [],
					force, tBody;

				var circleRadiusBig = 20,
					circleRadiusSmall = 5,
					circleLarge = 5,
					tempRadius;

				var svg = d3.select(el).append('svg:svg')
				    .attr('width', function(){
				    	return scope.data.coauthors.length > 20 ? width + 50 : width;
				    })
				    .attr('height', function(){
				    	return scope.data.coauthors.length > 20 ? height + 50 : height;
				    })
				    .append('svg:g');



				processData(scope.data.coauthors, function(){
					var legend = d3.select('#legend-network').append('table')
								.attr('class','legend');
					// create one row per segment.
					var tBodyTitle = legend.append('tbody');
					tBody = legend.append('tbody');


					var tButton = $('<button/>', {
						text: 'Legend',
						id: 'legendTitleButton',
						click: function(){
							$('#legend-network').children('table').children('tbody:nth-child(2)').toggle('ease');
						},
						class: 'btn btn-lrg'
					});
					var tTitle = $('#legend-network').children('table').children('tbody:first-child').append(tButton);
					//rows
			        var tr = tBody.selectAll('tr').data(scope.universities).enter().append('tr');
			            
			        // create the first column for each segment.
			        tr.append('td').attr('class','legend-color-td')
			        	.append('svg').attr('width', '16').attr('height', '16').append('rect')
			            .attr('width', '16').attr('height', '16')
						.attr('fill',function(d,i){ return color(i); });

					// create the second column for each segment.
				    tr.append('td').text(function(d){ return d;});

					force = d3.layout.force()
						.nodes(nodes)
						.links([])
						.charge(function(){
							return links.length > 15 ? -300 : -400
						})
						.gravity(0.1)
						.size([width, height]);

					var link = svg.selectAll('line')
						.data(links).enter().append('line')
						.attr('stroke','#999')
						.style('stroke-width', function(d){
							return Math.sqrt(d.source.times);
						});

					var node = svg.selectAll('g.node') 
						.data(nodes);

					var nodeEnter = node.enter()
						.append('g')
						.attr('class', 'node');
						//.call(force.drag);

					nodeEnter.append('svg:circle')
						.attr('cx', function(d){return d.x;})
						.attr('cy', function(d){return d.y;})
						.attr('r', function(d) { 
							if(d.times != undefined) return circleRadiusBig + d.times * 1.5;
							else return circleRadiusBig; 
						})
						.attr('fill', function(d,i){
							console.log(d);
							return color($.inArray(d.university, scope.universities));
						});

					nodeEnter.append('svg:text')
						.text(function(d) {
								return d.name.substring(0, 20 / 2);
							})
						.attr('class', function(d,i){
							if(i === 0){
								return 'node-parent-text';
							} else {
								return 'node-children-text';
							}
						})
						.attr('text-anchor', 'middle')
						.attr('dy', '-1.7em');

					//Actions
					nodeEnter
						.on('mouseover', function(d){
							//Circle
							tempRadius = parseInt($(this).children('circle').attr('r'));
							d3.select(this).select('circle')
								.attr('r', tempRadius + circleLarge);	
							//Text
							d3.select(this).select('text')
								.classed('node-active', true);
						})
						.on('mouseout', function(d){
							//Circle
							d3.select(this).select('circle')
								.attr('r', tempRadius);

							//Text
							d3.select(this).select('text')
								.classed('node-active', false);

						})
						.call(d3.behavior.drag()
							.origin(function(d){return {x: d.x, y: d.y}})
							.on('drag', function(d){
								d.x = d3.event.x, 
								d.y = d3.event.y;

								d3.select(this)
					 	  			.attr('transform', 'translate(' + d.x + ',' + d.y + ')');

					 	  		link.filter(function(l) { return l.source === d }).attr('x1', d.x).attr('y1', d.y);
					 	  		link.filter(function(l) { return l.target === d }).attr('x2', d.x).attr('y2', d.y);

							}));


					force.on('tick', function(e){
						node.attr('transform', function(d,i){
							return 'translate('+ d.x + ', ' + d.y + ')';
						});

						link.attr('x1', function(d){ return d.source.x })
							.attr('y1', function(d){ return d.source.y })
							.attr('x2', function(d){ return d.target.x })
							.attr('y2', function(d){ return d.target.y })
					});

					force.start();

				});

				

				function updateViz(){
					var filteredData;
					if(scope.selectedFilters.length === 0){
						filteredData = scope.data.coauthors;
					} else {
						scope.selectedFilters.forEach(function(filter){
							if(filter.filterType === 'date'){
								filteredData = filterByDate(filter.value);
							}
						});
					}

					processData(filteredData, function(){
						console.log(nodes);
						force = d3.layout.force()
							.nodes(nodes)
							.links([])
							.charge(function(){
								return links.length > 15 ? -300 : -400
							})
							.gravity(0.1)
							.size([width, height]);
						var link = svg.selectAll('line')
							.data(links);

						link.enter().append('line')
							.attr('stroke','#999')
							.style('stroke-width', function(d){
								return Math.sqrt(d.source.times);
							});

						link.exit().remove();

						svg.selectAll('g.node').remove();
						var node = svg.selectAll('g.node')
							.data(nodes);

						var nodeEnter = node.enter()
							.append('g')
							.attr('class', 'node');
							//.call(force.drag);

						nodeEnter.append('svg:circle')
							.attr('cx', function(d){return d.x;})
							.attr('cy', function(d){return d.y;})
							.attr('r', function(d) { 
								if(d.times != undefined) return circleRadiusBig + d.times * 1.5;
								else return circleRadiusBig; 
							})
							.attr('fill', function(d,i){
								return color($.inArray(d.university, scope.universities));
							});

						nodeEnter.append('svg:text')
							.text(function(d) {
									return d.name.substring(0, 20 / 2);
								})
							.attr('class', function(d,i){
								if(i === 0){
									return 'node-parent-text';
								} else {
									return 'node-children-text';
								}
							})
							.attr('text-anchor', 'middle')
							.attr('dy', '-1.7em');

						//Actions
						nodeEnter
							.on('mouseover', function(d){
								//Circle
								tempRadius = parseInt($(this).children('circle').attr('r'));
								d3.select(this).select('circle')
									.attr('r', tempRadius + circleLarge);	
								//Text
								d3.select(this).select('text')
									.classed('node-active', true);
							})
							.on('mouseout', function(d){
								//Circle
								d3.select(this).select('circle')
									.attr('r', tempRadius);

								//Text
								d3.select(this).select('text')
									.classed('node-active', false);

							})
							.call(d3.behavior.drag()
								.origin(function(d){return {x: d.x, y: d.y}})
								.on('drag', function(d){
									d.x = d3.event.x, 
									d.y = d3.event.y;

									d3.select(this)
						 	  			.attr('transform', 'translate(' + d.x + ',' + d.y + ')');

						 	  		link.filter(function(l) { return l.source === d }).attr('x1', d.x).attr('y1', d.y);
						 	  		link.filter(function(l) { return l.target === d }).attr('x2', d.x).attr('y2', d.y);

								}));

						node.exit().remove();


						tBody.selectAll('tr').remove();
					   	var tr = tBody.selectAll('tr').data(scope.universities);
					   	var trEnter = tr.enter().append('tr');
					   	// create the first column for each segment.
				        trEnter.append('td').append('svg').attr('width', '16').attr('height', '16').append('rect')
				            .attr('width', '16').attr('height', '16')
							.attr('fill',function(d,i){ return color(i); });

						// create the second column for each segment.
					    trEnter.append('td').text(function(d){ 
					    	return d;
					    });

					    force.on('tick', function(e){
							node.attr('transform', function(d,i){
								return 'translate('+ d.x + ', ' + d.y + ')';
							});

							link.attr('x1', function(d){ return d.source.x })
								.attr('y1', function(d){ return d.source.y })
								.attr('x2', function(d){ return d.target.x })
								.attr('y2', function(d){ return d.target.y })
						});

						force.start();


					});
				}

				scope.removeFilter = function(filterToBeRemoved){
					scope.selectedFilters.forEach(function(filter,i,array){
						if(filterToBeRemoved.filterType === filter.filterType){
							array.splice(i,1);
						}
					});

					updateViz();
				}


				function processData(authors, callback){

					nodes = [{name: scope.data.authorName}],
					links = [],
					scope.universities = [];
					console.log(authors);

					//{source: authorName, target: first variable in nodes}
					authors.forEach(function(author){
						nodes.push({name: author.name, 
							target: [0], 
							times: author.count,
							dates: author.dates,
							university: author.university,
						});

						if($.inArray(author.university, scope.universities) < 0){
							scope.universities.push(author.university);
						}
					});

					for (var i = 0; i< nodes.length; i++) {
					      if (nodes[i].target !== undefined) {
					            for (var x = 0; x< nodes[i].target.length; x++ ) {
					                  links.push({
					                        source: nodes[i],
					                        target: nodes[nodes[i].target[x]]
					                  });
					            }
					      }
					}

					console.log(scope.universities);
					callback();
				};

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

				    	console.log(scope.selectedFilters);
				    	updateViz();
				    }, function () {
				      console.log('Modal dismissed at: ' + new Date());
				    });
				}

				function filterByDate(fDate){
					var temp = [];
					scope.data.coauthors.forEach(function(author){
						author.dates.forEach(function(date){
							if(fDate === date){
								temp.push(author);
								return;
							}
						});
					});

					return temp;
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
					console.log(dates);

					return dates;
				}

			}
		};
	}])


	
