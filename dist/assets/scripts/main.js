(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var home        = require('./home/home'),
    type        = require('./type/type'),
    leaderboard = require('./leaderboard/leaderboard');

var config = function($urlRouterProvider, $stateProvider) {
  $stateProvider
    .state('404', {
      url: '/404',
      templateUrl: './dist/assets/views/errors/404.html'
    });

  $urlRouterProvider
    .otherwise('404');
}

angular
  .module('PowerTypist', [
    'Home',
    'Type',
    'Leaderboard'
  ])
  .config([
    '$urlRouterProvider',
    '$stateProvider',
    config
  ]);

var words  = require('./services/words.js');
var scores = require('./services/scores.js');

},{"./home/home":2,"./leaderboard/leaderboard":3,"./services/scores.js":4,"./services/words.js":5,"./type/type":6}],2:[function(require,module,exports){
function home() {

  var config = function($stateProvider) {
    $stateProvider
      .state('home', {
        url: '/',
        controller: 'HomeController',
        controllerAs: 'vm',
        templateUrl: './dist/assets/views/home/home.html'
      });
  }

  var homeController = function() {
    
  }

  angular
    .module('Home', ['ui.router'])
    .config([
      '$stateProvider',
      config
    ])
    .controller('HomeController', [

      homeController
    ]);
}

module.exports = home();

},{}],3:[function(require,module,exports){
function leaderboard() {
 	var config = function($stateProvider) {
 		$stateProvider
 			.state('leaderboard', {
 				url: '/leaderboard',
 				controller: 'LeaderboardController',
 				controllerAs: 'vm',
 				templateUrl: './dist/assets/views/leaderboard/leaderboard.html',
 				resolve: {
 					leaderboard: [
 						'ScoresService',
 						function(ScoresService) {
 							return ScoresService.index()
 							.then(function(response) {
 								return response;
 							});
 						}
 					]
 				}
 			});
 	}

 	var leaderboardController = function(leaderboard) {
 		var vm = this;
 		vm.leaderboard = leaderboard;
 	}

 	angular
 		.module('Leaderboard', ['ui.router'])
 		.config([
 			'$stateProvider',
 			config
 		])
 		.controller('LeaderboardController', [
 			'leaderboard',
 			leaderboardController
 		]);
}

module.exports = leaderboard();
},{}],4:[function(require,module,exports){
function scores() {
	var ScoresService = function($q, $http) {
		var ScoresService = {};
		var API = 'http://45.63.18.172:8080/';

		ScoresService.index = function() {
			var defer = $q.defer();

			$http.get(API + 'scores')
				.then(function(response) {
					return defer.resolve(response.data);
				}, function(response) {
					return defer.reject('Whoops! Something went wrong!');
				});

			return defer.promise;
		}

		ScoresService.store = function(data) {
			var defer = $q.defer();

			$http.post(API + 'scores', data)
				.then(function(response) {
					return defer.resolve(response.data);
				}, function(response) {
					return defer.reject('Whoops! Something went wrong!');
				});

			return defer.promise;
		}

		return ScoresService;
	}

	angular
		.module('PowerTypist')
		.factory('ScoresService', [
			'$q',
			'$http',
			ScoresService
		]);
}

module.exports = scores();
},{}],5:[function(require,module,exports){
function words() {
	var WordsService = function($q, $http) {
		var WordsService = {};

		WordsService.refresh = function(array) {
			var m = array.length, t, i;

			while (m) {
				i = Math.floor(Math.random() * m--);

				t = array[m];
				array[m] = array[i];
				array[i] = t;
			}

			return array;
		}

		WordsService.extend = function(array, num) {
			for (var i = 0; i < num; i ++) {
				var index = Math.floor(Math.random() * (array.length - 0));

				array.push(array[index]);
			}

			return WordsService.refresh(array);
		}

		WordsService.index = function() {
			var defer = $q.defer();

			$http.get('./dist/assets/scripts/words.json')
				.then(function(response) {
					var words = [];

					response.data.forEach(function(obj) {
						var word = obj.word;
						words.push(word);
					});

					defer.resolve(WordsService.refresh(words));
				}, function(response) {
					defer.reject('Words could not be loaded.');
				});

			return defer.promise;
		}

		return WordsService;
	}

	angular
		.module('PowerTypist')
		.factory('WordsService', [
			'$q',
			'$http',
			WordsService
		]);
}

module.exports = words();
},{}],6:[function(require,module,exports){
function type() {

  var config = function($stateProvider) {
    $stateProvider
      .state('type', {
        url: '/type',
        controller: 'TypeController',
        controllerAs: 'vm',
        templateUrl: './dist/assets/views/type/type.html',
        resolve: {
          words: [
            'WordsService',
            function(WordsService) {
              return WordsService.index()
              .then(function(response) {
                return response;
              });
            }
          ]
        }
      });
  }

  var typeController = function(words, WordsService, $timeout, ScoresService) {
    var vm = this;

    vm.wordBank = words;

    if (vm.wordBank.length <= 100) {
      vm.wordBank = WordsService.extend(vm.wordBank, 200);
    }

    var currentHeight = 0;

    vm.onWord = 0;
    vm.onChar = 0;

    vm.correctWords = [];
    vm.incorrectWords = [];
    vm.correctChars = 0;
    vm.incorrectChars = 0;

    vm.wordsPerMinute = 0;

    vm.counter = 60;
    var timeout = null;

    vm.gameOver = false;

    var timer = false;

    function endGame() {
      vm.wordsPerMinute = vm.correctWords.length;
      $('.input-group').hide();
      $('.panel-words').slideUp();
      vm.gameOver = true;
    }

    function checkWPM() {
      var secondsPassed = 60 - vm.counter;
      var rate = 60 / secondsPassed;

      vm.wordsPerMinute = Math.round(vm.correctWords.length * rate);
    }

    function onTimeout() {
      if (vm.counter == 0) {
        $timeout.cancel(timeout);
        timer = false;
        endGame();
        return;
      } else {

        vm.counter -= 1;
        timer = true;
        checkWPM();
        timeout = $timeout(onTimeout, 1000);
      }
    }

    function startTimer() {
      timeout = $timeout(onTimeout, 1000);
      timer = true;
    }

    function stopTimer() {
      vm.counter = 60;
      $timeout.cancel(timeout);
      timer = false;
    }

    vm.checkWord = function(event) {
      if (event.keyCode === 32 || event.charCode === 32) {
        event.preventDefault();

        var currentWord = $('.word-active').position().top;
        var nextWord = $('.word-next').position().top;

        if (currentWord < nextWord) {
          var top = $('.word-list').position().top;
          $('.word-list').css('top', top - 45 + 'px');
        }

        console.log(currentWord);

        if ($('input').val() == vm.wordBank[vm.onWord].substring(0, vm.wordBank[vm.onWord].length)) {
          vm.correctWords.push(vm.onWord);
        } else {
          vm.incorrectWords.push(vm.onWord);
        }

        $('input').val('');
        vm.onWord += 1;

      }

      vm.onChar ++;
    }

    vm.checkChar = function(event) {
      if (!timer) {
        startTimer();
      }

      if (event.keyCode != 32 && event.charCode != 32) {
        if ($('input').val() == vm.wordBank[vm.onWord].substring(0, $('input').val().length)) {
          vm.correctChars += 1;
          $('input').css("background", "white");
        } else {
          vm.incorrectChars += 1;
          $('input').css("background", "red");
        }
      }
    }

    vm.refresh = function() {
      vm.onWord = 0;
      vm.onChar = 0;
      vm.correctWords = [];
      vm.incorrectWords = [];
      vm.correctChars = 0;
      vm.incorrectChars = 0;
      vm.counter = 60;
      stopTimer();
      vm.wordsPerMinute = 0;
      vm.gameOver = false;

      $('input').css('background', 'white')
      $('input').removeAttr('disabled');
      $('input').val('');
      $('input').focus();
      $('.word-list').css('top', '5px');
      vm.wordBank = WordsService.refresh(vm.wordBank);
      $('.panel-words').slideDown();
    }

    vm.store = function() {
      var data = {name: vm.name, wpm: vm.wordsPerMinute};
      console.log(data);

      ScoresService.store(data)
        .then(function(response) {
          console.log(response);
          if (response.success) {
            console.log(response.data);
            vm.gameOver = false;
          }
        });
    }

    $(document).on('keydown', function(event) {
      if (event.which === 8 && !$(event.target).is('input', 'textarea')) {
        event.preventDefault();
      }
    });
  }

  angular
    .module('Type', ['ui.router'])
    .config([
      '$stateProvider',
      config
    ])
    .controller('TypeController', [
      'words',
      'WordsService',
      '$timeout',
      'ScoresService',
      typeController
    ]);
}

module.exports = type();

},{}]},{},[1]);
