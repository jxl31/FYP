/*
	Author: John Xaviery Lucente
	Directive Name: NetworkDirective
	Use: To create nodes and links according to co-authors data
	Scope: 
		data: contains the selected authors full details
		relouadRoute: is a function located in the controller "MainVizCtrl" that will reload the page
		viz: contains the parameter for the current visualisation. will be used for redirection

	Algorithm Reference:
		- dragging: http://bl.ocks.org/mbostock/4557698
*/

'use strict';

angular.module('NetworkDirective',[])
	.directive('customNetwork', ['$modal','$location',function ($modal, $location) {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/network.html',
			scope: {
				data: '=data',
				reloadRoute: '&reload',
				viz: '='
			},
			link: function (scope) {
				scope.universities = [];
				//get the element where the visualisation will be placed
				var el = $('.network-visualisation-container')[0];
				//set up the width and the height
				var width = $('.visualisation-panel').width(),
					height = 600;
				//get the dates for the title
				scope.dates = getDates();
				scope.currentDate = new Date();
				scope.to = d3.max(scope.dates, function(d){
					return parseInt(d.value);
				});

				scope.from = d3.min(scope.dates, function(d){
					return parseInt(d.value);
				});

				//populate the filtesr to be passed into the modal
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
						},{
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

				//selected filter as null
				scope.selectedFilters = [];

				//color will be used by the graph
				var color = d3.scale.category20();

				//set up nodes and links
				var nodes = [{name: scope.data.authorName}],
					links = [],
					force, tBody;
				//cirlce radius' size will increase or decrease
				//depending on the number of nodes
				var circleRadius = {
					small: {
						size: 5,
						scalar: 1.5
					},
					medium: {
						size: 7,
						scalar: 2
					},
					big: {
						size: 10,
						scalar: 2.5
					}
				};
				var selectedRadius = null;
				var selectedForce = null;
				var circleLarge = 5,
					tempRadius;

				//intialising the tooltip
				var tip = d3.tip()
					.attr('class', 'd3-tip')
					.html(function(d) {
					    return constructTooltipHTML(d);
					})
					.direction(function(d){
						if(d.y <= height*0.5) {return 's';} //top-left corner, tooltip appears on the right
						else {return 'n';}
					})
					.offset([0, -15]);

				//intialising the visualisation container
				var svg = d3.select(el).append('svg:svg')
				    .attr('width', function(){
				    	return scope.data.coauthors.length > 20 ? width + 50 : width;
				    })
				    .attr('height', function(){
				    	return scope.data.coauthors.length > 20 ? height + 50 : height;
				    })
				    .append('svg:g')
				    .call(tip);

				//setting up the legend
				var legend = d3.select('#legend-network').append('table')
							.attr('class','legend');

				legend.append('tbody');
				tBody = legend.append('tbody');

				//button used to toggle the legend
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

				function updateViz(){
					//clean visualisation container
					force = null;
					tBody.selectAll('tr').remove(); //row in the table
					svg.select('text').remove(); //text
					svg.selectAll('g.node').remove(); //cirlces
					svg.selectAll('line').remove(); //lines

					//set up the data to visualise
					var filteredData = null;
					if(scope.selectedFilters.length === 0){ //if no filters then go with all the data
						filteredData = scope.data.coauthors;
					} else {
						scope.selectedFilters.forEach(function(filter){
							if(filter.filterType === 'date'){ //if there's a filter for date filter by date
								filteredData = filterByDate(filter.value, filteredData);
							} else if(filter.filterType === 'freq'){ //if there's a filter for frequency filter by frequency
								filteredData = filterByFreq(filter.value, filteredData);
							}
						});
					}
					//check if filtered data is null if so show message
					if(filteredData.length === 0){
						d3.select('#legend-network').selectAll('tbody').remove();
						svg.selectAll('g').remove();
						svg.append('svg:text')
							.attr('x', 0)
							.attr('y', 50)
							.style({
								'fill' : 'red',
								'font-size': '1.5em',
								'text-decoration': 'underline'
							})
							.text('No co-authors. Please remove filter or select another. Otherwise view Publications');
					} else {
						processData(filteredData, function(fNodes, fLinks){
							console.log(fNodes);
							setRadiusAndForceForCurrentData();
							$('#legend-network').children('table').children('tbody:first-child').append(tButton);
							//rows
					        var tr = tBody.selectAll('tr').data(scope.universities).enter().append('tr');
					        // create the first column for each segment.
					        tr.append('td').attr('class','legend-color-td')
					        	.append('svg').attr('width', '16').attr('height', '16').append('rect')
					            .attr('width', '16').attr('height', '16')
								.attr('fill',function(d,i){ return color(i); });

							// create the second column for each segment.
						    tr.append('td').text(function(d){ return d;});

						    //initialise force layout
						    force = d3.layout.force()
								.nodes(fNodes)
								.links([])
								.charge(selectedForce)
								.gravity(0.1)
								.size([width, height]);

							//initialise the line that will be used as the link
							var link = svg.selectAll('line')
								.data(fLinks).enter().append('line')
								.attr('stroke','#999')
								.style('stroke-width', function(d){
									return Math.sqrt(d.source.times);
								});

							//initialise the node
							var node = svg.selectAll('g.node') 
								.data(fNodes);

							var nodeEnter = node.enter()
								.append('g')
								.attr('class', 'node');
								//.call(force.drag);

							//create the circle
							nodeEnter.append('svg:circle')
								.attr('cx', function(d){return d.x;})
								.attr('cy', function(d){return d.y;})
								.attr('r', function(d) { 
									if(d.times !== undefined) { 
										return selectedRadius.size * selectedRadius.scalar + d.times;
									}
									else {
										return selectedRadius.size * selectedRadius.scalar; 
									}
								})
								.attr('fill', function(d){
									if(d.index !== 0){
										return color($.inArray(d.university, scope.universities));
									} else {
										return '#000000';
									}
									
								})
								.style('z-index', 10)
								.style('cursor','pointer');

							//create the text
							nodeEnter.append('svg:text')
								.text(function(d, i) {
										if(i === 0){
											return d.name;
										}
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
								//hover in
								.on('mouseover', function(d){
									if(d.index !== 0){
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
								//hover out
								.on('mouseout', function(d){
									if(d.index !== 0){
										tip.hide(d);
									}
									//Circle
									d3.select(this).select('circle')
										.attr('r', tempRadius);

									//Text
									d3.select(this).select('text')
										.classed('node-active', false);

								})
								//double-click
								.on('dblclick', function(d){
									if(d.index !== 0){
										var path = '';
										if(scope.data.corp !== true){
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
								//dragging abilitity
								//used algorithm in: http://bl.ocks.org/mbostock/4557698
								.call(d3.behavior.drag()
									.origin(function(d){return {x: d.x, y: d.y}; })
									.on('drag', function(d){
										d.x = d3.event.x; 
										d.y = d3.event.y;

										d3.select(this)
							 	  			.attr('transform', 'translate(' + d.x + ',' + d.y + ')');

							 	  		link.filter(function(l) { return l.source === d; }).attr('x1', d.x).attr('y1', d.y);
							 	  		link.filter(function(l) { return l.target === d; }).attr('x2', d.x).attr('y2', d.y);

									})
									.on('dragend', function(d){
										console.log(d);
										tip.show(d);
									}));


							//connects the node and the link together
							force.on('tick', function(){
								node.attr('transform', function(d){
									return 'translate('+ d.x + ', ' + d.y + ')';
								});

								//source is the node itself
								//target is the node that its targeting which is the selected author
								link.attr('x1', function(d){ return d.source.x; })
									.attr('y1', function(d){ return d.source.y; })
									.attr('x2', function(d){ return d.target.x; })
									.attr('y2', function(d){ return d.target.y; });
							});

							//start the visualisation
							force.start();

						});
					}


				}

				/*
					Function that constructs the HTML template for the tooltip
					will display: name, university, count, years co-authored and instruction
				*/
				function constructTooltipHTML(d){
					var name = d.name;
					var count = d.times;
					var university = d.university;
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
							'</p><p><strong class="tooltip-body-title">Years Co-Authored:</strong> ' + fYears + '</p>' +
							'<p>Double-Click to go to '+ name +'\'s profile</p>'+
						'</div>' +
					' </div>';

					return html;
				}


				/*
					Removes the filter when the "x" button is clicked
				*/
				scope.removeFilter = function(filterToBeRemoved){
					scope.selectedFilters.forEach(function(filter,i,array){
						if(filterToBeRemoved.filterType === filter.filterType){
							array.splice(i,1);
						}
					});

					updateViz();
				};

				/*
					Creates the necessary data for the force layout
					assigns the data into the variables 'nodes' and 'links'
					nodes contains the information of the author
					links contains the relationship between the nodes
				*/
				function processData(authors, callback){

					nodes = [{name: scope.data.authorName}];
					links = [];
					scope.universities = [];

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
					//calls the callback function passing in two parameters:
					//nodes and links
					callback(nodes, links);
				}


				//function that will open the modal for filtering
				scope.openFilterModal = function(size){
					//creates a modal instance passing in the html template
					//also passing the controller that will handle the data in and out
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

					//This will execute when the "add" button in the modal is clicked
					//the reply contains the filter that the user has selected
				    modalInstance.result.then(function (reply) {
				    	//if it is the first filter then apply the filter
					    if(scope.selectedFilters.length === 0){
				    		scope.selectedFilters = reply;
				    	} else { //else compare filters and remove if it is already there
				    		for(var i = 0; i < reply.length; i++){
				    			for(var j = 0; j < scope.selectedFilters.length; j++){
				    				if(reply[i].filterType === scope.selectedFilters[j].filterType){
				    					scope.selectedFilters.splice(j,1);
				    				}
				    			}
				    			scope.selectedFilters.push(reply[i]);
				    		}
				    	}
				    	//calls the update viz
				    	updateViz();
				    }, function () {
				      console.log('Modal dismissed at: ' + new Date());
				    });
				};

				/*
					function that will filter the data by date
				*/
				function filterByDate(fDate, filteredData){
					var temp = [];
					var iFDate = parseInt(fDate);

					//if filtered data is null then add authors that have dates
					//equal or less than the date filter provided
					if(filteredData === null){
						for(var i = 0; i < scope.data.coauthors.length; i++){
							for(var j = 0; j < scope.data.coauthors[i].dates.length; j++){
								if(iFDate <= parseInt(scope.data.coauthors[i].dates[j])){
									temp.push(scope.data.coauthors[i]);
									break;
								}
							}
						}
					} else {
						for(var i = 0; i < filteredData.length; i++){
							for(var j = 0; j < filteredData[i].dates.length; j++){
								if(iFDate <= parseInt(filteredData[i].dates[j])){
									temp.push(filteredData[i]);
									break;
								}
							}
						}
					}
					//return the results
					return temp;
				}

				/*
					function that will filter the data by frequency of co-authorship
				*/
				function filterByFreq(fFreq, filteredData){
					var temp = [];
					var fFreqs = fFreq.split('-');
					if(filteredData ===  null){
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

				//checks the number if its within the range of the frequency
				function inRange(min, number, max){
					return number >= min && number <= max;
				}

				//get the dates that will provide the dates that users can select in the filer
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
									if(dates[i].value === date) {
										return;
									}
								}
								dates.push({ label: date, value: date, filterLabel: 'Date CoAuthored: ', filterType: 'date'});
							}
						});
					});

					return dates;
				}

				//sets the size and length of the link based on the number of nodes
				//present for the current data
				function setRadiusAndForceForCurrentData(){
					if(nodes.length <= 19){
						selectedRadius = circleRadius.big;
						selectedForce = -600;
					} else if(nodes.length >= 20 && nodes.length <= 39){
						selectedRadius = circleRadius.medium;
						selectedForce = -375;
					} else {
						selectedRadius = circleRadius.small;
						selectedForce = -220;
					}
				}

				//starts the visualisation
				function init(){
					updateViz();
				}

				init();

			}
		};
	}]);