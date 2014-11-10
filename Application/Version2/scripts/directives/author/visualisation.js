'use strict';

angular.module('fypV2App').directive('barChart', [function () {
	return {
		restrict: 'E',
		link: function (scope, iElement, iAttrs) {
			setTimeout(function(){
				console.log("Creating bar chart");
				var el = iElement[0];
				var color = d3.scale.category10();
				var height = 400,
					width = 600,
					barWidth = 50,
					barOffset = 5;

				d3.select(el).append('svg')
					.attr('width', width)
					.attr('height', height)
					.style('background','#C9D7D6')
					.selectAll('g').data(scope.author.coauthors)
					.enter().append('rect')
						.style('fill', function(d,i) { 
							return color(i);
						})
						.attr('width', barWidth)
						.attr('height', function(d){
							return d.count * 5 + '%';
						})
						.attr('x', function(d,i){
							return i * (barWidth + barOffset);
						})
						.attr('y', function(d,i){
							return height - ((d.count*5) + '%');
						});
			},1000)
		}
	};
}])

angular.module('fypV2App').directive('pieChart', [function () {
	return {
		restrict: 'E',
		link: function (scope, iElement, iAttrs) {
			setTimeout(function(){
				console.log("Creating pie chart");
				var height = 400,
					width = 600;
				var el = iElement[0];
				var color = d3.scale.category10();
				var pie = d3.layout.pie();
				var data = [];
				for (var i = 0; i < scope.author.coauthors.length; i++) {
					data.push(scope.author.coauthors[i].count);
				};
				var arcData = pie(data);
				var arc = d3.svg.arc()
							.innerRadius(100)
							.outerRadius(150);

				d3.select(el).append('svg')
					.attr('width', width)
					.attr('height', height)
					.style('background', '#C9D7D6')
					.append('g').attr('transform', 'translate(' + 200 + ',' + 200 + ')')
					.selectAll('path').data(arcData)
					.enter().append('path').attr('d', arc)
					.style('fill', function(d,i){
						return color(i);
					});


			},1000);
		}
	};
}])