'use strict';

angular.module('myappApp')
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
