'use strict';

/**
 * @ngdoc overview
 * @name myappApp
 * @description
 * # myappApp
 *
 * Main module of the application.
 */
var myApp = angular
  .module('myappApp', [
    'ngAnimate',
    'ngResource',
    'ngRoute',
    'ui.bootstrap',
    'App.filters'
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
