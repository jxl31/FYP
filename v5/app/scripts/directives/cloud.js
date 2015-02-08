'use strict';

angular.module('myappApp')
	.directive('customWordCloud', [function () {
		return {
			restrict: 'E',
			scope: {
				data: '='
			},
			link: function (scope, iElement, iAttrs) {
				var margin = {
						top: 50,
						right: 20,
						bottom: 20,
						left: 20
					},
					width = $('.visualisation-panel').width(),
					height = 500;

				var color = d3.scale.category20();

				processData(function(words){
					d3.layout.cloud().size([width,height])
						.words(words)
						.timeInterval(10)
						.padding(5)
						.rotate(function() { return ~~(Math.random() * 5) * 30 - 60; })
						.font('Impact')
						.fontSize(function(d) { return d.size * 20 + 5; })
						.on('end', draw)
						.start();
				});

				function draw(words){
					var svg = d3.select(iElement[0]).append('svg')
					    .attr('width', width + margin.left + margin.right)
					    .attr('height', height + margin.top + margin.bottom)
					  .append('g')
					    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
							.selectAll("text")
					        .data(words).enter().append("text")
						        .style("fill", function(d, i) { return color(i); })
						        .attr("text-anchor", "middle")
						        .attr("transform", function(d) {
						          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
						        })
						        .text(function(d) { return d.text; });


					// var fill = d3.scale.category20();
					// 	  d3.layout.cloud().size([800, 500])
					// 	      .words([
					// 	        "Hello", "world", "normally", "you", "want", "more", "words",
					// 	        "than", "this"].map(function(d) {
					// 	        return {text: d, size: 10 + Math.random() * 90};
					// 	      }))
					// 	      .padding(5)
					// 	      .rotate(function() { return ~~(Math.random() * 5) * 30 - 60; })
					// 	      .font("Impact")
					// 	      .fontSize(function(d) { return d.size; })
					// 	      .on("end", draw)
					// 	      .start();
					// 	  function draw(words) {
					// 	    d3.select(iElement[0]).append("svg")
					// 	        .attr("width", 800)
					// 	        .attr("height", 500)
					// 	      .append("g")
					// 	        .attr("transform", "translate(200,150)")
					// 	      .selectAll("text")
					// 	        .data(words)
					// 	      .enter().append("text")
					// 	        .style("font-size", function(d) { console.log(d);return d.size + "px"; })
					// 	        .style("font-family", "Impact")
					// 	        .style("fill", function(d, i) { return fill(i); })
					// 	        .attr("text-anchor", "middle")
					// 	        .attr("transform", function(d) {
					// 	          return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
					// 	        })
					// 	        .text(function(d) { return d.text; });

				}

				function processData(callback){
					var temp = [];
					var max = 1;
					scope.data.keywords.forEach(function(d,i){
						console.log(d);
					});
					callback(temp);
				}
			}
		};
	}])