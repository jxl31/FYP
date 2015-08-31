/*
  Author: John Xaviery Lucente
  Controller Name: MainVisCtrl
  Use: 
    - Fetch the data needed for the selected visualisation.
    - also provided the parameters that the selection of visualisation uses
*/


'use strict';

angular.module('v9App')
  .controller('MainVisCtrl', function ($scope, AuthorAPI, $rootScope, $location, $window, $state, $stateParams) {
    //Dummy Test
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    //will be used to reload the page to redirect to another author's profile
    $scope.reloadRoute = function(){
      $scope.$apply();
    };

    //sets the selection of visualisation
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
    $scope.fname = '';
    $scope.lname = '';
    $scope.conceptKey = null;

    //retrieve the variables passed in the parameters
    $scope.paramSize = countParams();
    $scope.fname = $stateParams.fname;
    $scope.lname = $stateParams.lname;
    $scope.conceptKey = $stateParams.key;
    var fullname = $stateParams.fullname;
    var link = encodeURIComponent($stateParams.link);
    var passedViz = $stateParams.viz;

    //init function
    $scope.init = function(){
      var promiseA = null;
      //param size is three meaning that it came from the discipline
      //so get the fullname of the author
      if($scope.paramSize === 3){
        promiseA = AuthorAPI.getAuthorFromDiscipline(fullname, link);
        promiseA.then(function(data){
          $scope.author = data;
          $scope.author.link = link;
          $scope.loaded = true;
          $scope.currentPath = '/author/'+fullname+'/'+link+'/';
        });
      } else { //else use the normal way of getting the author's details through
        //first and last name and key
        promiseA = AuthorAPI.getAuthor($scope.fname,$scope.lname,$scope.conceptKey);
        promiseA.then(function(data){
          $rootScope.author = data;
          $scope.author = data;
          $scope.loaded = true;
          $scope.currentPath = '/author/'+$scope.fname+'/'+$scope.lname+'/'+ $scope.conceptKey + '/';
        });
      }
      
      getIndexOfObjWithAttrValue('value',passedViz);
    };
    $scope.init();

    //toggles the loading gif
    $scope.toggleLoaded = function(loaded){
      $scope.loaded = loaded;
    };

    //sets the visualisation to toggle the condition on the visualisation.html
    //this will set what visualisation will be shown
    $scope.setSelectedVisualisation = function(viz,docs){
      console.log('Gets here');
      console.log(docs);
      console.log(viz);
      if(docs !== undefined){
        $scope.indexDocsForCloud = docs;
      }
      $scope.selectedViz = viz;
    };

    //used by the selection of visualisation to change the path and reload both controller and view
    $scope.changePath = function changePath(viz, button){
      if($('.d3-tip') !== null){
        $('.d3-tip').remove();
      }
      var path = $scope.currentPath+viz.value;
      $location.path(path);

    };

    $scope.go = function(path){
      $location.path(path);
    }

    /*
      Set Selected Visualisation with the passed visualisation
    */
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
    }

    //count the parameters
    function countParams(){
      var size = 0, key;
      for(key in $stateParams){
        if($stateParams.hasOwnProperty(key)) { 
          size++;  
        }
      }
      return size;
    }
  });