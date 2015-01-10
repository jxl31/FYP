'use strict';

angular.module('myappApp')
  .controller('NameSearchCtrl', function ($scope, AuthorAPI, $location) {
  	var headerButtons = $('div.header').children('ul').children('li');
  	headerButtons.each(function(i,button){
  		if($(button).hasClass('active')) $(button).toggleClass('active');
  	});

  	$scope.authors = [];

  	$scope.init = function(){
  		var promise = AuthorAPI.getAuthors();
  		promise.then(function(authors){
  			$scope.authors = authors;
  		});
  	}

    $scope.clicked = function(oAuthor){
      var path = '/author/'+oAuthor.fname+'/'+oAuthor.lname+'/'+oAuthor.key;
      $location.path(path);
    }

  	$scope.init();


  });