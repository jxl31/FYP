/*
	Author: John Xaviery Lucente
	Directive Name: AuthorBox
	Use: To create the author box used in the author list page
	Scope: 
		data: contains the selected authors general details
*/

'use strict';

angular.module('AuthorBox',[])
	.directive('authorBox', ['$location','$rootScope','$state',
		function ($location,$rootScope, $state) {
			return {
				restrict: 'AE',
				scope:{
					data: '=data'
				},
				templateUrl: 'views/authors/author_box.html',
				link: function (scope, iElement) {
					//when it is hovered
					scope.toggleBoxShadow = function(){
						$(iElement[0]).children('div').toggleClass('author-box-enter');
					};

					//when author box is clicked
					//add effect when its pressed down
					scope.onMouseDown = function(){
						$(iElement[0]).children('div').toggleClass('author-box-down');
					};

					scope.click = function(){
						if(scope.data.key === undefined){
							scope.data.key = 490738;
						}
						
						var currentLocation = $location.path();
						console.log(currentLocation);
						var path = '';
						//check if in path discipline if so use discipline way to get author details
						if(currentLocation === '/discipline'){
							path ='/author/'+ scope.data.fullname + //fullname
										'/' + scope.data.link + //link to documents
										'/' + $rootScope.defaultViz.value; //viz
						} else { 
							path = '/author/'+scope.data.fname+ //first name
									'/'+scope.data.lname+ //last name
									'/'+scope.data.key+ //key
									'/'+$rootScope.defaultViz.value; //viz
						}
						console.log(path);
	      				$location.path(path);
					};
				}
			};
		}]);