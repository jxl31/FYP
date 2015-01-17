'use strict';

angular.module('myappApp')
	.directive('authorBox', ['$location', function ($location) {
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
					var path = '/author/'+scope.data.fname+'/'+scope.data.lname+'/'+scope.data.key;
      				$location.path(path);
				}


			}
		};
	}]);