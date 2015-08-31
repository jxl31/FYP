

'use strict';

angular.module('TrendDirective',[])
	.directive('customTrend', ['$modal','$location','$rootScope','$window',function ($modal,$location,$rootScope,$window) {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/trend.html',
			scope: {
				data: '=',
				change: '&',
				viz: '='
			},
			link: function (scope) {

				//setup dimensions for visualisation
				var margin = {
						top: 50,
						right: 20,
						bottom: 50,
						left: 100
					},
					width = $('.trend-visualisation-container').width() - 100,
					height = 400;
				var tip;

				//get all dates for the filter to use
				scope.dates = getDates();
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

				//used by window click
				var firstClick = true;

				//both to and from scope variables are used by the title
				scope.to = d3.max(scope.dates, function(d){
					return parseInt(d);
				});
				scope.from = d3.min(scope.dates, function(d){
					return parseInt(d);
				});

				//will return 1 day of the year with date and seconds
				var parseDate = d3.time.format('%Y').parse;

				//x axis scale from 0 pixels to the width of the container
				var x = d3.time.scale()
    					.range([0, width - margin.left - margin.right]);

    			var xAxis = d3.svg.axis()
					    .scale(x)
					    .orient('bottom');

    			//y axis from the height of the container to 0 pixels
    			var y = d3.scale.linear()
    				.range([height, 0]);

    			var yAxis = d3.svg.axis()
				    .scale(y)
				    .orient('left');

				//the line function will have x as the date and y the amount
				var line = d3.svg.line()
				    .x(function(d) { return x(d.tDate); })
				    .y(function(d) { return y(d.amount); });

				//add the svg elements to the HTML element
				var el = $('.trend-visualisation-container')[0];
				var svg = d3.select(el).append('svg')
				    .attr('width', width + margin.left + margin.right)
				    .attr('height', height + margin.top + margin.bottom)
				  .append('g')
				    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

				function updateViz(){
					//clean container
					svg.select('.trend-x.trend-axis').remove();
					svg.select('.trend-y.trend-axis').remove();
					svg.selectAll('path.trend-line').remove();
					svg.selectAll('circle.datapoint').remove();

					//filter data is have to
					var filteredData;
					if(scope.selectedFilters.length === 0){
						filteredData = scope.data.docs;
					} else {
						scope.selectedFilters.forEach(function(filter){
							if(filter.filterType === 'peer'){ //if there's a filter for peer
								filteredData = filterByPeer(filter.value, filteredData);
							} else if(filter.filterType === 'p_title'){ //if there's a filter for publication title
								filteredData = filterByPublicationTitle(filter.value, filteredData);
							}
						});
					}

					//check if there is data if none, then show message
					if(filteredData.length === 0){
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
							data.forEach(function(d){
								d.tDate = parseDate(d.date);
							});
							//Setting up the coordinates how far the data will go to the top and from the side so
							//it wont overflow to any other div in the template
							x.domain(d3.extent(data, function(d) { return d.tDate; }));
							y.domain([0,d3.max(data, function(d) { return d.amount; })]);
							yAxis.ticks(d3.max(data, function(d) { return d.amount; }));

							//creates the x axis guide from the made xAxis scale
							svg.append('g')
						      .attr('class', 'trend-x trend-axis')
						      .attr('transform', 'translate(0,' + height + ')')
						      .call(xAxis);
						    //do the same with the y axis
						    svg.append('g')
						      .attr('class', 'trend-y trend-axis')
						      .call(yAxis);

						    //using the line function specified above. append the line in the svg group 'g'
						    svg.append('path')
						      .datum(data)
						      .attr('class', 'trend-line')
						      .attr('d', line);

							//initialize tooltip
						   	tip = d3.tip()
								.attr('class', 'd3-tip tooltip-trend')
								.offset([0,-10])
								.direction(function(d){
									//if the y coordinates of the element is greater than 4/10 of the height then display
									//the tooltip in the bottom as to not lose data in when it is displayed in the top
									if(y(d.amount) < height * 0.4) {
										return 's';
									}
									else {
										return 'n';
									}
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
							  .enter().append('circle')
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

						}); //end processdata
					}//end else

				}
				
				//the change function is from the contorler and it will set the visualisation to be
				//the word cloud when the circle in the trend graph is clicked.
				scope.goToCloudGraph = function(d){
					scope.change({viz:{label: 'Publications\' Keywords', title:'Publications\' Keywords', value: 'publications-word'}, docs: d.titles });
					scope.$apply();
				};

				//process the data for the line graph to use
				function processData(docs,callback){
					console.log(docs);
					var tempData = [];
					//looping through each document
					//adds into an array if its a new year
					//adding necessary data such as date, amount, titles that are in that year
					//and the status of peer reviewed
					docs.forEach(function(d,i){
						if(i === 0){
							tempData.push({
								date: d.publication_date.match('\\d+[/\\-](\\d+)')[1],
								amount: 1,
								titles: [{title: d.title, downloadLink: d.download_link}],
								indexes: [i],
								peerReviewd: d.peer_reviewed
							});
						} else {
							for(var y = 0; y < tempData.length; y++){
								//example of a publication data "01/2014"
								//the reges provided takes the year of the publication
								if(tempData[y].date === d.publication_date.match('\\d+[/\\-](\\d+)')[1]){
									tempData[y].amount++;
									tempData[y].titles.push({title: d.title, downloadLink: d.download_link});
									tempData[y].indexes.push(i);
									return;
								} else if(y+1 === tempData.length){
									tempData.push({
										date: d.publication_date.match('\\d+[/\\-](\\d+)')[1],
										amount : 1,
										titles: [{title: d.title, downloadLink: d.download_link}],
										indexes: [i],
										peerReviewd: d.peer_reviewed
									});
									return;
								}
							} //for
						} //else
					});

					scope.data.trendData = tempData;

					callback(tempData);
				}

				//function for creating the modal for the filtering
				scope.openFilterModal = function(size){
					var modalInstance = $modal.open({
				      templateUrl: 'bubble_filter.html', //the template to use
				      controller: 'BubbleModalCtrl', //the controller to use
				      size: size, //size 'l','s'
				      resolve: {
				        filters: function () {
				          return scope.filters; //pass in the filters initialised by this directive
				        }
				      }
				    });

					//executed when "add" button of modal is selected
				    modalInstance.result.then(function (reply) {
				    	//checks filters if it is length 0 then add whatever filter was passed
				    	if(scope.selectedFilters.length === 0){
				    		scope.selectedFilters = reply;
				    	} else {
				    		//else if there is already a filter
				    		//check if the type of filter is already there and if so change the value
				    		for(var i = 0; i < reply.length; i++){
				    			for(var j = 0; j < scope.selectedFilters.length; j++){
				    				if(reply[i].filterType === scope.selectedFilters[j].filterType){
				    					scope.selectedFilters.splice(j,1);
				    				}
				    			}
				    			scope.selectedFilters.push(reply[i]);
				    		}
				    	}
					    updateViz();
				    }, function () {
				    	console.log('Modal dismissed at: ' + new Date());
				    });
				};

				/*
					Removes the filter when the "x" button is clicked
				*/
				scope.removeFilter = function(filterToBeRemoved){
					scope.selectedFilters.forEach(function(filter,i,array){
						if(filterToBeRemoved.filterType === filter.filterType){
							array.splice(i,1);
						}
					});
					console.log(scope.selectedFilters);
					tip.hide();
					updateViz();
				};

				/*
					Function that constructs the HTML template for the tooltip
					will display: year, publications, count, instruction
				*/
				function constructTooltipHTML(d){
					var heading = d.date;
					var amount = d.amount;

					var titles = '<ol class="tooltip-title-list">';
					d.titles.forEach(function(data){
						titles += '<li> <a target="_blank" href="'+ data.downloadLink +'">' + data.title + '</a></li>';
					});
					titles+= '</ol>';

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
								'<br>Double-Click node to view keywords.' +
							'</div>' +
						' </div>';


					return html;
				}

				/*
					Filter the publications if they are peer reviewed or not
				*/
				function filterByPeer(bPeer){
					var temp = [];
					scope.data.docs.forEach(function(doc){
						if(doc.peer_reviewed === bPeer) {
							temp.push(doc);
						}
					});

					return temp;
				}

				/*
					Filter the publications by title
				*/
				function filterByPublicationTitle(sPTitle){
					var temp = [];
					scope.data.docs.forEach(function(doc){
						if(doc.publication_title === sPTitle) { 
							temp.push(doc);
						}
					});
					return temp;
				}

				//gets the titles of the publications
				//an example output is "Articles, Reports, Books"
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
								if(temp[i].value === doc.publication_title) { 
									return;
								}
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

				//Getting Dates from the authors to be used as the filter values
				function getDates (){
					var dates = [];
					scope.data.coauthors.forEach(function(author){
						author.dates.forEach(function(date){
							if(dates.length === 0){
								dates.push(date);
							} else {
								for(var i =0; i < dates.length; i++){
									if(dates[i].value === date) { 
										return;
									}
								}
								dates.push(date);
							}
						});
					});
					return dates;
				}

				/*
					Click on window will high the tooltip if ever there is one
				*/
				$window.onclick = function(){
					var jTip = $('.d3-tip');
					if(!firstClick){
						console.log(jTip);
						tip.hide();
					} else {
						firstClick = false;
					}
				};

				scope.init = function(){
					updateViz();
				}

				scope.init();

			}
		};
	}]);