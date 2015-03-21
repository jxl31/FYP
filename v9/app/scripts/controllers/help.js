/*
  Author: John Xaviery Lucente
  Controller Name: HelpCtrl
  Use: controls the one page navigation of the help section
*/

'use strict';

angular.module('v9App')
  .controller('HelpCtrl', function ($scope, $anchorScroll, $location) {
    //dummy test
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    //toggle header highlighting
    var headerButtons = $('div.header').children('ul').children('li');
    headerButtons.each(function(i,button){
      if($(button).hasClass('active')) {$(button).toggleClass('active');}
    });

    //jQuery click event to go back to the top
    $('.back-to-top').click(function(){
      $('html, body').animate({scrollTop: 0}, 800);
      return false; 
    });

    //controls the in page navigation
    //changes the location depending on the id clicked
    $scope.gotoAnchor = function(x) {
      var newHash = x;
      if ($location.hash() !== newHash) {
        // set the $location.hash to `newHash` and
        // $anchorScroll will automatically scroll to it
        $location.hash(newHash);
      } else {
        // call $anchorScroll() explicitly,
        // since $location.hash hasn't changed
        $anchorScroll();
      }
    };
  });
