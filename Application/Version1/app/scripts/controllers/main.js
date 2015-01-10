'use strict';

angular.module('fypV1App')
	.controller('MainCtrl', function () {

});

angular.module('fypV1App')
	.controller('AuthorListController', function($scope, AuthorFactory){
		$scope.authors = [];

		function init(){
			var promise = AuthorFactory.getAuthors();
			promise.then(function(data){ //this is only ran after $http completes
				$scope.authors = data;
			});
		}


		//initialize variables to start binding
		init();

		$scope.numList = 50;

		$scope.getAuthorDetails = function(fname,lname,key){
			$scope.author = {};
			var authorDetails = AuthorFactory.getAuthor(fname, lname, key);
			console.log(authorDetails);
			authorDetails.then(function(data){
				$scope.author = data;
				$scope.author.authorName = fname + ' ' + lname;
			});
		};

		$scope.debug = function(){
			console.log("Do nothing");
		}
});

angular.module('fypV1App').directive('enter', [function () {
	return {
		restrict: 'A',
		link: function (scope, iElement, iAttrs) {
			iElement.bind('click', function(){
				var sFullName = scope.author.name;
				var sLink = scope.author.link;
				var sLName = sFullName.substring(0,sFullName.indexOf(','));
				var sFName = sFullName.substring(sFullName.indexOf(',')+1).trim();
				var keyRegex = '(context|ancestor_key)[=\\:](\\d+)';
				var sKey = sLink.match(keyRegex); //actual value is in key[2]
				scope.getAuthorDetails(sFName,sLName,sKey[2]);
			});
		}
	};
}]);

//TODO: Make a view for this template
angular.module('fypV1App').directive('authorDetails', [function () {
	return {
		restrict: 'A',
		template: '<div> {{  }} </div>',
		link: function (scope, iElement, iAttrs) {
			
		}
	};
}])


