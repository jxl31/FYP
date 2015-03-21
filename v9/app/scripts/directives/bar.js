/*
	Author: John Xaviery Lucente
	Directive Name: BarsDirective
	Use: To create rectanles according to co-authors data
	Scope: 
		data: contains the selected authors full details
		viz: contains the parameter for the current visualisation. will be used for redirection
*/

'use strict';

angular.module('BarsDirective',[])
	.directive('customBar', ['$modal','$location',function ($modal, $location) {
		return {
			restrict: 'EA',
			scope: {
				data: '=data',
				reloadRoute: '&reload',
				viz: '='
			},
			templateUrl:'views/visualisation/bar.html',
			link: function (scope) {
				//set up the dates what will be displayed in the title
				scope.currentDate = new Date();
				scope.dates = getDates();
				scope.to = d3.max(scope.dates, function(d){
					return parseInt(d.value);
				});
				scope.from = d3.min(scope.dates, function(d){
					return parseInt(d.value);
				});

				//intialise filters
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
				scope.selectedFilters = [];
				var selectedFontSize = null;
				//select the element in the template where the visualisation will be placed
				var el = $('.bar-visualisation-container')[0];
				//set up the dimensions for the visualisation
				var margin = {top: 40, right: 100, bottom: 200, left: 23};
				var width = $('.bar-visualisation-container').width(),
	    			height = 550 - margin.top - margin.bottom;

	    		//color
	    		var color = d3.scale.category20(),
	    			tempColor, barChart;
	    		//initialise the tooltip for the bards
	    		var tip = d3.tip()
						.attr('class', 'd3-tip')
						.html(function(d) { 
							return constructTooltipHTML(d);
						})
						.offset([-12,0]);
				//set up the container for the visualisation
	    		var svg = d3.select(el).append('svg')
		    			.attr('width', width + margin.right + margin.left)
		    			.attr('height', height + margin.top + margin.bottom)
		    		.append('g')
		    			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
				//y scale which scales every height into proportion from the max height
				function updateViz(){
					//get correct data if there is fitler or not
					var filteredData = null;
					if(scope.selectedFilters.length === 0){
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
						svg.selectAll('*').remove();
						svg.append('svg:text')
							.attr('x', 100)
							.attr('y', width/3)
							.text('No authors with the following constrainst. Please remove or select another.');
					} else {
						processData(filteredData, function(data){
							//remove canvas for a clean setup
							svg.select('.y.axis').remove();
							svg.select('.x.axis').remove();
							svg.selectAll('rect').remove();
							svg.selectAll('text').remove();
							//call the tooltip variable
							svg.call(tip);
							//the height for each rectangle with the given height domain
							var yScale = d3.scale.linear()
											.domain([0, d3.max(data, function(d){
												return d.count;
											})])
											.range([0, height]);

							//vertical line to indicate what the heigh is about
							var vGuideScale = d3.scale.linear()	
												.domain([0,d3.max(data, function(d){return d.count;}) ])
												.range([height, 0]);

							//draw the vertical axis with the labels as count
							var vAxis = d3.svg.axis()
										.scale(vGuideScale)
										.orient('left')
										.ticks(d3.max(data, function(d){return d.count;}));
							var vGuide = svg.append('g')
							.attr('class', 'y axis');
							    vAxis(vGuide);
							    vGuide.attr('transform', 'translate(' + margin.left + ', ' + margin.top + ')');
							    vGuide.selectAll('path')
							        .style({ fill: 'none', stroke: '#000'});
							    vGuide.selectAll('line')
							        .style({ stroke: '#000'});
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


							//set up the x axis
							var xScale = d3.scale.ordinal().domain(data.map(function(d){ 
												return d.name; }))
											.rangeBands([0, width - margin.right - margin.left], 0.3);

							var hAxis = d3.svg.axis()
							    .scale(xScale)
							    .orient('bottom')
							    .tickValues(xScale.domain());
							//draw the x axis
							var hGuide = svg.append('g')
										.attr('class','x axis');
							    hAxis(hGuide);
							    hGuide.attr('transform', 'translate(' + margin.left + ', ' + (height + margin.top) + ')');
							    hGuide.selectAll('path')
							        .style({ fill: 'none', stroke:'#000'});
							    hGuide.selectAll('line')
							        .style({ stroke: '#000'});
							    hGuide.selectAll('text')
							    	.style({'text-anchor': 'start',
							    			'font-size': selectedFontSize+'em'})
						      			.attr('dx', '.5em')
				            			.attr('dy', '.5em')
				            			.attr('transform', function() {
						               		return 'rotate(35)'; 
						                });

						    //input the filtered data into the visualisation
						    barChart = svg.selectAll('rect').data(data);
						    //iterate through each one
						    barChart.enter().append('rect')
						    		.style('fill', function(d,i){
						    			return color(i);
						    		})
						    		.attr('width', xScale.rangeBand())
						    		.attr('x' , function(d){
						    			return xScale(d.name) + margin.left;
						    		})
						    		.attr('height', 0)
						    		.attr('y', height);

						   	//actions
						    barChart.on('mouseover',function(d){
						    		tip.show(d);
									tempColor = this.style.fill;
							        d3.select(this)
							            .style('opacity', 0.5)
							            .style('fill', 'yellow');
								})
								.on('mouseout',function(d){
									tip.hide(d);
									d3.select(this)
							            .style('opacity', 1)
							            .style('fill', tempColor);
								})
								.on('dblclick', function(d){
									console.log(d);
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
								});

							//bar transition
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
					}
				}

				/*
					implementing the HTML template for the tooltip
					will display: name, university, count, years co-authored and instruction
				*/
				function constructTooltipHTML(d){
					var name = d.name;
					var count = d.count;
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
							'<p>Double-Click to go to ' + name + '\'s</p>'+
						'</div></div>';

					return html;
				}

				//Selects the dates that will be used for the filtering
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
									if(dates[i].value === date) {return;}
								}
								dates.push({ label: date, value: date, filterLabel: 'Date CoAuthored: ', filterType: 'date'});
							}
						});
					});
					return dates;
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
					var iFDate = parseInt(fDate);
					var temp = [];

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

					return temp;
				}


				/*
					function that will filter the data by date
				*/
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
					//returns results
					return temp;
				}

				//checks the number if its within the range of the frequency
				function inRange(min, number, max){
					return number >= min && number <= max;
				}


				function processData(data, callback){
					var temp = [];
					temp = data;
					if(data.length < 10){
						selectedFontSize = 1;
					} else if (data.length < 20){
						selectedFontSize = 0.85;
					} else {
						selectedFontSize = 0.7;
					}
					callback(temp);
				}

				function init(){
					updateViz();
				}

				init();
			}
		};
	}]);