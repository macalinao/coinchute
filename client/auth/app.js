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
  })

  .state('register', {
    url: '/register',
    templateUrl: 'templates/register.html',
    controller: 'RegisterCtrl'
  });

  $urlRouterProvider.otherwise('/begin');

})

.controller('BeginCtrl', function($scope) {
  $scope.company = 'Spotify, Inc.';
  $scope.price = 4.99;
  $scope.item = 'Spotify Premium';
})

.controller('LoginCtrl', function($scope) {})

.controller('RegisterCtrl', function($scope) {

  var qrcode = new QRCode("qrcode", {
    text: "http://jindo.dev.naver.com/collie",
    width: 175,
    height: 175,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

});
