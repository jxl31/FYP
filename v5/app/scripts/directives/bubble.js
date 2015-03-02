'use strict';

angular.module('myappApp')
	.directive('customBubble', ['$modal','$compile','$rootScope','$location', '$route', '$window', '$timeout',
		function ($modal, $compile, $rootScope,$location,$route,$window,$timeout) {
			return {
				restrict: 'EA',
				templateUrl: 'views/visualisation/bubble.html',
				scope: {
					paramSize: '=paramSize',
					reloadRoute: '&reload',
					authorData: '=data',
					viz: '='
				},
				link: function (scope, iElement, iAttrs) {

					scope.processedData;
					scope.universities = [];
					scope.dates = getDates();
					scope.selectedYear = null;
					scope.to = d3.max(scope.dates, function(d){
						return parseInt(d.value);
					});
					scope.from = d3.min(scope.dates, function(d){
						return parseInt(d.value);
					});
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
						},
						{
							label: '15 > ',
							value: '16-500',
							filterLabel: 'No. Times: ',
							filterType: 'freq'
						}]
					}];
					scope.selectedFilters = [];
					var svg, legend, tBody, tBodyTitle, tip;
					var firstClick = true;

					//Legend
					legend = d3.select('#legend-bubble').append('table')
									.attr('class','legend');
					tBodyTitle = legend.append('tbody');
					tBody = legend.append('tbody');

					var tButton = $('<button/>', {
							text: 'Legend',
							id: 'legendTitleButton',
							click: function(){
								if($('#legend-bubble').children('table').hasClass('closed')){
									$('#legend-bubble').children('table').removeClass('closed');
								} else {
									$('#legend-bubble').children('table').addClass('closed');
								}
								$('#legend-bubble').children('table').children('tbody:nth-child(2)').toggle('ease');
							},
							class: 'btn btn-lrg btn-success legend-button'
						});

					var el = $('.bubble-visualisation-container')[0];
					var diameter = $('.visualisation-panel').width()-200,
						margin = {
							top: 0,
							right: 250,
							bottom: 50,
							left: 70
						},
					    format = d3.format(',d'),
					    color = d3.scale.category20(),
					    tempColor,
					    tempRadius;

					var bubble = d3.layout.pack()
					    .sort(function(a, b) {
					        return -(a.value - b.value);
					    })
					    .size([diameter, diameter])
					    .padding(1.5);

					// var drag = d3.behavior.drag()
					//     .origin(function(d) { return {x: d.x, y: d.y}; })
					//     .on('dragstart', dragstarted)
					//     .on('drag', dragged)
					//     .on('dragend', dragended);


					processData(scope.authorData.coauthors, function(processedData){
						scope.processedData = processedData;
						tip = d3.tip()
							.attr('class', 'd3-tip')
							.html(function(d) {
							    return constructTooltipHTML(d);
							})
							.direction(function(d){
								if(d.x <= diameter*.5 && d.y <= diameter*.5) return 'e'; //top-left corner, tooltip appears on the right
								else if(d.x <= diameter*.5 && d.y >= diameter*.5) return 'e'; //bottom-left corner, tooltip apears on the right
								else if(d.x >= diameter*.5 && d.y <= diameter*.5) return 'w'; //top-right corner, tooltip appears on the left
								else if(d.x >= diameter*.5 && d.y >= diameter*.5) return 'w'; //bottom-right corner, tooltip appears on the left
							})
							.offset(function(d){
								if(d.x <= diameter*.5 && d.y <= diameter*.5) return [0,10]; //top-left corner, tooltip appears on the right
								else if(d.x <= diameter*.5 && d.y >= diameter*.5) return [0,10]; //bottom-left corner, tooltip apears on the right
								else if(d.x >= diameter*.5 && d.y <= diameter*.5) return [0,-10]; //top-right corner, tooltip appears on the left
								else if(d.x >= diameter*.5 && d.y >= diameter*.5) return [0,-10]; //bottom-right corner, tooltip appears on the left
							});

						svg = d3.select(el).append('svg')
						    .attr('width', diameter + margin.left + margin.right)
						    .attr('height', diameter + margin.top + margin.bottom)
						    .attr('transform', 'translate(' + margin.left + ',' + margin.right + ')')
						    .attr('class', 'bubble')
						    .call(tip);

						var node = svg.selectAll('.node')
						      .data(bubble.nodes(classes(scope.processedData))
						      .filter(function(d) { return !d.children; }))
						    .enter().append('g')
						      .attr('class', 'node')
						      .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

						// node.append('title')
						// 	.text(function(d) { return d.child + ': ' + format(d.value);});

						node.append('circle')
							.attr('r', 0)
	      					.style('fill', function(d,i) {
	      						return color($.inArray(d.university, scope.universities)); 
	      					})
	      					.style('cursor', 'pointer');

	      				node.append('text')
	      					.attr('dy', '.3em')
						    .style('text-anchor','middle')
						    .style('cursor','pointer')
						    .text(function(d) { 
						    	return d.child.substring(0, d.r / 4); 
						    });

						node.transition()
							.selectAll('circle')
								.attr('r', function(d) {return d.r})
							.delay(function(d,i){
								return i * 200;
							})
							.duration(1000)
							.ease('elastic');

						node.on('dblclick', function(d){
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
	      					tip.hide(d);
	      					scope.reloadRoute();
	      					scope.$apply();
						});

						node.on('click',function(d){
							tempColor = this.style.fill;
							tip.show(d);
							firstClick = true;
						})



						// .on('mouseout',function(d){
						// 	d3.select(this)
					 //            .style('opacity', 1)
					 //            .style('fill', tempColor);
					 //        tip.hide();
						// });

						//node.call(drag);

						//Legend
						var tTitle = $('#legend-bubble').children('table').children('tbody:first-child').append(tButton);

						// create one row per segment.
				        var tr = tBody.selectAll('tr').data(scope.universities).enter().append('tr');
				            
				        // create the first column for each segment.
				        tr.append('td').append('svg').attr('width', '16').attr('height', '16').append('rect')
				            .attr('width', '16').attr('height', '16')
							.attr('fill',function(d,i){ return color(i); });

						// create the second column for each segment.
					    tr.append('td').text(function(d){ return d;});
					});

					function updateViz(){	
						var filteredData;
						if(scope.selectedFilters.length === 0){
							filteredData = scope.authorData.coauthors;
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
								svg.select('text').remove();
								svg.call(tip);
								svg.selectAll('g.node').remove();
								var node = svg.selectAll('.node')
							        .data(
							            bubble.nodes(classes(data)).filter(function (d){return !d.children;}),
							            function(d) {return d.child} // key data based on className to keep object constancy
							        );
								var nodeEnter = node.enter()
							        .append('g')
							        .attr('class', 'node')
							        .attr('transform', function (d) {
							            return 'translate(' + d.x + ',' + d.y + ')';
						        	});

						        nodeEnter.append('circle')
							        .attr('r', function (d) {return d.r;})
							        .style('fill', function (d, i) {
							        	return color($.inArray(d.university, scope.universities));
							        });

							    nodeEnter.append('text')
			      					.attr('dy', '.3em')
								    .style('text-anchor','middle')
								    .text(function(d) { 
								    	return d.child.substring(0, d.r / 4); 
								    })
								    .style('cursor','pointer');

						        node.select('circle')
							        .transition().duration(1000)
							        .attr('r', function (d) {
							            return d.r;
							        })
							        .style('fill', function (d, i) {
							            return color($.inArray(d.university, scope.universities));
							        })
							        .style('cursor','pointer');

							    node.on('dblclick', function(d){
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

								node.on('click',function(d){
									tempColor = this.style.fill;
									tip.show(d);
								})
								.on('mouseout',function(d){
									d3.select(this)
							            .style('opacity', 1)
							            .style('fill', tempColor);
							        tip.hide(d);
								});

							    node.transition().attr('class', 'node')
							        .attr('transform', function (d) {
							        	return 'translate(' + d.x + ',' + d.y + ')';
							    	});

							    if($('#legend-bubble > table').is(':empty')){
							    	tBodyTitle = legend.append('tbody');
									tBody = legend.append('tbody');
									var tTitle = $('#legend-bubble').children('table').children('tbody:first-child').append(tButton);
							    }
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

							    node.exit().remove();
							});
						}
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

					/*
						HTML for the tooltip
					*/

					function constructTooltipHTML(d){
						var name = d.fname + ' ' + d.lname;
						var count = d.value;
						var university = d.university;
						var title = name;

						var html = 
						'<div class="panel panel-primary">' + 
							'<div class="panel-heading">' +
								name +
							'</div>' +
							'<div class="panel-body">' + 
								'<strong>University: </strong>' + university + 
								'<br><strong>Number of ties coauthored: </strong>' + count +
							'</div>' 
						' </div>';

						return html;
						// return '<strong>Name:</strong> ' + name
						// 		+ '<br><strong>Number of times coauthored:</strong> ' + count
						// 		+ '<br><strong>University:</strong> ' + university;
					}

					/*
						Drag functionality
					*/

					// function dragstarted(d) {
					//   this.parentNode.appendChild(this);
					//   tempRadius = d.r;
					//   console.log('tempRadius before drag: ' + tempRadius);
					//   d3.select(this).selectAll('circle').transition()
					//       .ease('elastic')
					//       .duration(600)
					//       .attr('r', d.r + 25);
	    //   			}
					
					// function dragged(d) {
					// 	d.x = d3.event.x;
					// 	d.y = d3.event.y;

					// 	d3.select(this)
					// 	  .attr('transform', 'translate(' + d.x + ',' + d.y + ')');
					// }

					// function dragended() {
					// 	console.log('After drag ended:' + tempRadius);
					//   d3.select(this).selectAll('circle').transition()
					//       .ease('elastic')
					//       .duration(600)
					//       .attr('r', tempRadius);
					// }

					// function nozoom() {
					//   d3.event.preventDefault();
					// }

					/*
						Modal for creating filters
					*/
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

					/*
						Removing Filters
					*/
					scope.removeFilter = function(filterToBeRemoved){
						scope.selectedFilters.forEach(function(filter,i,array){
							if(filterToBeRemoved.filterType === filter.filterType){
								array.splice(i,1);
							}
						});
						console.log(scope.selectedFilters);
						updateViz();
					}


					/*
						Process each node so that it will target parent
					*/
					function classes(root) {
					  var classes = [];

					  function recurse(name, node) {
					    if (node.children) node.children.forEach(function(child) { recurse(node.name, child); });
					    else classes.push({parent: name, 
					    				child: node.name, 
					    				value: node.size, 
					    				university: node.university, 
					    				fname: node.fname,
					    				lname: node.lname,
					    				key: node.key,
					    				link: node.link});
					  }

					  recurse(null, root);
					  return {children: classes};
					}


					//Selects
					function getDates (){
						var dates = [];
						scope.authorData.coauthors.forEach(function(author){
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


					/*
						Prepare data for bubble chart
					*/
					function processData(data, callback){
						scope.universities = [];
						var temp = {};
						temp['name'] = scope.authorData.authorName;
						temp['children'] = data.map(function(d){
							return {
								name: d.name,
								children: null,
								size: d.count,
								university: d.university,
								fname: d.fname,
								lname: d.lname,
								key: d.key,
								fullname: d.fullname,
								link: d.link
							}
						});

						data.forEach(function(d){
							if($.inArray(d.university,scope.universities) < 0)
								scope.universities.push(d.university);
						})


						callback(temp);
					}
				}
			};
	}]);