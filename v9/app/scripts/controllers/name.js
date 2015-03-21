/*
  Author: John Xaviery Lucente
  Controller Name: NameSearchCtrl
  Use: 
    - control the logic of the author name list
*/

'use strict';

angular.module('v9App')
  .controller('NameSearchCtrl', function ($scope, AuthorAPI, $location, $rootScope) {
    //Dummy Test
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    //toggle highlighted headers
    var headerButtons = $('div.header').children('ul').children('li');
    headerButtons.each(function(i,button){
      if($(button).hasClass('active')) { 
        $(button).toggleClass('active');
      }
    });

    //local variables
    $scope.authors = [];
    $scope.loaded = false;
    $scope.searchQuery = '';
    //set the sorting rules
    $scope.filterList = [{label: 'A-Z Firstname', value:'+fname'},
                         {label: 'No. Documents', value:'-count'}];

    //detaul visualisation
    $rootScope.defaultViz = {label: 'Bubble Chart', value: 'coauthor-bubble'};

    //initialise
    $scope.init = function(){
      //gets the list of authors
      var promise = AuthorAPI.getAuthors();
      promise.then(function(authors){
        $scope.authors = authors;
      });

      //default filter: no. documents in descending order
      $scope.selectedFilter = $scope.filterList[1];
      $scope.prevFilter = $scope.filterList[1];
      $scope.loaded = true;
    };

    //click event when the name on the list is clicked
    $scope.clicked = function(oAuthor){
      var path = '/author/' +oAuthor.fname+ '/'+ //firstname
                    oAuthor.lname +'/' + //lastname
                    oAuthor.key +'/' + //key
                    $rootScope.defaultViz.value; //visualisation to go to
                    //default is bubble chart
      $location.path(path);
    };

    //changes the filter on the author box list (author_box_list.html)
    $scope.filterQuery = function(string){
      $scope.searchQuery = string;
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
