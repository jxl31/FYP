'use strict';

/**
 * @ngdoc overview
 * @name v9App
 * @description
 * # v9App
 *
 * Main module of the application.
 */
// angular
//   .module('v9App', [
//     'ngAnimate',
//     'ngResource',
//     'ngRoute'
//   ])
//   .config(function ($routeProvider) {
//     $routeProvider
//       .when('/', {
//         templateUrl: 'views/main.html',
//         controller: 'MainCtrl'
//       })
//       .when('/about', {
//         templateUrl: 'views/about.html',
//         controller: 'AboutCtrl'
//       })
//       .otherwise({
//         redirectTo: '/'
//       });
//   });


angular
  .module('v9App', [
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ui.bootstrap',
    'AuthorBox',
    'BarsDirective',
    'BubblesDirective',
    'CloudDirective',
    'NetworkDirective',
    'PieDirective',
    'TrendDirective'

  ])
  .config(function ($routeProvider) {
    $routeProvider
      .when('/', {
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      .when('/name', {
        templateUrl: 'views/name.html',
        controller: 'NameSearchCtrl'
      })
      .when('/help', {
        templateUrl: 'views/help.html',
        controller: 'HelpCtrl'
      })
      .when('/contact', {
        templateUrl: 'views/contact.html',
        controller: 'ContactCtrl'
      })
      .when('/discipline',{
        templateUrl: 'views/discipline.html',
        controller: 'DisciplineSearchCtrl'
      })
      .when('/author/:fname/:lname/:key/:viz',{
        templateUrl: 'views/visualisation.html',
        controller: 'MainVisCtrl'
      })
      .when('/author/:fullname/:link/:viz', {
        templateUrl: 'views/visualisation.html',
        controller: 'MainVisCtrl'
      })
      .when('/author/:details_id', {
        templateUrl: 'views/visualisation.html',
        controller: 'MainVisCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });