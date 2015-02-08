'use strict';

angular.module('myappApp')
	.directive('customBubble', ['$modal','$compile','$rootScope','$location', 
		function ($modal, $compile, $rootScope,$location) {
			return {
				restrict: 'EA',
				templateUrl: 'views/visualisation/bubble.html',
				scope: {
					authorData: '=data',
					viz: '='
				},
				link: function (scope, iElement, iAttrs) {
					scope.processedData;
					scope.universities = [];
					scope.filters = [{
							name: 'Number of times co-authored',
							label: 'No. Times',
							value: 0
						}, {
							name: 'Similar Discipline',
							label: 'Similar Discipline',
							value: []
						}];

					scope.selectedFilters = [];
					var el = $('.bubble-visualisation-container')[0];
					var diameter = $('.visualisation-panel').width()-200,
						margin = {
							top: 0,
							right: 250,
							bottom: 50,
							left: 70
						},
					    format = d3.format(',d'),
					    color = d3.scale.category10(),
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


					processData(scope.authorData, function(processedData){
						console.log(scope.universities);
						scope.processedData = processedData;
						var tip = d3.tip()
							.attr('class', 'd3-tip')
							.offset([-10,0])
							.html(function(d) {
							    return constructTooltipHTML(d);
							})
							.direction(function(d){
								if(d.x <= diameter*.5 && d.y <= diameter*.5) return 'e'; //top-left corner, tooltip appears on the right
								else if(d.x <= diameter*.5 && d.y >= diameter*.5) return 'e'; //bottom-left corner, tooltip apears on the right
								else if(d.x >= diameter*.5 && d.y <= diameter*.5) return 'w'; //top-right corner, tooltip appears on the left
								else if(d.x >= diameter*.5 && d.y >= diameter*.5) return 'w'; //bottom-right corner, tooltip appears on the left
							});

						var svg = d3.select(el).append('svg')
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

	      				node.append('text')
	      					.attr('dy', '.3em')
						    .style('text-anchor','middle')
						    .text(function(d) { return d.child.substring(0, d.r / 4); });

						node.transition()
							.selectAll('circle')
								.attr('r', function(d) {return d.r})
							.delay(function(d,i){
								return i * 200;
							})
							.duration(1000)
							.ease('elastic');

						node.on('click', function(d){
							var path = '/author/'+d.fname+'/'+d.lname+'/'+d.key+'/'+scope.viz.value;
	      					$location.path(path);
	      					tip.hide();
	      					scope.$apply();
						});

						node.on('mouseover',function(d){
							tempColor = this.style.fill;
							console.log('Got here');
							tip.show(d);
						})
						.on('mouseout',function(d){
							d3.select(this)
					            .style('opacity', 1)
					            .style('fill', tempColor);
					        tip.hide();
						});

						//node.call(drag);

						//Legend
					 	var legend = d3.select('#legend').append('table')
									.attr('class','legend');
						// create one row per segment.
				        var tr = legend.append("tbody").selectAll("tr").data(scope.universities).enter().append("tr");
				            
				        // create the first column for each segment.
				        tr.append("td").append("svg").attr("width", '16').attr("height", '16').append("rect")
				            .attr("width", '16').attr("height", '16')
							.attr("fill",function(d,i){ return color(i); });

						// create the second column for each segment.
					    tr.append("td").text(function(d){ return d;});



					});

					/*
						HTML for the tooltip
					*/

					function constructTooltipHTML(d){
						var name = d.fname + ' ' + d.lname;
						var count = d.value;
						var university = d.university;

						return '<strong>Name:</strong> ' + name
								+ '<br><strong>Number of times coauthored:</strong> ' + count
								+ '<br><strong>University:</strong> ' + university;
					}

					/*
						Drag functionality
					*/

					// function dragstarted(d) {
					//   this.parentNode.appendChild(this);
					//   tempRadius = d.r;
					//   console.log('tempRadius before drag: ' + tempRadius);
					//   d3.select(this).selectAll('circle').transition()
					//       .ease("elastic")
					//       .duration(600)
					//       .attr("r", d.r + 25);
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
					//       .attr("r", tempRadius);
					// }

					// function nozoom() {
					//   d3.event.preventDefault();
					// }

					/*
						Modal for creating filters
					*/
					scope.openFilterModal = function(size){
						var modalInstance = $modal.open({
					      templateUrl: 'bubble_filter.html',
					      controller: 'BubbleModalCtrl',
					      size: size,
					      resolve: {
					        message: function () {
					          return scope.messageFromBubblejs;
					        }
					      }
					    });

					    modalInstance.result.then(function (reply) {
					      scope.reply = reply;
					    }, function () {
					      console.log('Modal dismissed at: ' + new Date());
					    });
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
					    				key: node.key});
					  }

					  recurse(null, root);
					  return {children: classes};
					}

					/*
						Prepare data for bubble chart
					*/
					function processData(data, callback){
						var temp = {};
						console.log(data);
						temp['name'] = data.authorName;
						temp['children'] = data.coauthors.map(function(d){
							return {
								name: d.name,
								children: null,
								size: d.count,
								university: d.university,
								fname: d.fname,
								lname: d.lname,
								key: d.key
							}
						});

						data.coauthors.forEach(function(d){
							if($.inArray(d.university,scope.universities) < 0)
								scope.universities.push(d.university);
						})


						callback(temp);
					}
				}
			};
	}]);