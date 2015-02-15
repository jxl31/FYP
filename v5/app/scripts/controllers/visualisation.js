'use strict';

angular.module('myappApp')
  .controller('MainVisCtrl', function ($scope, $routeParams, AuthorAPI, $rootScope, $location) {
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
    $scope.statusGroup = { open: 'false' };

    var fname = $routeParams.fname;
    var lname = $routeParams.lname;
    var conceptKey = $routeParams.key;
    var passedViz = $routeParams.viz;

    $scope.init = function(){
      var promiseA = AuthorAPI.getAuthor(fname,lname,conceptKey);
      promiseA.then(function(data){
        $scope.author = data;
      });

      getIndexOfObjWithAttrValue('value',passedViz);
    };
    $scope.init();

    $scope.$watch('author', function(n,o){
      if(n !== o){
      }
    });

    $scope.setSelectedVisualisation = function(viz,docs){
      if(docs !== undefined){
        $scope.indexDocsForCloud = docs;
      }
      $scope.selectedViz = viz;
      console.log($scope.selectedViz);
      setTopic(viz);
    };

    $scope.changePath = function changePath(viz){
      console.log(viz);
      var path = '/author/'+$scope.author.fname+'/'+$scope.author.lname+'/'+conceptKey+'/'+viz.value;
      $location.path(path);
    }



    function getIndexOfObjWithAttrValue(attr, value){
      for(var i = 0; i < $rootScope.topics.length; i++){
        for(var j = 0; j < $rootScope.topics[i].visualisations.length; j++){
          if($rootScope.topics[i].visualisations[j].hasOwnProperty(attr) && 
            $rootScope.topics[i].visualisations[j][attr] === value){
            $scope.selectedViz = $rootScope.topics[i].visualisations[j];
            $scope.selectedTopic = $rootScope.topics[i];
            console.log($scope.selectedTopic);
            return;
          }
        }

      }

      return null;
    }

    function setTopic(viz){
      for(var i = 0; i < $rootScope.topics.length; i++){
        if($.inArray(viz,$rootScope.topics[i]) >= 0){
          $scope.selectedTopic = $rootScope.topics[i];
          $scope.$apply();
          return;
        }
      }
    }

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
