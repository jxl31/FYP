'use strict';

var baseURL = 'http://localhost:8081/api/';

var myFactory = angular.module('AuthorFactory', []);

myFactory.factory('AuthorREST', ['$http', '$q',
	function ($http, $q) {
		var factory = {};
		var prefix = 'http://localhost:8081/api/';
		factory.getAuthors = function(){

			var deferred = $q.defer();

			$http({
				url: prefix+'authors',
				method: 'GET',
				cache: 'true'
			}).success(function(data){
				deferred.resolve(data);
			});

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
			
			return deferred.promise;
		};

		return factory;

	}]);