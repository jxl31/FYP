'use strict';

/**
 * @ngdoc function
 * @name v8appApp.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the v8appApp
 */
angular.module('v8appApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];
  });
