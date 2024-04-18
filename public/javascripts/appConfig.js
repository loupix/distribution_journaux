'use strict';



var myApp = angular.module("distralsa", ['ngAnimate','ngResource', 'ngRoute', 'ngDialog', 
		'ngMaterial', 'ngCookies', 'ngSanitize', 'ngCsv', 'client.services', 'commande.services', 'paiement.services', 'promotion.services']);


myApp.config(['$httpProvider', function($httpProvider) {
	$httpProvider.defaults.headers.common["X-Requested-With"] =  'XMLHttpRequest';
	$httpProvider.defaults.headers.common["Content-Type"] =  'application/json';

	if (!$httpProvider.defaults.headers.get)
        $httpProvider.defaults.headers.get = {};

	$httpProvider.defaults.headers.get['If-Modified-Since'] = '0';
	$httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.get['Pragma'] = 'no-cache';


}]);



myApp.config(['$mdAriaProvider', function($mdAriaProvider) {
   // Globally disables all ARIA warnings.
   $mdAriaProvider.disableWarnings();
}]);



myApp.config(function($mdIconProvider) {
	$mdIconProvider
		.iconSet("call", 'icons/sets/communication-icons.svg', 24)
		.iconSet("social", 'icons/sets/social-icons.svg', 24);
});





myApp.run(function($rootScope, $templateCache, $location, $document, clientService, commandeService) {

	$rootScope.loading =  false;
	$rootScope.event =  false;
	$rootScope.next =  false;
	$rootScope.drapeau =  "svg/fr.svg";
	$rootScope.lang =  "fr";
	$rootScope.langData =  [];
	$rootScope.current =  false;
	$rootScope.msie=false;


	clientService.loadLang().then(function(data){
		$rootScope.langData = data.langs;
		$rootScope.lang = data.client.lang;
	}, function(err){
		console.warn(err);
		toastr.error(err.statusText);
	});

	$rootScope.$on("$locationChangeStart", function(event, next, current) {
		$rootScope.loading = true;
		var hostName = $location.protocol()+"://"+$location.host()+"/";

		$rootScope.event = event;
		$rootScope.next = next.replace(hostName, "");
		$rootScope.current = current.replace(hostName, "");

		$rootScope.next = $rootScope.next == "" ? "accueil" : $rootScope.next;
		$rootScope.current = $rootScope.current == "" ? "accueil" : $rootScope.current;


	});


	$rootScope.$on('$viewContentLoaded', function() {
		$templateCache.removeAll();
		$rootScope.loading = false;
	});


	$rootScope.go = function (path) {
		$location.path(path);
	};


	var originatorEv;
	$rootScope.openMenu = function($mdMenu, ev) {
      originatorEv = ev;
      $mdMenu.open(ev);
    };



    $rootScope.changeLang = function(ev, lang){

    	$rootScope.lang = lang;

    	clientService.changeLang(lang).then(function(data){
    		$rootScope.langData = data.langs;
    		$rootScope.lang = data.client.lang;
    	}, function(err){
    		console.warn(err);
    		toastr.error(err.statusText);
    	})
    }


    // Detection IE
    var ua = navigator.userAgent;
    var is_ie = ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1;
    if(is_ie)
    	$rootScope.msie=true;
    

});




myApp.config(function($routeProvider, $locationProvider) {
	$routeProvider
		.when("/accueil", {
			templateUrl:"/accueil",
			controller:"accueilCtrl",
			cache: true
		})
		.when("/commande", {
			templateUrl:"/commande",
			controller:"commandeCtrl",
			cache: true
		})
		.when("/paiement", {
			templateUrl:"/paiement",
			controller:"paiementCtrl",
			cache: true
		})
		.when("/reglement", {
			templateUrl:"/reglement",
			controller:"reglementCtrl",
			cache: true
		})
		.when("/validation", {
			templateUrl:"/validation",
			controller:"validationCtrl",
			cache: true
		})
		.otherwise({
			redirectTo: "/accueil"
		});

	$routeProvider
		.when("/admin", {
			templateUrl:"/admin",
			controller:"adminCtrl",
			cache: true
		})

		.when("/admin/index", {
			templateUrl:"/admin/index",
			controller:"adminAccueilCtrl",
			cache: true
		});


	$locationProvider
		.html5Mode(true)
		.hashPrefix('!');

});