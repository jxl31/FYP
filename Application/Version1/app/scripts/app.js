'use strict';

var myApp = angular.module('fypV1App', [
	'ngRoute',
	'ui.bootstrap',
	'MainController',
	'NameSearchController',
	'DetailsControllers',
	'PiesDirective',
	'BarsDirective',
	'AuthorFactory'
	]);

myApp.config(['$routeProvider', function ($routeProvider) {
	$routeProvider.
		when('/', {
			templateUrl: 'views/help.html'
		}).
		when('/nameSearch',{
			templateUrl: 'views/list.html',
			controller: 'NameSearchCtrl'
		}).
		otherwise({ redirectTo: '/' });
}]);


