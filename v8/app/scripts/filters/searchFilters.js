'use strict';

angular.module('App.filters', []).filter('firstAndLast', [function () {
    return function (authors, query) {
        if (!angular.isUndefined(query) && query.length > 0) {
            var tempAuthors = [];
            angular.forEach(authors, function(author){
            	console.log('Got here');
				if(author.fname.indexOf(query) >= 0 ||
					author.lname.indexOf(query) >= 0){
					tempAuthors.push(author);
				}
			});
            return tempAuthors;
        } else {
            return authors;
        }
    };
}]);