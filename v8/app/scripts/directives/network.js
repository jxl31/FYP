'use strict';

angular.module('myappApp')
	.directive('customNetwork', ['$modal','$location','$window',function ($modal, $location, $window) {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/network.html',
			scope: {
				data: '=data',
				reloadRoute: '&reload',
				viz: '='
			},
			link: function (scope, iElement, iAttrs) {
				scope.universities = [];
				var el = $('.network-visualisation-container')[0];
				var width = $('.visualisation-panel').width(),
					height = 600;
				scope.dates = getDates();
				scope.currentDate = new Date();
				scope.to = d3.max(scope.dates, function(d){
					return parseInt(d.value);
				});

				scope.from = d3.min(scope.dates, function(d){
					return parseInt(d.value);
				});

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
							}]
						}
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

				var color = d3.scale.category10(),
					tempColor,
					tempCircle, tempTextSize;

				var nodes = [{name: scope.data.authorName}],
					links = [],
					force, tBody;
				var firstClick = true;

				var circleRadius = {
					small: {
						size: 5,
						scalar: 1.5
					},
					medium: {
						size: 10,
						scalar: 2
					},
					big: {
						size: 20,
						scalar: 2.5
					}
				}
				var selectedRadius = null;
				var circleLarge = 5,
					tempRadius;

				var tip = d3.tip()
					.attr('class', 'd3-tip')
					.html(function(d) {
					    return constructTooltipHTML(d);
					})
					.direction(function(d){
						if(d.y <= height*.5) return 's'; //top-left corner, tooltip appears on the right
						else return 'n';
					})
					.offset([0, -15]);

				var svg = d3.select(el).append('svg:svg')
				    .attr('width', function(){
				    	return scope.data.coauthors.length > 20 ? width + 50 : width;
				    })
				    .attr('height', function(){
				    	return scope.data.coauthors.length > 20 ? height + 50 : height;
				    })
				    .append('svg:g')
				    .call(tip);



				processData(scope.data.coauthors, function(){
					setRadiusForCurrentData();

					var legend = d3.select('#legend-network').append('table')
								.attr('class','legend');
					// create one row per segment.
					var tBodyTitle = legend.append('tbody');
					tBody = legend.append('tbody');


					var tButton = $('<button/>', {
							text: 'Legend',
							id: 'legendTitleButton',
							click: function(){
								if($('#legend-network').children('table').hasClass('closed')){
									$('#legend-network').children('table').removeClass('closed');
								} else {
									$('#legend-network').children('table').addClass('closed');
								}
								$('#legend-network').children('table').children('tbody:nth-child(2)').toggle('ease');
							},
							class: 'btn btn-lrg btn-success legend-button'
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
							if(d.times != undefined) return selectedRadius.size * selectedRadius.scalar + d.times;
							else return selectedRadius.size * selectedRadius.scalar; 
						})
						.attr('fill', function(d,i){
							if(!(d.index === 0)){
								return color($.inArray(d.university, scope.universities));
							} else {
								return '#000000';
							}
							
						})
						.style('z-index', 900)
						.style('cursor','pointer');

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
						.attr('dy', '-1.7em')
						.style('cursor','pointer');

					//Actions
					nodeEnter
						.on('mouseover', function(d){
							if(! (d.index === 0)){
								console.log('got here');
								tip.show(d);
							}
							//Circle
							tempRadius = parseInt($(this).children('circle').attr('r'));
							d3.select(this).select('circle')
								.attr('r', tempRadius + circleLarge);	
							//Text
							d3.select(this).select('text')
								.classed('node-active', true);
						})
						.on('mouseout', function(d){
							if(! (d.index === 0)){
								tip.hide(d);
							}
							//Circle
							d3.select(this).select('circle')
								.attr('r', tempRadius);

							//Text
							d3.select(this).select('text')
								.classed('node-active', false);

						})
						.on('dblclick', function(d){
							if(!d.index === 0){
								var path = '';
								if(!scope.data.corp){
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
							}
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

							})
							.on('dragend', function(d){
								console.log(d);
								tip.show(d);
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
								filteredData = filterByDate(filter.value, filteredData);
							} else if(filter.filterType === 'freq'){
								filteredData = filterByFreq(filter.value, filteredData);
							}
						});
					}

					if(filteredData.length === 0){
						d3.select('#legend-network').selectAll('tbody').remove();
						svg.selectAll('g').remove();
						svg.append('svg:text')
							.attr('x', 100)
							.attr('y', diameter/3)
							.text('No authors with the following constrainst. Please remove or select another.');
					} else {
						processData(filteredData, function(){
							svg.select('text').remove();
							setRadiusForCurrentData();
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
									if(d.times != undefined) return selectedRadius.size * selectedRadius.scalar + d.times;
									else return selectedRadius.size * selectedRadius.scalar; 
								})
								.attr('fill', function(d,i){
									if(!(d.index === 0)){
										return color($.inArray(d.university, scope.universities));
									} else {
										return '#000000';
									}
								})
								.style('cursor','pointer');

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
								.attr('dy', '-1.7em')
								.style('z-index', 900)
								.style('cursor','pointer');

							//Actions
							nodeEnter
								.on('mouseover', function(d){
									if(! (d.index === 0)){
										tip.show(d);
									}
									//Circle
									tempRadius = parseInt($(this).children('circle').attr('r'));
									d3.select(this).select('circle')
										.attr('r', tempRadius + circleLarge);	
									//Text
									d3.select(this).select('text')
										.classed('node-active', true);
								})
								.on('mouseout', function(d){
									if(! (d.index === 0)){
										tip.hide(d);
									}
									//Circle
									d3.select(this).select('circle')
										.attr('r', tempRadius);

									//Text
									d3.select(this).select('text')
										.classed('node-active', false);

								})
								.on('dblclick', function(d){
									if(!d.index === 0){
										var path = '';
										if(!scope.data.corp){
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
									}
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
				}

				$window.onclick = function(){
					var jTip = $('.d3-tip');
					if(!firstClick){
						tip.hide();
					} else {
						firstClick = false;
					}
				}

				function constructTooltipHTML(d){
					var name = d.name;
					var count = d.times;
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
							'</p><p><strong class="tooltip-body-title">Years Co-Authored:</strong>' + fYears + '</p>' +
						'</div>' 
					' </div>';

					return html;
					// return '<strong>Name:</strong> ' + name
					// 		+ '<br><strong>Number of times coauthored:</strong> ' + count
					// 		+ '<br><strong>University:</strong> ' + university;
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

					//{source: authorName, target: first variable in nodes}
					authors.forEach(function(author){
						nodes.push({name: author.name, 
							target: [0], 
							times: author.count,
							dates: author.dates,
							university: author.university,
							fname: author.fname,
							lname: author.lname,
							key: author.key
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

				function filterByDate(fDate, filteredData){
					var temp = [];
					var temp = [];
					var iFDate = parseInt(fDate);
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
								if(iFDate <= date){
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

				function setRadiusForCurrentData(){
					if(nodes.length <= 19){
						selectedRadius = circleRadius.big;
					} else if(nodes.length >= 20 && nodes.length <= 39){
						selectedRadius = circleRadius.medium;
					} else {
						selectedRadius = circleRadius.small;
					}
				}

			}
		};
	}])


	
