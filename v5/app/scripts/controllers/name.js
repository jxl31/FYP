'use strict';

angular.module('myappApp')
  .controller('NameSearchCtrl', function ($scope, AuthorAPI, $location, $rootScope) {
  	var headerButtons = $('div.header').children('ul').children('li');
  	headerButtons.each(function(i,button){
  		if($(button).hasClass('active')) $(button).toggleClass('active');
  	});

  	$scope.authors = [];
    $scope.searchQuery = '';
    $scope.filterList = [{label: 'A-Z Firstname', value:'+fname'},
                         {label: 'No. Documents', value:'+count'}];

    $rootScope.topics = [
        {name: 'Co-Author', visualisations: [
          {label: 'Pie Chart', value: 'coauthor-piechart'},
          {label: 'Bar Chart', value: 'coauthor-barchart'},
          {label: 'Network Graph', value: 'coauthor-network'},
          {label: 'Bubble Chart', value: 'coauthor-bubble'}
        ]},
        {name: 'Publications', visualisations: [
          {label: 'Trend Graph', value: 'publications-trend'},
          {label: 'Word Cloud', value: 'publications-word'},
        ]},
        {name: 'Discipline', visualisations: [
          {label: 'Pie Chart', value: 'discipline-piechart'},
          {label: 'Bar Chart', value: 'discipline-barchart'},
          {label: 'Bubble Graph', value: 'discipline-bubble'},
          {label: 'Word Cloud', value: 'discipline-word'}
        ]}
    ];

  	$scope.init = function(){
  		var promise = AuthorAPI.getAuthors();
  		promise.then(function(authors){
  			$scope.authors = authors;
  		});

      $scope.selectedFilter = $scope.filterList[0];
      $scope.prevFilter = $scope.filterList[0];
  	};

    $scope.clicked = function(oAuthor){
      var path = '/author/'+oAuthor.fname+'/'+oAuthor.lname+'/'+oAuthor.key+'/'+$rootScope.topics[0].visualisations[1].value;
      $location.path(path);
    };

    $scope.filterQuery = function(string){
      $scope.searchQuery = string;
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