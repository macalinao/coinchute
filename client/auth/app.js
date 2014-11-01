angular.module('coinchute', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider.state('login', {
    url: '/login',
    templateUrl: 'templates/login.html',
    controller: 'LoginCtrl'
  });

  $urlRouterProvider.otherwise('/login');

})

.controller('LoginCtrl', function($scope) {
  console.log('asdf');
});
