'use strict';

angular.module('myappApp')
  .controller('MainVisCtrl', function ($scope, $routeParams, AuthorAPI) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.author = {};
    $scope.diagrams = [{diagram: 'coauthorpie', name:'Co-Author PieChart'},
                        {diagram: 'coauthorbar', name:'Co-Author BarChart'}];
    $scope.selectedDiagram = $scope.diagrams[0];

    var fname = $routeParams.fname;
    var lname = $routeParams.lname;
    var conceptKey = $routeParams.key;

    $scope.init = function(){
      var promiseA = AuthorAPI.getAuthor(fname,lname,conceptKey);
      promiseA.then(function(data){
        $scope.author = data;
      });
    };

    $scope.toggleDiagram = function(selected){
      $scope.selectedDiagram = selected;
    };

    $scope.init();

    $scope.$watch('author', function(n,o){
      if(n !== o){
        console.log($scope.author);
      }
    });

  });
