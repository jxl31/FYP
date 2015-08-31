/*
	Author: John Xaviery Lucente
	Directive Name: BubblesDirective
	Use: To create nodes and links according to co-authors data
	Scope:
		authorData: contains the selected authors full details
		relouadRoute: is a function located in the controller "MainVizCtrl" that will reload the page
		viz: contains the parameter for the current visualisation. will be used for redirection
	algorithms url:
		visualisation: http://bl.ocks.org/mbostock/4063269
*/
'use strict';

angular.module('BubblesDirective',[])
	.directive('customBubble', ['$modal','$compile','$rootScope','$location', '$route', '$window', 
		function ($modal, $compile, $rootScope,$location,$route,$window) {
			return {
				restrict: 'EA',
				templateUrl: 'views/visualisation/bubble.html',
				scope: {
					reloadRoute: '&reload',
					authorData: '=data',
					viz: '='
				},
				link: function (scope) {
					console.log(scope.authorData);
					scope.processedData = null;

					//set up the dates shown in the title
					scope.currentDate = new Date();
					scope.universities = [];
					scope.dates = getDates();
					scope.selectedYear = null;
					scope.to = d3.max(scope.dates, function(d){
						return parseInt(d.value);
					});
					scope.from = d3.min(scope.dates, function(d){
						return parseInt(d.value);
					});

					//set up the filters
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
						]},{
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
					//local variables
					scope.selectedFilters = [];
					var svg, legend, tBody, tBodyTitle, tip;
					var firstClick = true;
					var el = $('.bubble-visualisation-container')[0];
					var diameter = $('.visualisation-panel').width()-200,
						margin = {
							top: 0,
							right: 250,
							bottom: 50,
							left: 0
						},
						//color pallette that will be used
					    color = d3.scale.category20();


					//set up the tooltip for the visualisation
					tip = d3.tip()
						.attr('class', 'd3-tip')
						.html(function(d) {
						    return constructTooltipHTML(d);
						})
						.direction(function(d){
							if(d.x <= diameter*0.5 && d.y <= diameter*0.5) {return 'e'; }//top-left corner, tooltip appears on the right
							else if(d.x <= diameter*0.5 && d.y >= diameter*0.5) {return 'e'; }//bottom-left corner, tooltip apears on the right
							else if(d.x >= diameter*0.5 && d.y <= diameter*0.5) {return 'w'; }//top-right corner, tooltip appears on the left
							else if(d.x >= diameter*0.5 && d.y >= diameter*0.5) {return 'w'; }//bottom-right corner, tooltip appears on the left
						})
						.offset(function(d){
							if(d.x <= diameter*0.5 && d.y <= diameter*0.5) {return [0,10];} //top-left corner, tooltip appears on the right
							else if(d.x <= diameter*0.5 && d.y >= diameter*0.5) {return [0,10]; }//bottom-left corner, tooltip apears on the right
							else if(d.x >= diameter*0.5 && d.y <= diameter*0.5) {return [0,-10];} //top-right corner, tooltip appears on the left
							else if(d.x >= diameter*0.5 && d.y >= diameter*0.5) {return [0,-10];} //bottom-right corner, tooltip appears on the left
						});
					//set up the canvas for the visualisation
					svg = d3.select(el).append('svg')
					    .attr('width', diameter + margin.left + margin.right)
					    .attr('height', diameter + margin.top + margin.bottom)
					    .attr('transform', 'translate(' + margin.left + ',' + 0 + ')')
					    .attr('class', 'bubble')
					    .call(tip);
					//Set up the legend
					legend = d3.select('#legend-bubble').append('table')
									.attr('class','legend');
					tBodyTitle = legend.append('tbody');
					tBody = legend.append('tbody');

					//set up the button that will toggle the legend
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

					var tempColor;

					//set up the layout used: pack
					var bubble = d3.layout.pack()
					    .size([diameter, diameter]);


					function updateViz(){
						//clean container
						svg.selectAll('*').remove();
						tBody.selectAll('tr').remove(); //row in the table

						var filteredData;
						if(scope.selectedFilters.length === 0){
							filteredData = scope.authorData.coauthors;
						} else {
							scope.selectedFilters.forEach(function(filter){
								if(filter.filterType === 'date'){ //if there's a filter for date filter by date
									filteredData = filterByDate(filter.value, filteredData);
								} else if(filter.filterType === 'freq'){ //if there's a filter for frequency filter by frequency
									filteredData = filterByFreq(filter.value, filteredData);
								}
							});
						}
						if(filteredData.length === 0){
							//if there is no authors containined in the data after filtering
							//tell users the message that there is no authors
							d3.select('#legend-bubble').selectAll('tbody').remove();
							svg.selectAll('*').remove();
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
							processData(filteredData, function(data){
								scope.processedData = data;

								//set up node with data
								var node = svg.selectAll('g.node')
								      .data(bubble.nodes(classes(data))
								      .filter(function(d) { return !d.children; }));
								var nodeEnter = node.enter().append('g')
								      .attr('class', 'node')
								      .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

						       	//create the circle
						       	nodeEnter.append('circle')
							        .attr('r', function (d) {return d.r;})
							        .style('fill', function (d) {
							        	return color($.inArray(d.university, scope.universities));
							        })
							        .style('cursor', 'pointer');

							    //create the text
							    nodeEnter.append('text')
			      					.attr('dy', '.3em')
								    .style('text-anchor','middle')
								    .text(function(d) { 
								    	return d.child.substring(0, d.r / 4); 
								    })
								    .style('cursor','pointer');

								//actions
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
			      					scope.reloadRoute();
								})
								.on('click',function(d){
									firstClick = true;
									tempColor = this.style.fill;
									tip.show(d);
								});

								//transition the node to be elastic
							    node.transition()
								    .selectAll('circle')
										.attr('r', function(d) {return d.r; })
									.delay(function(d,i){
										return i * 200;
									})
									.duration(1000)
									.ease('elastic');

								node.exit().remove();

								//set up the legend
								$('#legend-bubble').children('table').children('tbody:first-child').append(tButton);
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
							});
						}
					}


					/*
						Will catch any click besides the tooltip and thus closes the tooltip
					*/
					$window.onclick = function(){
						if(!firstClick){
							tip.hide();
						} else {
							firstClick = false;
						}
					};

					/*
						implementing the HTML template for the tooltip
					*/
					function constructTooltipHTML(d){
						var name = d.fname + ' ' + d.lname;
						var count = d.value;
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
								'</p><p><strong class="tooltip-body-title">Years Co-Authored: </strong>' + fYears + '</p>' +
								'<p>Double-Click to go to ' + name + '\'s profile</p>' +
							'</div></div>';

						return html;
					}

					/*
						function that will open the modal for filterings
					*/
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

					    	//update the visualisation
						    updateViz();
					    }, function () {
					    	console.log('Modal dismissed at: ' + new Date());
					    });
					};


					/*
						Removing Filters when the "x" button is clicked
					*/
					scope.removeFilter = function(filterToBeRemoved){
						scope.selectedFilters.forEach(function(filter,i,array){
							if(filterToBeRemoved.filterType === filter.filterType){
								array.splice(i,1);
							}
						});
						console.log(scope.selectedFilters);
						updateViz();
					};

					/*
						function that will filter the data by date
					*/
					function filterByDate(fDate, filteredData){
						var temp = [];
						var iFDate = parseInt(fDate);

						//if filtered data is null then add authors that have dates
						//equal or less than the date filter provided
						if(filteredData === undefined){
						for(var i = 0; i < scope.authorData.coauthors.length; i++){
							for(var j = 0; j < scope.authorData.coauthors[i].dates.length; j++){
									if(iFDate <= parseInt(scope.authorData.coauthors[i].dates[j])){
										temp.push(scope.authorData.coauthors[i]);
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
						//returns results
						return temp;
					}

					/*
						function that will filter the data by frequency of co-authorship
					*/
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
						//return the results
						return temp;
					}
					
					//checks the number if its within the range of the frequency
					function inRange(min, number, max){
						return number >= min && number <= max;
					}


					/*
						Process each node so that it will target parent
					*/
					function classes(root) {
					  var classes1 = [];

					  function recurse(name, node) {
					    if (node.children) {node.children.forEach(function(child) { recurse(node.name, child); });}
					    else {
					    	classes1.push({parent: name, 
					    				dates: node.dates,
					    				child: node.name, 
					    				value: node.size, 
					    				university: node.university, 
					    				fname: node.fname,
					    				lname: node.lname,
					    				key: node.key,
					    				link: node.link});
						}
					  }

					  recurse(null, root);
					  return {children: classes1};
					}


					//Selects the dates that will be used for the filtering
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
										if(dates[i].value === date) {return;}
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
						temp.name = scope.authorData.authorName;
						temp.children = data.map(function(d){
							return {
								name: d.name,
								dates: d.dates,
								children: null,
								size: d.count,
								university: d.university,
								fname: d.fname,
								lname: d.lname,
								key: d.key,
								fullname: d.fullname,
								link: d.link
							};
						});

						data.forEach(function(d){
							if($.inArray(d.university,scope.universities) < 0){
								scope.universities.push(d.university);
							}
						});
						callback(temp);
					}

					function init(){
						updateViz();
					}

					//start the visualisation
					init();
				}
			};
	}]);