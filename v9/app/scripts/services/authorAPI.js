/*
	Author: John Xaviery Lucente
	Module: AuthorAPI
	Use: communicate with the server through the use of the $http service that angular provides
	Service: gets details of authors
*/
'use strict';

angular.module('v9App')
	.factory('AuthorAPI', ['$http', '$q', 
		function ($http, $q) {
			var factory = {};
			var prefix = 'http://localhost:8081/api/';

			//Gets the list of authors
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

			//Get an author provided first and last name and the concept key
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


			//get the author provided full name
			factory.getAuthorFromDiscipline = function(fullname, link){
				var deferred = $q.defer();
				var uri ='';
				var url = uri.concat(prefix).concat('author/').concat(fullname).concat('/').concat(link)
				console.log(url);
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

			// factory.getAuthorDetails = function(detailsId){
			// 	var deferred = $q.defer();
			// 	var uri = prefix+'author/'+detailsId;

			// 	$http({
			// 		url: uri,
			// 		cache: 'true',
			// 		method: 'GET',
			// 		type: 'application/json'
			// 	}).success(function(data){
			// 		deferred.resolve(data);
			// 	});

			// 	return deferred.promise;
			// };

			factory.saveKeywords = function(detailsId, keywords){
				var deferred = $q.defer();
				var uri = prefix + 'author/'+detailsId+'/'+JSON.stringify(keywords);
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
			};

			return factory;
		}
]);
	