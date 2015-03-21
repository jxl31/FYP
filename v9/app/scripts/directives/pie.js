'use strict';

angular.module('PieDirective',[])
	.directive('customPie', [function () {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/pie_v1.html',
			scope: {
				data: '=data'
			},
			link: function (scope, iElement) {
				console.log(scope.data);

				new d3pie(iElement[0],{
								size: {
									canvasWidth: 700,
									canvasHeight: 700,
									pieOuterRadius: 220
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
									content: scope.data.map(function(d){
												return {label: d.name.substring(0, 40 / 4), value: d.count};
											})
								}
							});
			}
		};
	}]);