'use strict';

angular.module('myappApp')
  .controller('DisciplineSearchCtrl', function ($scope, DisciplineAPI) {
  	var headerButtons = $('div.header').children('ul').children('li');
  	headerButtons.each(function(i,button){
  		if($(button).hasClass('active')) $(button).toggleClass('active');
  	});

  	$scope.disciplines = [];

  	$scope.init = function(){
  		var promise = DisciplineAPI.getDisciplines();
  		promise.then(function(data){
  			$scope.disciplines = data;
  		});
  	}

  	$scope.init();

  	$scope.$watchCollection('disciplines', function(n,o){
  		if(n !== o && $scope.disciplines.length > 0){
  			console.log($scope.disciplines);
  		}
  	});

  });