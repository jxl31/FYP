/*
  Author: John Xaviery Lucente
  Module: App Configurations
  Use: sets up the dependency and routes for the application
*/
'use strict';
angular
  .module('v9App', [
    'ui.router', //state provider
    'ngAnimate', //animation
    'ngResource', //resource
    'ngRoute', //routing
    'ui.bootstrap', //angular-bootstrap
    'AuthorBox', //directive: author box
    'BarsDirective', //directive: bar
    'BubblesDirective', //directive: bubble
    'CloudDirective', //directive: cloud
    'NetworkDirective', //directive: network
    'PieDirective', //directive: pie
    'TrendDirective' //directive: trend

  ])
  .config(function ($stateProvider, $urlRouterProvider, $urlMatcherFactoryProvider){
    $urlRouterProvider.otherwise('home');

    $stateProvider
      //route for index page
      .state('home', {
        url: '/home',
        templateUrl: 'views/main.html',
        controller: 'MainCtrl'
      })
      //route for the author list
      .state('authorList', {
        url: '/name',
        templateUrl: 'views/name.html',
        controller: 'NameSearchCtrl'
      })
      //route for help
      .state('help', {
        url : '/help',
        templateUrl: 'views/help.html',
        controller: 'HelpCtrl'
      })
      //route for contact
      .state('contact' ,{
        url:'/contact',
        templateUrl: 'views/contact.html',
        controller: 'ContactCtrl'
      })
      //route for discipline list
      .state('disciplineList' ,{
        url: '/discipline',
        templateUrl: 'views/discipline.html',
        controller: 'DisciplineSearchCtrl'
      })
      //route for author provided first and last name
      .state('author1', {
        url: '/author/:fname/:lname/:key/:viz',
        templateUrl: 'views/visualisation.html',
        controller: 'MainVisCtrl'
      })
      //route for author provided fullname
      .state('author2', {
        url: '/author/:fullname/:link/:viz',
        templateUrl: 'views/visualisation.html',
        controller: 'MainVisCtrl'
      });
  });