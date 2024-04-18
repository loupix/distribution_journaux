'use strict';

myApp.controller("adminAccueilCtrl", ['$scope', '$rootScope','$timeout', 'clientService', 'commandeService', 'promotionService', 
	function($scope, $rootScope, $timeout, $clientService, $commandeService, $promotionService){
		
		$scope.promotions = [];
		$scope.clients = [];

		$scope.promotion = {
			entreprise:"",
			reduction:{
				montant:0,
				percent:0
			},valide:true
		};

		$promotionService.getAll().then(function(promotions){
			$scope.promotions = angular.copy(promotions);
		}, function(err){
			console.warn(err);
			toastr.error(err.statusText);
		});


		$clientService.getAll().then(function(clients){
			$scope.clients = angular.copy(clients);
		}, function(err){
			console.warn(err);
			toastr.error(err.statusText);
		});


		$scope.addProm = function(){
			$promotionService.add($scope.promotion).then(function(prom){
				$scope.promotions.push(prom);
				$scope.promotion = {
					entreprise:"",
					reduction:{
						montant:0,
						percent:0
					},valide:true
				};
			}, function(err){
				console.warn(err);
				toastr.error(err.statusText);
			});
		};



		$scope.delProm = function(prom){
			$promotionService.delete(prom).then(function(data){
				var idx = $scope.promotions.indexOf(prom);
				if(idx !== -1)
					$scope.promotions.splice(idx, 1);
			}, function(err){
				console.warn(err);
				toastr.error(err.statusText);
			});
		};



		$scope.modifProm = function(prom){

			$scope.promotion.entreprise = prom.entreprise;
			$scope.promotion.reduction = prom.reduction;

			$promotionService.modif($scope.promotion).then(function(newProm){
				var idx = $scope.promotions.indexOf(prom);
				if(idx !== -1)
					$scope.promotions[idx] = angular.copy(newProm);

				$scope.promotion = {
					entreprise:"",
					reduction:{
						montant:0,
						percent:0
					},valide:true
				};
			}, function(err){
				console.warn(err);
				toastr.error(err.statusText);
			});
		};




}]);