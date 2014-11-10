'use strict';
//TODO: Make a view for this template
angular.module('fypV2App').directive('authorDetails', [function () {
	return {
		restrict: 'A',
		template: '<div> {{  }} </div>',
		link: function (scope, iElement, iAttrs) {
			
		}
	};
}])

// angular.module('fypV2App').directive('enter', [function ($scope,$route, $routeParams, $location) {
// 	return {
// 		restrict: 'A',
// 		scope: false,
// 		link: function (scope, iElement, iAttrs) {
// 			iElement.bind('click', function(){
// 				var sFullName = scope.a.name;
// 				var sLink = scope.a.link;
// 				var sLName = sFullName.substring(0,sFullName.indexOf(','));
// 				var sFName = sFullName.substring(sFullName.indexOf(',')+1).trim();
// 				var keyRegex = '(context|ancestor_key)[=\\:](\\d+)';
// 				var sKey = sLink.match(keyRegex); //actual value is in key[2]
// 				scope.getAuthorDetails(sFName,sLName,sKey[2]);
// 			});
// 		}
// 	};
// }]);