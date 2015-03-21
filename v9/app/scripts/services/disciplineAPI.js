/*
	Author: John Xaviery Lucente
	Module: AuthorAPI
	Use: communicate with the server through the use of the $http service that angular provides
	Service: Gets details of discipline
*/
'use strict';

angular.module('v9App')
	.factory('DisciplineAPI', ['$http', '$q', function ($http, $q) {
		var factory = {};
		var prefix = 'http://localhost:8081/api/';

		//Gets the list of disciplines
		factory.getDisciplines = function(){
			var deferred = $q.defer();

			$http({
				url: prefix+'disciplines',
				method: 'GET',
				cache: 'true'
			}).success(function(data){
				deferred.resolve(data);
			});

			return deferred.promise;
		};

		return factory;
	}]);