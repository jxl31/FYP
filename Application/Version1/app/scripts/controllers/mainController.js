'use strict';

var MainController = angular.module('MainController',[]);

MainController.controller('MainCtrl',['$scope', 
	function($scope){
		$scope.selectedByName = false;

		$scope.toggleNameList = function(){
			if($scope.selectedByName === false) {
				$scope.selectedByName = true;
			}
			else {
				$scope.selectedByName = false;
			}
		};


		$('.sidebar-nav > li').click(function() {
   			$('.sidebar-nav > li').not(this).removeClass('active');
			$(this).toggleClass('active');
 		});

 		
	}]);

MainController.controller('SomeCtrl',['$scope',function($scope){
	$scope.message = 'Hello World #2';
}]);