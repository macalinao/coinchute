angular.module('coinchute', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider.state('begin', {
    url: '/begin',
    templateUrl: 'templates/begin.html',
    controller: 'BeginCtrl'
  })
  .state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  });

  $urlRouterProvider.otherwise('/begin');

})

.controller('BeginCtrl', function($scope) {
  $scope.company = 'Spotify, Inc.';
  $scope.price = 4.99;
  $scope.item = 'Spotify Premium';
})

.controller('LoginCtrl', function($scope) {
});

