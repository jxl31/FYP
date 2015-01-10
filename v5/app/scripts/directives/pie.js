'use strict';

angular.module('myappApp')
	.directive('customPie', [function () {
		return {
			restrict: 'EA',
			templateUrl: 'views/visualisation/pie_v1.html',
			scope: {
				data: '=data'
			},
			link: function (scope, iElement, iAttrs) {
				console.log(scope.data);

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
									content: scope.data.map(function(d){
												return {label: d.name, value: d.count};
											})
								}
							});
			}
		};
	}])