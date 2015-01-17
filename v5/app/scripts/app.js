'use strict';

/**
 * @ngdoc overview
 * @name myappApp
 * @description
 * # myappApp
 *
 * Main module of the application.
 */
angular
  .module('myappApp', [
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ui.bootstrap'
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
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/contact', {
        templateUrl: 'views/contact.html',
        controller: 'ContactCtrl'
      })
      .when('/discipline',{
        templateUrl: 'views/discipline.html',
        controller: 'DisciplineSearchCtrl'
      })
      .when('/author/:fname/:lname/:key',{
        templateUrl: 'views/visualisation.html',
        controller: 'MainVisCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
