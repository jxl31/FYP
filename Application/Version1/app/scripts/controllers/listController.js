'use strict';
var nameSearch = angular.module('NameSearchController', []);

nameSearch.controller('NameSearchCtrl',['$scope','$rootScope','AuthorREST', 
	function($scope, $rootScope, AuthorREST){
		$scope.authors = [];
		$rootScope.selectedAuthor = {};
		$scope.isAuthorEmpty = true;
		$scope.template = {url: ''};

		$scope.init = function(){
			var promise = AuthorREST.getAuthors();
			promise.then(function(authors){
				$scope.authors = authors;
				$rootScope.authors = authors;
			});
		};
		
		$scope.setAuthor = function(author){
			$scope.isAuthorEmpty = false;
			if(author !== $scope.author){
				$rootScope.selectedAuthor = author;
				$scope.template.url = 'includes/visualisation.html';
			} else{
				$rootScope.selectedAuthor = {};
			}
		};

		$scope.init();

		$scope.$watch('authors', function(n,o){
			if($scope.authors.length > 0){
				setTimeout(function(){
					$('.list1-items > button').click(function() {
			   			$('.list1-items > button').not(this).removeClass('active');
			   			$(this).toggleClass('active');
		 			});
				},100);
	 		}
		});
	}]);