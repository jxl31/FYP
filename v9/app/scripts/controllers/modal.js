/*
  Author: John Xaviery Lucente
  Controller Name: AuthorBox
  Use: logic for the modal used for filtering
*/

'use strict';

angular.module('v9App')
  .controller('BubbleModalCtrl', function ($scope, $modalInstance, filters) {
    //dummy test
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    $scope.filters = filters;

    //gets the selects of the passed filter
    $scope.selects = getSelects();

    //returns an array of selects which will be used by the
    //bubble_filter.html
    function getSelects(){
      return filters.map(function(d){
        return d.type === 'select';
      });
    }

    //Gets the selected filter from the selection
    //if not selected it returns true so in order to get the selected
    //we need to get the non true values
    function getNonTrue(){
      var temp = [];
      $scope.selects.forEach(function(d){
        if(d !== true){
          temp.push(d);
        }
      });

      return temp;
    }
    
    //sends the selected filters when the "add" button is clicked back to
    //the visualisation
    $scope.ok = function () {
      $scope.selectedFilters = getNonTrue();
      
      $modalInstance.close($scope.selectedFilters);
    };

    //closes the modal
    $scope.cancel = function () {
      $modalInstance.dismiss('cancel');
    };
  });
