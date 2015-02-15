'use strict';

angular.module('myappApp')
	.factory('AuthorAPI', ['$http', '$q', 
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

			factory.saveKeywords = function(details_id, keywords){
				var deferred = $q.defer();
				var uri = prefix + 'author/'+details_id+'/'+JSON.stringify(keywords);
				var url = encodeURI(uri);
				console.log(url);

				$http({
					url: url,
					cache: 'false',
					method: 'PUT'
				}).success(function(msg){
					deferred.resolve(msg);
				});

				return deferred.promise;
			}

			return factory;
		}
]);