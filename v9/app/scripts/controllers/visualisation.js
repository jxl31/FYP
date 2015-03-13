'use strict';

/**
 * @ngdoc function
 * @name v9App.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the v9App
 */
angular.module('v9App')
  .controller('MainVisCtrl', function ($scope, $routeParams, AuthorAPI, $rootScope, $location, $route) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.reloadRoute = function(){
      $route.reload();
    }

    $rootScope.topics = [
        {name: 'Co-Authorship', visualisations: [
          {label: 'Bar Chart', title:'Co-Authors',value: 'coauthor-barchart'},
          {label: 'Network Graph', title:'Co-Authors',value: 'coauthor-network'},
          {label: 'Bubble Chart', title:'Co-Authors',value: 'coauthor-bubble'}
        ]},
        {name: 'Publications', visualisations: [
          {label: 'Publication Timeline',title:'Publication Timeline', value: 'publications-trend'},
          {label: 'Publications\' Keywords', title:'Publications\' Keywords', value: 'publications-word'},
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
          $rootScope.author = data;
          $scope.author['link'] = link;
          $scope.loaded = true;
          $scope.currentPath = '/author/'+fullname+'/'+link+'/';
        });
      } else {
        var promiseA = AuthorAPI.getAuthor(fname,lname,conceptKey);
        promiseA.then(function(data){
          $rootScope.author = data;
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
      $scope.loaded = loaded;
    };

    $scope.setSelectedVisualisation = function(viz,docs){
      if(docs !== undefined){
        $scope.indexDocsForCloud = docs;
      }
      $scope.selectedViz = viz;
      setTopic(viz);
    };

    $scope.changePath = function changePath(viz){
      if($('.d3-tip') !== null){
        $('.d3-tip').remove();
      }
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

angular.module('v9App')
  .controller('BubbleModalCtrl', function ($scope, $modalInstance, filters) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.filters = filters;

    $scope.selects = getSelects();

    $scope.reply = 'Reply from model: HI MAIN!';

    function getSelects(){
      return filters.map(function(d){
        return d.type === 'select';
      });
    }

    function getNonTrue(){
      var temp = [];
      $scope.selects.forEach(function(d){
        if(d !== true){
          temp.push(d);
        }
      });

      return temp;
    }
    
    $scope.ok = function () {
      $scope.selectedFilters = getNonTrue();
      
      console.log($scope.selectedFilters);
      $modalInstance.close($scope.selectedFilters);
    };

    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  });
