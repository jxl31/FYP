'use strict';

angular.module('myappApp')
	.directive('customNetwork', ['$modal',function ($modal) {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/network.html',
			scope: {
				data: '=data'
			},
			link: function (scope, iElement, iAttrs) {
				scope.universities = [];
				var el = $('.network-visualisation-container')[0];
				var width = $('.visualisation-panel').width(),
					height = 600;

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
			  	}

				var color = d3.scale.category10(),
					tempColor,
					tempCircle, tempTextSize;

				var nodes = [{name: scope.data.authorName}],
					links = [];

				var circleRadius = 20,
					circleLarge = 5,
					tempRadius;

				var svg = d3.select(el).append('svg')
				    .attr('width', function(){
				    	return scope.data.coauthors.length > 20 ? width + 50 : width;
				    })
				    .attr('height', function(){
				    	return scope.data.coauthors.length > 20 ? height + 50 : height;
				    });



				processData(function(){

					var legend = d3.select('#legend-network').append('table')
								.attr('class','legend');
					// create one row per segment.
					var tBodyTitle = legend.append('tbody');
					var tBody = legend.append('tbody');


					var tButton = $('<button/>', {
						text: 'Legend',
						id: 'legendTitleButton',
						click: function(){
							$('#legend-network').children('table').children('tbody:nth-child(2)').toggle('ease');
						},
						class: 'btn btn-lrg'
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

					var force = d3.layout.force()
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

					var node = svg.selectAll('circle')
						.data(nodes).enter()
						.append('g');
						//.call(force.drag);

					node.append('circle')
						.attr('cx', function(d){return d.x;})
						.attr('cy', function(d){return d.y;})
						.attr('r', function(d) { 
							if(d.times != undefined) return circleRadius + d.times * 1.5;
							else return circleRadius; 
						})
						.attr('fill', function(d,i){return color($.inArray(d.university, scope.universities));});

					node.append('text')
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
						.attr('dy', '-1.7em');

					//Actions
					node
						.on('mouseover', function(d){
							//Circle
							tempRadius = parseInt($(this).children('circle').attr('r'));
							d3.select(this).select('circle')
								.attr('r', tempRadius + circleLarge);	
							//Text
							d3.select(this).select('text')
								.classed('node-active', true);

							//Link
							// d3.select(this).select('line')
							// 	.attr('stroke-width', function(d){
							// 		return Math.sqrt(d.source.times)+3;
							// 	});

						})
						.on('mouseout', function(d){
							//Circle
							d3.select(this).select('circle')
								.attr('r', tempRadius);

							//Text
							d3.select(this).select('text')
								.classed('node-active', false);

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



				function processData(callback){
					//{source: authorName, target: first variable in nodes}
					scope.data.coauthors.forEach(function(author){
						nodes.push({name: author.name, 
							target: [0], 
							times: author.count,
							dates: author.dates,
							university: author.university,
						});

						if($.inArray(author.university, scope.universities) < 0)
							scope.universities.push(author.university);
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

			}
		};
	}])


	
