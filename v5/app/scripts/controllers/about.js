angular.module('myappApp')
  .controller('AboutCtrl', function ($scope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    
    $('.header > ul > li').click(function() {
      $('.header > ul > li').not(this).removeClass('active');
      $(this).toggleClass('active');
    });
  });
