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
          {label: 'Co-Authors (Pie)', value: 'coauthor-piechart'},
          {label: 'Co-Authors (Bar)', value: 'coauthor-barchart'},
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
    $scope.loaded = false;
    $scope.paramSize = countParams();

    var fname = $routeParams.fname;
    var lname = $routeParams.lname;
    var fullname = $routeParams.fullname;
    var link = $routeParams.link;
    var conceptKey = $routeParams.key;
    var passedViz = $routeParams.viz;

    $scope.init = function(){
      if($scope.paramSize === 3){
        var promiseA = AuthorAPI.getAuthorFromDiscipline(fullname, link);
        promiseA.then(function(data){
          $scope.author = data;
          $scope.author['link'] = link;
          $scope.loaded = true;
          $scope.currentPath = '/author/'+fullname+'/'+link+'/';
        });
      } else {
        var promiseA = AuthorAPI.getAuthor(fname,lname,conceptKey);
        promiseA.then(function(data){
          $scope.author = data;
          $scope.loaded = true;
          $scope.currentPath = '/author/'+fname+'/'+lname+'/'+ conceptKey + '/';
        });
      }
      
      getIndexOfObjWithAttrValue('value',passedViz);
    };
    $scope.init();

    $scope.$watch('loaded', function(n,o){
      if(n !== o){
        console.log('Loaded: ' + $scope.loaded);
      }
    });

    $scope.toggleLoaded = function(loaded){
      console.log('Got here');
      $scope.loaded = loaded;
    };

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
      var path = $scope.currentPath+viz.value;
      $location.path(path);
    };

    $scope.go = function(path){
      $location.path(path);
    };



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
    };

    function setTopic(viz){
      for(var i = 0; i < $rootScope.topics.length; i++){
        if($.inArray(viz,$rootScope.topics[i]) >= 0){
          $scope.selectedTopic = $rootScope.topics[i];
          $scope.$apply();
          return;
        }
      }
    };

    function countParams(){
      var size = 0, key;
      for(key in $routeParams){
        if($routeParams.hasOwnProperty(key)) size++;
      }
      return size;
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
