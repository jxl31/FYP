'use strict';

angular.module('myappApp')
	.directive('customBar', [function () {
		return {
			restrict: 'EA',
			scope: {
				data: '=data'
			},
			link: function (scope, iElement, iAttrs) {
				var margin = {top: 20, right: 60, bottom: 70, left: 60};
				var width = $('.visualisation-panel').width(),
	    			height = 450 - margin.top - margin.bottom;

	    		var color = d3.scale.category10(),
	    			tempColor;

	    		var svg = d3.select(iElement[0]).append('svg')
		    			.attr('width', width + margin.left + margin.right)
		    			.attr('height', height + margin.top + margin.bottom)
		    		.append('g')
		    			.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
				//y scale which scales every height into proportion from the max height
				var yScale = d3.scale.linear()
								.domain([0, d3.max(scope.data, function(d){ return d.count;})])
								.range([0, height]);

				//vertical line to indicate what the heigh is about
				var vGuideScale = d3.scale.linear()	
									.domain([0,d3.max(scope.data, function(d){return d.count;}) ])
									.range([height, 0]);
				var vAxis = d3.svg.axis()
							.scale(vGuideScale)
							.orient('left')
							.ticks(d3.max(scope.data, function(d){return d.count;}));
				var vGuide = svg.append('g');
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


				var xScale = d3.scale.ordinal().domain(scope.data.map(function(d){ 
									return d.name; }))
								.rangeBands([0, width], 0.3);

				var hAxis = d3.svg.axis()
				    .scale(xScale)
				    .orient('bottom')
				    .tickValues(xScale.domain());

				var hGuide = svg.append('g');
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
			    var barChart = svg.selectAll('rect').data(scope.data)
			    	.enter().append('rect')
			    		.style('fill', function(d,i){
			    			return color(i);
			    		})
			    		.attr('width', xScale.rangeBand())
			    		.attr('x' , function(d){
			    			return xScale(d.name) + margin.left;
			    		})
			    		.attr('height', 0)
			    		.attr('y', height)
			    	.on('mouseover',function(d){
						tempColor = this.style.fill;
				        d3.select(this)
				            .style('opacity', .5)
				            .style('fill', 'yellow');
					})
					.on('mouseout',function(d){
						d3.select(this)
				            .style('opacity', 1)
				            .style('fill', tempColor);
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
			}
		};
	}])