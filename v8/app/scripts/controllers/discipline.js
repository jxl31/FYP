'use strict';

angular.module('myappApp')
  .controller('DisciplineSearchCtrl', function ($scope, $rootScope, DisciplineAPI) {
  	var headerButtons = $('div.header').children('ul').children('li');
  	headerButtons.each(function(i,button){
  		if($(button).hasClass('active')) $(button).toggleClass('active');
  	});

  	$scope.disciplines = [];
    $scope.seletedDiscipline;

    $scope.filterList = [{label: 'A-Z Firstname', value:'+fname'},
                         {label: 'No. Documents', value:'+count'}];

    $rootScope.topics = [
        {name: 'Co-Author', visualisations: [
          {label: 'Co-Authors (Bar)', value: 'coauthor-barchart'},
          {label: 'Network Graph', value: 'coauthor-network'},
          {label: 'Bubble Chart', value: 'coauthor-bubble'}
        ]},
        {name: 'Publications', visualisations: [
          {label: 'Trend Graph', value: 'publications-trend'},
          {label: 'Word Cloud', value: 'publications-word'},
        ]}
      ];

  	$scope.init = function(){
  		var promise = DisciplineAPI.getDisciplines();
  		promise.then(function(data){
  			$scope.disciplines = data;
  		});

      $scope.selectedFilter = $scope.filterList[0];
      $scope.prevFilter = $scope.filterList[0];
  	};

  	$scope.init();

  	$scope.$watchCollection('disciplines', function(n,o){
  		if(n !== o && $scope.disciplines.length > 0){
  			console.log($scope.disciplines);
  		}
  	});

    $scope.filterQuery = function(string){
      $scope.searchQuery = string;
    };

    $scope.setDiscipline = function(oDiscipline){
      $scope.selectedDiscipline = oDiscipline;
    };

    $scope.toggleFilter = function(filter){
      var values = filter.value.match('([+-])(\\w+)');
      var order = values[1];
      var value = values[2];
      if(filter.value === $scope.prevFilter.value){
        $scope.selectedFilter.value = order === '+' ? '-'+value : '+'+value;
      } else{
        $scope.selectedFilter = filter;
      }
      $scope.prevFilter = $scope.selectedFilter;
      console.log($scope.selectedFilter);
    };

    $scope.init();


  });