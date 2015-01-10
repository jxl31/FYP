'use strict';

var pies = angular.module('PiesDirective',[]);

pies.directive('coauthorPie', [function ($compile) {
	return {
		restrict: 'E',
		link: function (scope, iElement, iAttrs) {
			scope.$watch('authorDetails',function(n,o){
				if(n !== o){
					console.log('got here');
					scope.draw();
				}
			});

			scope.draw = function(){
				$(iElement[0]).empty();
					var pie = new d3pie(iElement[0],{
								size: {
									canvasWidth: 700
								},
								header: {
									title: {
										text: 'Co-author frequency'
									}
								},

								labels: {
									inner: {
										format: 'value',
										hideWhenLessThanPercentage: 3
									},

									'value': {
										'color': '#fff'
									},

									mainLabel : {
										fontSize: 15
									}
								},

								data:{
									content: scope.authorDetails.coauthors.map(function(d){
												return {label: d.name, value: d.count};
											})
								}
							});
			};
			
		}
	};
}]);