'use strict';

angular.module('paiement.services', [])
	.service("paiementService", ['$q', '$http', function($q, $http){

		return{
			get:function(id){
				return $http.post("/api/paiement", {id:id}).then(function(response){
					return $q.when(response.data);
				}, function(err){
					if(err.status==404)
						return $q.reject("non trouvé");
					return $q.reject(err);
				})
			},

			add:function(paiement){
				return $http.put("/api/paiement", {paiement:paiement}).then(function(response){
					return $q.when(response.data);
				}, function(err){
					if(err.status==404)
						return $q.reject("non trouvé");
					return $q.reject(err);
				})
			},

			modif:function(paiement){
				return $http.patch("/api/paiement", {paiement:paiement}).then(function(response){
					return $q.when(response.data);
				}, function(err){
					if(err.status==404)
						return $q.reject("non trouvé");
					return $q.reject(err);
				})
			},

			saveCard:function(card){
				return $http.put("/api/paiement/card", {card:card}).then(function(response){
					return $q.when(response.data);
				}, function(err){
					if(err.status==404)
						return $q.reject("non trouvé");
					return $q.reject(err);
				})
			},


			getCard:function(){
				return $http.post("/api/paiement/card").then(function(response){
					return $q.when(response.data);
				}, function(err){
					if(err.status==404)
						return $q.reject("non trouvé");
					return $q.reject(err);
				})
			},

		}
	}]);