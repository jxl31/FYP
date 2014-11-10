'use strict';

angular.module('fypV2App')
	.controller('MainCtrl', function () {

});

angular.module('fypV2App')
	.controller('AuthorListController', function($scope, AuthorFactory, $location){
		$scope.authors = [];
		$scope.author = {};

		function init(){
			var promise = AuthorFactory.getAuthors();
			promise.then(function(data){ //this is only ran after $http completes
				$scope.authors = data;
			});
		}

		init();

		$scope.numList = 50;

		$scope.debug = function(){
			console.log('Do Nothing');
		}
});




