'use strict';

angular.module('AuthorBox',[])
	.directive('authorBox', ['$location','$rootScope',
		function ($location,$rootScope) {
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
					var currentLocation = $location.path();
					//check if in path discipline if so use discipline way to get author details
					if(currentLocation === '/discipline'){
						var encodedFullName = encodeURI(scope.data.fullname);
						var path='/author/'+ encodedFullName + //fullname
									'/' + scope.data.link +
									'/' + $rootScope.topics[0].visualisations[2].value; //viz
					} else { 
						var path = '/author/'+scope.data.fname+ //first name
								'/'+scope.data.lname+ //last name
								'/'+scope.data.key+ //key
								'/'+$rootScope.topics[0].visualisations[2].value; //viz
					}
      				$location.path(path);
				}


			}
			};
		}])