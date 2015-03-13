'use strict';

/**
 * @ngdoc function
 * @name v9App.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the v9App
 */
angular.module('v9App')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
