angular.module('myappApp')
  .controller('HelpCtrl', ['$scope','$anchorScroll','$location',
    function ($scope, $anchorScroll, $location) {
      $scope.awesomeThings = [
        'HTML5 Boilerplate',
        'AngularJS',
        'Karma'
      ];
      
      var headerButtons = $('div.header').children('ul').children('li');
      headerButtons.each(function(i,button){
        if($(button).hasClass('active')) $(button).toggleClass('active');
      });


      $('.back-to-top').click(function(){
        $('html, body').animate({scrollTop: 0}, 800);
        return false; 
      });

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

    }]);
