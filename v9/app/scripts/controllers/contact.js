'use strict';

/**
 * @ngdoc function
 * @name v9App.controller:AboutCtrl
 * @description
 * # AboutCtrl
 * Controller of the v9App
 */
angular.module('v9App')
  .controller('ContactCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    var headerButtons = $('div.header').children('ul').children('li');
    headerButtons.each(function(i,button){
      if($(button).hasClass('active')) $(button).toggleClass('active');
    });
  });
