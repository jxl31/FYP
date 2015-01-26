'use strict';

angular.module('myappApp')
	.directive('customBubble', ['$modal', function ($modal) {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/bubble.html',
			scope: {
				authorData: '=data'
			},
			link: function (scope, iElement, iAttrs) {
				scope.processedData;
				scope.filters = [{
						name: 'Number of times co-authored',
						label: 'No. Times',
						value: 0},
					{
						name: 'Similar Discipline',
						label: 'Similar Discipline',
						value: []
					}];

				scope.selectedFilters = [];
				var el = $('.bubble-visualisation-container')[0];
				var diameter = $('.visualisation-panel').width(),
				    format = d3.format(',d'),
				    color = d3.scale.category20c();

				var bubble = d3.layout.pack()
				    .sort(null)
				    .size([diameter, diameter])
				    .padding(1.5);

				var svg = d3.select(el).append('svg')
				    .attr('width', diameter)
				    .attr('height', diameter)
				    .attr('class', 'bubble');

				processData(scope.authorData, function(processedData){
					scope.processedData = processedData;

					var node = svg.selectAll('.node')
					      .data(bubble.nodes(classes(scope.processedData))
					      .filter(function(d) { return !d.children; }))
					    .enter().append('g')
					      .attr('class', 'node')
					      .attr('transform', function(d) { return 'translate(' + d.x + ',' + d.y + ')'; });

					node.append('title')
						.text(function(d) { return d.child + ': ' + format(d.value);});

					node.append('circle')
						.attr('r', 0)
      					.style('fill', function(d,i) { return color(i); });

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
						scope.filters.push(d.child);
						scope.$apply();
					});

				});
				

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
				    else classes.push({parent: name, child: node.name, value: node.size});
				  }

				  recurse(null, root);
				  return {children: classes};
				}

				/*
					Prepare data for bubble chart
				*/
				function processData(data, callback){
					var temp = {};
					temp['name'] = data.authorName;
					temp['children'] = data.coauthors.map(function(d){
						return {
							name: d.name,
							children: null,
							size: d.count
						}
					});
					callback(temp);
				}
			}
		};
	}]);