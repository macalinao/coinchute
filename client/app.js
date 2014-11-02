angular.module('coinchute', ['ui.router'])

.config(function($stateProvider, $urlRouterProvider) {

  $stateProvider

  .state('home', {
    url: '/',
    templateUrl: 'templates/home.html',
    controller: 'HomeCtrl'
  })

  .state('dashboard', {
    url: '/dashboard',
    templateUrl: 'templates/dashboard.html',
    controller: 'DashboardCtrl'
  });

  $urlRouterProvider.otherwise('/');

})

.controller('HomeCtrl', function($scope) {})

.controller('DashboardCtrl', function($scope) {
  $scope.account = {
    balance: 0.89,
    balanceDollars: 340
  };

  $scope.scheduled = [
    {
      company: 'Quizlet',
      companyImage: 'http://quizlet.com/a/i/icons/512.EBT7.jpg',
      amount: 9.99,
      period: 'month',
      item: 'Quizlet Premium',
      last: '2014-10-02',
      next: '2014-11-02'
    },
    {
      company: 'Spotify, Inc.',
      companyImage: 'http://www.mobileworldlive.com/wp-content/uploads/2013/05/spotify-logo.jpg',
      amount: 4.99,
      period: 'month',
      item: 'Spotify Premium',
      last: '2014-10-02',
      next: '2014-11-02'
    }
  ];
});
