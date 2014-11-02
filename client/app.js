var prefix = '';
var chain = new WebSocket("wss://ws.chain.com/v2/notifications"); // connect to chain
chain.listeners = [];
chain.onopen = function(ev) {
  var req = {
    type: 'new-transaction',
    block_chain: 'bitcoin'
  };
  chain.send(JSON.stringify(req));
};
chain.onmessage = function(ev) {
  var x = JSON.parse(ev.data);
  chain.listeners.filter(function(c) {
    c(x);
  });
};

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
  })

  .state('auth', {
    templateUrl: 'templates/auth.html',
    controller: 'AuthCtrl'
  })

  .state('auth.begin', {
    url: '/auth/begin',
    templateUrl: 'templates/auth/begin.html',
    controller: 'AuthBeginCtrl'
  })

  .state('auth.login', {
    url: '/auth/login',
    templateUrl: 'templates/auth/login.html',
    controller: 'AuthLoginCtrl'
  })

  .state('auth.register', {
    url: '/auth/register',
    templateUrl: 'templates/auth/register.html',
    controller: 'AuthRegisterCtrl'
  })

  .state('auth.confirm', {
    url: '/auth/confirm',
    templateUrl: 'templates/auth/confirm.html',
    controller: 'AuthConfirmCtrl'
  })

  .state('auth.success', {
    url: '/auth/success',
    templateUrl: 'templates/auth/success.html',
    controller: 'AuthSuccessCtrl'
  });

  $urlRouterProvider.otherwise('/');

})

.controller('HomeCtrl', function($scope) {})

.controller('DashboardCtrl', function($scope, $modal, addressInfo, findAddr) {
  findAddr(function(addrUser) {
    $scope.account = {
      balance: 0.00,
      balanceDollars: 0,
      address: addrUser
    };

    addressInfo(addrUser, function(data) {
      $scope.account = data;
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
    }, {
      id: 'c',
      company: 'LOL',
      companyImage: '',
      amount: 3.99,
      period: 'month',
      item: 'Laughter',
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

    var addr = addrUser;
    chain.listeners.push(function(x) {
      var tx = x.payload.transaction;

      var valid = _.find(tx.inputs, function(input) {
        return _.find(input.addresses, function(a) {
          return a == addr;
        });
      }) || _.find(tx.outputs, function(input) {
        return _.find(input.addresses, function(a) {
          return a == addr;
        });
      });

      if (!valid) {
        return;
      }

      addressInfo(addr, function(data) {
        $scope.account = data;
      });
    });


  });
})

.controller('MockCtrl', function($scope, addressInfo, $http) {
  var addr = '1JAo7utfAnFhaSkbBYfBNJYnW89adN51oV';
  $scope.address = addr;

  var qrcode = new QRCode("qrcode", {
    text: addr,
    width: 175,
    height: 175,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });

  addressInfo(addr, function(data) {
    $scope.account = data;
  });

  chain.listeners.push(function(x) {
    var tx = x.payload.transaction;

    var valid = _.find(tx.inputs, function(input) {
      return _.find(input.addresses, function(a) {
        return a == addr;
      });
    }) || _.find(tx.outputs, function(input) {
      return _.find(input.addresses, function(a) {
        return a == addr;
      });
    });

    if (!valid) {
      return;
    }

    addressInfo(addr, function(data) {
      $scope.account = data;
    });
  });

  $scope.pull = function() {
    $http.post(prefix + '/request', {
      address: addr,
      subscription_uuid: $scope.userUUID,
      amount: $scope.amount
    }).success(function() {
      alert('done');
    });
  };

  $scope.launchWindow = function() {
    var c = $scope.pay;
    window.location = '#/auth/begin?' 
       + (c.company ? ('company=' + encodeURIComponent(c.company)) : '')
       + (c.img ? ('&img=' + encodeURIComponent(c.img)) : '')
       + (c.price ? ('&price=' + encodeURIComponent(c.price)) : '')
       + (c.item ? ('&item=' + encodeURIComponent(c.item)) : '')
       + (c.callback ? ('&callback=' + encodeURIComponent(c.callback)) : '')
       + (c.redirect ? ('&redirect=' + encodeURIComponent(c.redirect)) : '&redirect=' + encodeURIComponent('/#/mock'));
  };

})

.controller('AuthCtrl', function($scope) {})

.controller('AuthBeginCtrl', function($scope, $location, currauth) {
  var s = $location.search();
  var data = {
    company: s.company || 'Spotify, Inc.',
    img: s.img || 'http://www.mobileworldlive.com/wp-content/uploads/2013/05/spotify-logo.jpg',
    price: parseFloat(s.price) || 4.99,
    item: s.item || 'Spotify Premium',
    callback: s.callback || 'http://google.com',
    redirect: s.redirect || 'http://google.com'
  };
  currauth.data = data;
  console.log(currauth);
  $scope.data = data;
})

.controller('AuthLoginCtrl', function($scope) {})

.controller('AuthRegisterCtrl', function($scope, findAddr, addressInfo) {
  findAddr(function(addrUser) {

    $scope.address = addrUser;

    var qrcode = new QRCode("qrcode", {
      text: addrUser,
      width: 175,
      height: 175,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });

    var addr = addrUser;
    chain.listeners.push(function(x) {
      var tx = x.payload.transaction;

      var valid = _.find(tx.inputs, function(input) {
        return _.find(input.addresses, function(a) {
          return a == addr;
        });
      }) || _.find(tx.outputs, function(input) {
        return _.find(input.addresses, function(a) {
          return a == addr;
        });
      });

      if (!valid) {
        return;
      }

      addressInfo(addr, function(data) {
        $scope.account = data;
      });
    });

  });

})

.controller('AuthConfirmCtrl', function($scope, currauth) {
  console.log(currauth);
  $scope.data = currauth.data;
})

.controller('AuthSuccessCtrl', function($scope, $location, currauth) {
  setTimeout(function() {
    window.location = currauth.data.redirect;
  }, 2000);
})

.factory('addressInfo', function($http) {
  return function(addr, cb) {
    $http.get('http://api.coindesk.com/v1/bpi/currentprice/USD.json').success(function(price) {
      $http.get('https://api.chain.com/v2/bitcoin/addresses/' + addr + '?api-key-id=855185b9942853b098b8cb59235cadb1').success(function(data) {
        cb({
          balance: parseFloat((data[0].total.balance / (Math.pow(10, 8))).toFixed(4)),
          balanceDollars: price.bpi.USD.rate * data[0].total.balance / Math.pow(10, 8),
          address: addr
        });
      });
    });
  };
})

.factory('findAddr', function($http) {
  return function(cb) {
    $http.get(prefix + '/accounts/5cb1d132-62a8-11e4-8fc6-6817291ad8d2/addresses').success(function(data) {
      cb(data.addresses);
    }).error(function() {
      cb('1CbBcYW1Be767BwkcNhCYGNXTxXr9wexrT');
    });
  };
})

.factory('currauth', function() {
  return {
    data: {}
  };
});
