angular.module('fypV2App')
	.controller('BarChartController', function($scope, AuthorFactory, $location, $routeParams){
		$scope.author = {};
		$scope.vizTypes = ['bar','pie'];
		$scope.vizType = $scope.vizTypes[0];
		var prev = $scope.vizType;
		var curr = prev;

		function init(){
			var sFullName = $routeParams.whichAuthor;
			var key = $routeParams.key;
			var sLName = sFullName.substring(0,sFullName.indexOf(','));
			var sFName = sFullName.substring(sFullName.indexOf(',')+1).trim();
			//var keyRegex = '(context|ancestor_key)[=\\:](\\d+)';
			//var sKey = sLink.match(keyRegex); //actual value is in key[2]
			var promise = AuthorFactory.getAuthor(sFName, sLName, key);
			promise.then(function(data){
				$scope.author = data;
			})
		}

		init();

		$('#vizSelect').on('change',function(){
			curr = $scope.vizTypes[this.selectedIndex];
			if(prev == curr) {}
			else{ 
				$scope.vizType = curr; 
				prev = curr;
				$scope.$apply();
			}
		})
	})