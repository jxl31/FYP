'use strict';

describe('Controller: MainVisCtrl', function (AuthorAPI) {

  // load the controller's module
  beforeEach(module('v9App'));

  var service, httpBackend;

  beforeEach(function () {
      angular.mock.inject(function ($injector) {
          httpBackend = $injector.get('$httpBackend');
          service = $injector.get('AuthorAPI');
      });
  });

  describe('getAuthors', function(){
    it('should return list of authors', function(){
      httpBackend.expectGET('http://localhost:8081/api/authors');
      service.getAuthors(function(result){
        expect(result).not.toBeNull();
      });
      httpBackend.flush();
    });
  });

  var MainCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    MainCtrl = $controller('MainVisCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });

  // describe('$scope.init', function(){
  //   it('gets the authors details', function(){
  //     var $scope = {};
  //     var controller = $controller('MainVisCtrl', {$scope: $scope});
  //     $scope.fname = 'Waleed';
  //     $scope.lname = 'Abo-Hameed';
  //     $scope.key = 490738;
  //     $scope.init();
  //     expect($scope.author).not.toBeNull();
  //   })
  // })
});
