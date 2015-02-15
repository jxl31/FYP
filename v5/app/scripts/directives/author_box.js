'use strict';

angular.module('myappApp')
	.directive('authorBox', ['$location','$rootScope', function ($location,$rootScope) {
		return {
			restrict: 'AE',
			scope:{
				data: '=data'
			},
			templateUrl: 'views/authors/author_box.html',
			link: function (scope, iElement, iAttrs) {
				scope.toggleBoxShadow = function(){
					$(iElement[0]).children('div').toggleClass('author-box-enter');
				}

				scope.onMouseDown = function(){
					$(iElement[0]).children('div').toggleClass('author-box-down');
				}

				scope.click = function(){
					if(scope.data.key === undefined){
						scope.data.key = 490738;
					}
					console.log($rootScope.topics);
					var path = '/author/'+scope.data.fname+'/'+scope.data.lname+'/'+scope.data.key+'/'+$rootScope.topics[0].visualisations[1].value;
      				$location.path(path);
				}


			}
		};
	}]);