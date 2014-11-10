'use strict';

var myApp = angular.module('fypV1App', ['ngRoute']);

myApp.config(['$routeProvider', function ($routeProvider) {
	$routeProvider.
		when('/', {
			templateUrl: 'views/main.html',
			controller: 'AuthorListController'
		}).
		otherwise({ redirectTo: '/' });
}]);

myApp.factory('AuthorFactory', function ($http,$q) {
	var factory = {};
	var authors = [];
	var prefix = 'http://localhost:8081/api/';
	factory.getAuthors = function(){

		var deferred = $q.defer();

		$http({
			url: prefix+'authors',
			method: 'GET',
			cache: 'true'
		}).success(function(data){
			deferred.resolve(data);
		})

		return deferred.promise;
	};

	factory.getAuthor = function(fname,lname,key){

		var deferred = $q.defer();
		var uri = prefix+'author/'+fname+'/'+lname+'/'+key;
		var url = encodeURI(uri);

		$http({
			url: url,
			cache: 'true',
			method: 'GET',
			type: 'application/json'
		}).success(function(data){
			deferred.resolve(data);
		});

		/*$http.get(url)
			.success(function(data){
				deferred.resolve(data);
			});*/
		return deferred.promise;
	};

	return factory;

});
