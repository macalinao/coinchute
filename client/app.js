angular.module('coinchute', ['ui.router', 'ui.bootstrap'])

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
  })

  .state('mock', {
    url: '/mock',
    templateUrl: 'templates/mock.html',
    controller: 'MockCtrl'
  });

  $urlRouterProvider.otherwise('/');

})

.controller('HomeCtrl', function($scope) {})

.controller('DashboardCtrl', function($scope, $modal, $http) {
  $scope.account = {
    balance: 0.00,
    balanceDollars: 0,
    address: '1HB5XMLmzFVj8ALj6mfBsbifRoD4miY36v'
  };

  var addr = '1HB5XMLmzFVj8ALj6mfBsbifRoD4miY36v';

  $http.get('http://api.coindesk.com/v1/bpi/currentprice/USD.json').success(function(price) {
    $http.get('https://api.chain.com/v2/bitcoin/addresses/' + addr + '?api-key-id=855185b9942853b098b8cb59235cadb1').success(function(data) {
      $scope.account = {
        balance: parseFloat((data[0].total.balance / (Math.pow(10, 8))).toFixed(2)),
        balanceDollars: price.bpi.USD.rate,
        address: addr
      };
    });
  });

  $scope.scheduled = [{
    id: 'a',
    company: 'Quizlet',
    companyImage: 'http://quizlet.com/a/i/icons/512.EBT7.jpg',
    amount: 9.99,
    period: 'month',
    item: 'Quizlet Premium',
    last: '2014-10-02',
    next: '2014-11-02'
  }, {
    id: 'b',
    company: 'Spotify, Inc.',
    companyImage: 'http://www.mobileworldlive.com/wp-content/uploads/2013/05/spotify-logo.jpg',
    amount: 4.99,
    period: 'month',
    item: 'Spotify Premium',
    last: '2014-10-02',
    next: '2014-11-02'
  }];

  var qrcode = new QRCode("qrcode", {
    text: $scope.account.address,
    width: 175,
    height: 175,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  $scope.fmtDate = function(date) {
    return moment(date).format('MMMM Do, YYYY');
  };

  $scope.unsubscribe = function(pid, index) {
    var modalInstance = $modal.open({
      templateUrl: 'templates/confirm-delete.html',
      controller: function($scope, payment, $modalInstance) {
        $scope.payment = payment;

        $scope.ok = function() {
          $modalInstance.close(true);
        }

        $scope.cancel = function() {
          $modalInstance.close(false);
        }
      },
      size: 'sm',
      resolve: {
        payment: function() {
          return $scope.scheduled[index];
        }
      }
    });

    modalInstance.result.then(function(res) {
      if (res) {
        $scope.scheduled.splice(index, 1);
      }
    });
  };

})

.controller('MockCtrl', function($scope) {});
