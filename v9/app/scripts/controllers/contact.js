/*
  Author: John Xaviery Lucente
  Controller Name: ContactCtrl
  Use: 
    - control the highlighing of headers
*/


'use strict';

angular.module('v9App')
  .controller('ContactCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    //toggles the highlighting of the header
    var headerButtons = $('div.header').children('ul').children('li');
    headerButtons.each(function(i,button){
      if($(button).hasClass('active')) {
        $(button).toggleClass('active');
      }
    });
  });
