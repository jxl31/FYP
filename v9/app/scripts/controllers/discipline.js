/*
  Author: John Xaviery Lucente
  Controller Name: DisciplineSearchCtrl
  Use: 
    - control the logic of the discipline name list
*/


'use strict';

angular.module('v9App')
  .controller('DisciplineSearchCtrl', function ($scope, $rootScope, DisciplineAPI) {
    //dummy test
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    //toggle highlighting of headers
    var headerButtons = $('div.header').children('ul').children('li');
  	headerButtons.each(function(i,button){
  		if($(button).hasClass('active')) {
        $(button).toggleClass('active');
      }
  	});

    $scope.loaded = false;
  	$scope.disciplines = [];
    $scope.seletedDiscipline;
    $scope.searchQuery = ''; 
    //set up sorting variables
    $scope.filterList = [{label: 'A-Z Firstname', value:'+fname'},
                         {label: 'No. Documents', value:'-count'}];

    //initialise default viz
    $rootScope.defaultViz = {label: 'Bubble Chart', value: 'coauthor-bubble'};

    //init
  	$scope.init = function(){
      //gets the list of discipline
  		var promise = DisciplineAPI.getDisciplines();
  		promise.then(function(data){
  			$scope.disciplines = data;
        $scope.loaded = true;
  		});
      $scope.selectedFilter = $scope.filterList[1];
      $scope.prevFilter = $scope.filterList[1];
  	};

  	$scope.init();

    //changes the filter in the author box list according to the
    //input of the search box
    $scope.filterQuery = function(string){
      $scope.searchQuery = string;
    };

    //discipline is selected via the list
    //oDiscipline contains the details of the selection discipline (discipline_box_list.html)
    //this will be used as the data what will be shown in the author box list
    $scope.setDiscipline = function(oDiscipline){
      $scope.selectedDiscipline = oDiscipline;
      console.log($scope.selectedDiscipline);
    };

    //sets the sorting value after the user has picked it
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
