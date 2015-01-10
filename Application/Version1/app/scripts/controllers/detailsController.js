'use strict';

var pies = angular.module('DetailsControllers',[]);

pies.controller('detailsControllers', ['$scope','$rootScope', 'AuthorREST', 
		function ($scope, $rootScope, AuthorREST) {
		
		//$scope.selectedAuthor = selectedAuthor.getAuthor();
		$scope.authorDetails = null;
		$scope.status = {
	   		isopen: false
		};
		$scope.parentmessage = 'hello';

		$scope.diagramsAvailable = ['barchart','piechart'];

		$scope.selectedDiagram = $scope.diagramsAvailable[0];

		$scope.toggleDiagram = function(selected){
			$scope.selectedDiagram = selected;
		};

		$scope.init = function(){
			var sFullName = $rootScope.selectedAuthor.name;
			var key = $rootScope.selectedAuthor.key;
			var sLName = sFullName.substring(0,sFullName.indexOf(','));
			var sFName = sFullName.substring(sFullName.indexOf(',')+1).trim();

			var promise = AuthorREST.getAuthor(sFName, sLName, key);
						promise.then(function(data){
								$scope.authorDetails = data;
						});
		};

		$scope.init();

		$rootScope.$watch('selectedAuthor', function(n,o){
			if(n !== o){
				$scope.init();
				$scope.selectedDiagram = $scope.diagramsAvailable[0];
				console.log('new author');
			}
		});

	}]);