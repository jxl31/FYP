'use strict';

/**
 * @ngdoc function
 * @name myappApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the myappApp
 */
angular.module('myappApp')
  .controller('MainCtrl', function ($scope, $rootScope) {
    $scope.awesomeThings = [
      'HTML5 Boilerplate',
      'AngularJS',
      'Karma'
    ];

    var headerButtons = $('div.header').children('ul').children('li');
    headerButtons.each(function(i,button){
      if($(button).hasClass('active')) $(button).toggleClass('active');
    });

    $scope.indicators = [0,1,2,3,4,5,6,7];
    $scope.imageAvailable = [{
      img_url: 'images/image_1.PNG',
      img_alt: 'list of authors',
      img_main_dsc: 'Showing List Authors',
      img_sub_dsc: 'According to number of documents published.',
      img_no: 0
    },{
      img_url: 'images/image_2.PNG',
      img_alt: 'Bubble Graph',
      img_main_dsc: 'Bubble Graph',
      img_sub_dsc: 'Data is graphically visualised in a bubble graph.',
      img_no: 1
    },{
      img_url: 'images/image_3.PNG',
      img_alt: 'Adding Filter',
      img_main_dsc: 'Modal to add additional filter.',
      img_sub_dsc: 'Users can add filters to further refine their search.',
      img_no: 2
    },{
      img_url: 'images/image_4.PNG',
      img_alt: 'Network Graph',
      img_main_dsc: '',
      img_sub_dsc: '',
      img_no: 3
    },{
      img_url: 'images/image_5.PNG',
      img_alt: 'Filtered Network Graph',
      img_main_dsc: '',
      img_sub_dsc: '',
      img_no: 4
    },{
      img_url: 'images/image_6.PNG',
      img_alt: 'Publication Timeline',
      img_main_dsc: '',
      img_sub_dsc: '',
      img_no: 5
    },{
      img_url: 'images/image_7.PNG',
      img_alt: 'Publication Keywords',
      img_main_dsc: '',
      img_sub_dsc: '',
      img_no: 6
    },{
      img_url: 'images/image_8.PNG',
      img_alt: 'Year filtered Publication Keywords',
      img_main_dsc: '',
      img_sub_dsc: '',
      img_no: 7
    }];

  });
