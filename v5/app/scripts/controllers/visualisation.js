'use strict';

angular.module('myappApp')
  .controller('MainVisCtrl', function ($scope, $routeParams, AuthorAPI, $rootScope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

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

    $scope.author = {};
    $scope.selectedViz = {label: 'Bubble Graph', value: 'coauthor-bubble'};
    $scope.statusGroup = { open: 'false' };


    var fname = $routeParams.fname;
    var lname = $routeParams.lname;
    var conceptKey = $routeParams.key;

    $scope.init = function(){
      var promiseA = AuthorAPI.getAuthor(fname,lname,conceptKey);
      promiseA.then(function(data){
        $scope.author = data;
      });
    };
    $scope.init();

    $scope.$watch('author', function(n,o){
      if(n !== o){
      }
    });

    $scope.setSelectedVisualisation = function(viz){
      $scope.selectedViz = viz;
    };
  });


/**
  Controller for bubble filter modal
**/

angular.module('myappApp')
  .controller('BubbleModalCtrl', function($scope, $modalInstance, message){
    $scope.message = message;
    $scope.reply = 'Reply from model: HI MAIN!';

    $scope.ok = function () {
      $modalInstance.close($scope.reply);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  });
