'use strict';

myApp.directive('d3Map', ['$timeout','$window', function($timeout, $window) {
	return {
		restrict: 'A',
		scope: {
			map: '@',
			cities: '@',
			regions: '=',
			zonesData: '=',
			width: '@',
			height: '@',
			ctrlAjout : '=',
			ctrlRemove : '=',
			ctrlAjoutMulti : '=',
			ctrlRemoveMulti : '=',
			ctrlRegionActif : '='
		},
		link: function(scope, ele, attrs) {


			// Valeurs par défault


			var margin = {top: 0, right:0 , bottom: 0, left: 0},
			width = d3.select(ele[0]).node().offsetWidth,
			width = scope.width===undefined ? width : scope.width,
			width = width - margin.left - margin.right,
			height = scope.height===undefined ? 2000 : scope.height,
			height = height - margin.top - margin.bottom,
			map = scope.map===undefined ? "Luxembourg.svg" : scope.map,
			cities = scope.cities===undefined ? "Commune.tsv" : scope.cities,
			regions = scope.regions===undefined ? new Array() : scope.regions;

			scope.data = null;
			scope.zonesData =  new Array();
			scope.paths = new Array();

			var colorCentre = "#5d2491", colorSud="#c01a2c", colorEst="#3871c2", colorNord = "#fbbd13";


			width = d3.select(ele[0]).node().offsetWidth;


			var svg = d3.select(ele[0]).append("svg").attr("width", width).attr("height", height);

			var formatNumber = d3.format(".1f");



			window.addEventListener("resize", function(){
				width = d3.select(ele[0]).node().offsetWidth;
				svg.attr("width", width);
				d3.select("g").remove();
				scope.render(scope.map);
			});




			scope.$watch('map', function(newData, oldValue) {
				scope.render(newData);
			}, true);






			scope.$watch('cities', function(newData, oldValue) {
				scope.loadFile(newData);
			}, true);


































			scope.$watch('regions', function(newData, oldValue) {
				var zoneRemoves = new Array();
				var zoneAjouts = new Array();
				scope.regions = angular.copy(newData);
				var zonesDeja = angular.copy(scope.zonesData);

				if(oldValue === undefined)
					oldValue = new Array();


				scope.paths.forEach(function(path){

					var id = path.attr("id");
					var data = scope.data[id];

					var idxZone = zonesDeja.map(function(z){return z['Ville'];}).indexOf(data['Ville']);

					if(scope.regions.indexOf('national') !== -1 && idxZone === -1){
						zonesDeja.push(data);
						zoneAjouts.push(data);
					}else if(scope.regions.indexOf(data['region']) !== -1 && idxZone === -1){
						zonesDeja.push(data);
						zoneAjouts.push(data);
					}else if(oldValue.indexOf(data['region']) !== -1 && scope.regions.indexOf(data['region']) === -1 && idxZone !== -1){
						zonesDeja.splice(idxZone, 1);
						zoneRemoves.push(data);
					};
				});


				scope.paths.forEach(function(p){
					var id = p.attr("id");
					var data = scope.data[id];

					if(zonesDeja.length > 0){

						// Zones sélectionner

						if(zonesDeja.map(function(z){return z['Ville'];}).indexOf(data['Ville']) !== -1){
							p.attr("class","pathActive");
							if(data['region']=="Centre / zentrum")
								p.attr("fill", colorCentre);
							else if(data['region']=="Est / osten")
								p.attr("fill", colorEst);
							else if(data['region']=="Sud / suden")
								p.attr("fill", colorSud);
							else if(data['region']=="Nord / norden")
								p.attr("fill", colorNord);
						}else{
							p.attr("fill", "white").attr("class","pathRegion");

						}
					}
				});

				// scope.zonesData = angular.copy(zonesDeja);

				// console.log('regionWatch');
				// console.log(zoneAjouts.length)
				// console.log(zoneRemoves.length)

				// ajouts ou suppression dans données

				if(zoneAjouts.length>0)
					scope.ctrlAjoutMulti(zoneAjouts);
				if(zoneRemoves.length>0)
					scope.ctrlRemoveMulti(zoneRemoves);


			}, true);































			scope.$watch('zonesData', function(newData, oldValue) {
				// console.log(oldValue);
				// console.log(newData);
				// console.log(scope.zonesDataData);

				$timeout(function(){

					var zonesDeja = angular.copy(newData);


					// scope.paths.forEach(function(path){

					// 	var id = path.attr("id");
					// 	var data = scope.data[id];

					// 	if(scope.regions.indexOf('national') !== -1 && scope.zonesData.indexOf(data) === -1){
					// 		// pas dans les zones et national
					// 		scope.zonesData.push(data);
					// 	}else if(scope.regions.indexOf(data['region']) !== -1 && scope.zonesData.indexOf(data) === -1){
					// 		// pas dans les zones et dans la region
					// 		scope.zonesData.push(data);
					// 	}else if(oldValue.indexOf(data['region']) !== -1 && scope.zonesData.indexOf(data) !== -1){
					// 		var idx = scope.zonesData.indexOf(data);
					// 		if(idx !== -1){
					// 			scope.zonesData.splice(idx, 1);
					// 		}
					// 	};
					// });


					// Couleur des zones
					scope.paths.forEach(function(p){
						var id = p.attr("id");
						var data = scope.data[id];
						if(zonesDeja.length > 0){
							if(zonesDeja.map(function(z){return z['Ville'];}).indexOf(data['Ville']) !== -1){

								p.attr("class","pathActive");
								if(data['region']=="Centre / zentrum")
									p.attr("fill", colorCentre);
								else if(data['region']=="Est / osten")
									p.attr("fill", colorEst);
								else if(data['region']=="Sud / suden")
									p.attr("fill", colorSud);
								else if(data['region']=="Nord / norden")
									p.attr("fill", colorNord);
							}else{
								p.attr("fill", "white").attr("class","pathRegion");
							}
						}else{
							p.attr("fill", "white").attr("class","pathRegion");
						}
					});



					// Recherche de régions Entierement Actives

					var regions = new Array("Centre / zentrum", "Est / osten", "Sud / suden", "Nord / norden");

					regions.forEach(function(reg){
						var nb = scope.paths.filter(function(path){
							var id = path.attr("id");
							var data = scope.data[id];
							return data['region'] == reg;
						}).length;

						var nbActif = zonesDeja.filter(function(zone){
							return zone['region'] == reg;
						}).length;

						// console.log(reg);
						// console.log(nb);
						// console.log(nbActif);

						if(nb == nbActif && nb>0 && nbActif>0)
							scope.ctrlRegionActif(reg);
					});


					scope.zonesData = angular.copy(zonesDeja);
				}, 200);




			}, true);














































			scope.render = function(map) {

				if(map === undefined) return;


				var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")").attr("class", "map");
				$timeout(function(){
					d3.xml(map).mimeType("image/svg+xml").get(function(error, doc){
						if(error) console.warn(error);

						var elts = Array.from(doc.getElementsByTagName("path"));
						elts = elts.filter(function(p){return p.getAttribute("id").substr(0, 4) != "path";})
						var pathCoords = new Array();

						// Création des elements / Paths
						for(var i=0;i<elts.length;i++){
							var d = elts[i].getAttribute("d"),
								id = elts[i].getAttribute("id");
							var path = g.append("path").attr("d", d).attr("fill","white").classed("top", false)
								.attr("stroke-width", 2).attr("stroke", "black").attr("id", id).attr("class","pathRegion");
							var region = scope.data[id];
							scope.paths.push(path);
							// choix des zones 

							if(scope.regions.length>0 && region !== undefined){
								scope.paths.forEach(function(path){

									var id = path.attr("id");
									var data = scope.data[id];

									if(scope.regions.indexOf('national') !== -1 && scope.zonesData.indexOf(data) === -1){
										scope.zonesData.push(data);
									}else if(scope.regions.indexOf(data['region']) !== -1 && scope.zonesData.indexOf(data) === -1){
										scope.zonesData.push(data);
									};
								});
								
							}





							// Valide la sélection / zones


							// if(scope.zonesData.length > 0 && region !== undefined){

							// 	if(scope.zonesData.indexOf(region) !== -1){
							// 		path.attr("class","pathActive");

							// 		if(region['region']=="Centre / zentrum")
							// 			path.attr("fill", colorCentre);
							// 		else if(region['region']=="Est / osten")
							// 			path.attr("fill", colorEst);
							// 		else if(region['region']=="Sud / suden")
							// 			path.attr("fill", colorSud);
							// 		else if(region['region']=="Nord / norden")
							// 			path.attr("fill", colorNord);
							// 	}
							// }
							var box = path.node().getBBox();
							pathCoords.push(box);
							var center = {'x':box['x']+box['width']/2, 'y':box['y']+box['height']/2,};
							path.append("circle").attr("cx",center['x']).attr("cy",center['y']).attr("r","4px")
								.attr("fill", "black")
								.classed("top", true);

						}


						// Recherche de régions Entierement Actives

						var regions = new Array("Centre / zentrum", "Est / osten", "Sud / suden", "Nord / norden");
						regions.forEach(function(reg){
							var nb = scope.paths.filter(function(path){
								var id = path.attr("id");
								var data = scope.data[id];
								return data['region'] == reg;
							}).length;
							var nbActif = scope.zonesData.filter(function(zone){
								return zone['region'] == reg;
							});
							if(nb == nbActif)
								scope.ctrlRegionActif(reg);
						});


						// Translation du SVG au min des axes -0.5 %

						var minY = d3.min(pathCoords.map(function(p){
							return p['y'];
						}));

						var minX = d3.min(pathCoords.map(function(p){
							return p['x'];
						}));

						g.attr("transform","translate("+minX*1.1+",-"+minY*0.1+") scale(0.95,1)");


						// Positionnement du cadre à +20 %

						var maxY = d3.max(pathCoords.map(function(p){
							return p['y']+p['height'];
						}));

						var maxX = d3.max(pathCoords.map(function(p){
							return p['x']+p['width'];
						}));


						var rect = g.append("rect").attr("x", maxX*0.8).attr("y", maxY/5)
							.attr("width", maxX*0.4).attr("height", maxY*0.2)
							.attr("stroke", "grey")
							.attr("fill", "none")
							.attr("rx", "8")
							.attr("ry", "8")
							.attr("stroke-width",3);


						// Ligne liant le cadre & le path

						var line = g.append("line").attr("x1", center['x']).attr("y1", center['y'])	
							.attr("x2", rect.attr('x')).attr("y2", parseInt(rect.attr('y'))+parseInt(rect.attr('height')/2))
							.attr("stroke-width",3).attr("stroke", "grey");
							// .attr("transform", function(d, i) { return "scale(" + (1 - d / 25) * 20 + ")"; });



						var data = angular.copy(region);
						// Gestion du texte dans le cadre
						var x = parseInt(rect.attr("x")), y=parseInt(rect.attr("y")),
							w = parseInt(rect.attr("width")), h = parseInt(rect.attr("height"));
						var ville = g.append("text").attr("x", x+15).attr("y", y+35)
							.attr("font-size", "30px")
							.text(data['Ville']).attr("fill", "black");
						var region = g.append("text").attr("x", x+15).attr("y", y+65)
							.attr("font-size", "20px")
							.text(data['region']).attr("fill", "black");
						var brut = g.append("text").attr("x", x+15).attr("y", y+105)
							.attr("font-size", "30px")
							.text(data['brut']).attr("fill", "black");
						var net = g.append("text").attr("x", x+15).attr("y", y+135)
							.attr("font-size", "30px")
							.text(data['net']).attr("fill", "black");

						if(data['region']=="Centre / zentrum")
							region.attr("fill", colorCentre);
						else if(data['region']=="Est / osten")
							region.attr("fill", colorEst);
						else if(data['region']=="Sud / suden")
							region.attr("fill", colorSud);
						else if(data['region']=="Nord / norden")
							region.attr("fill", colorNord);

							


						// Association des datas






						// Gestion de la souris

						g.selectAll("path")
							.on("mouseover", function(d, i){
								d3.select(this).attr("fill","orange");
								var circle = d3.select(this).select("circle");
								line.attr("x1", circle.attr("cx")).attr("y1", circle.attr("cy"));
								var id = d3.select(this).attr("id");
								var txt = "";

								if(Object.keys(scope.data).indexOf(id) !== -1){
									var d = scope.data[id];
									var villeName = d['Ville'].replace("_"," ");
									villeName = villeName[0].toUpperCase() + villeName.substr(1);

									ville.text(villeName);
									region.text(d['region']);
									brut.text("Brut : "+d['brut']);
									net.text("Net : "+d['net']);
									if(d['region']=="Centre / zentrum")
										d3.select(this).attr("fill", colorCentre);
									else if(d['region']=="Est / osten")
										d3.select(this).attr("fill", colorEst);
									else if(d['region']=="Sud / suden")
										d3.select(this).attr("fill", colorSud);
									else if(d['region']=="Nord / norden")
										d3.select(this).attr("fill", colorNord);

									// Couleur du texte Région

									if(d['region']=="Centre / zentrum")
										region.attr("fill", colorCentre);
									else if(d['region']=="Est / osten")
										region.attr("fill", colorEst);
									else if(d['region']=="Sud / suden")
										region.attr("fill", colorSud);
									else if(d['region']=="Nord / norden")
										region.attr("fill", colorNord);
								}else{
									ville.text(id);
									region.text("");
									brut.text("");
									net.text("");
								}
							})
							.on("mouseout", function(d, i){
								if(d3.select(this).attr("class") != "pathActive")
									d3.select(this).attr("fill","white");
							})
							.on("click", function(d, i){
								var id = d3.select(this).attr("id");
								var data = scope.data[id];


								if(d3.select(this).attr("class") == "pathActive"){
									scope.ctrlRemove(data, true);
									d3.select(this).attr("class", "pathRegion").attr("fill", "white");
								}else{
									scope.ctrlAjout(data);
									d3.select(this).attr("class", "pathActive");

									if(data['region']=="Centre / zentrum")
										d3.select(this).attr("fill", colorCentre);
									else if(data['region']=="Est / osten")
										d3.select(this).attr("fill", colorEst);
									else if(data['region']=="Sud / suden")
										d3.select(this).attr("fill", colorSud);
									else if(data['region']=="Nord / norden")
										d3.select(this).attr("fill", colorNord);
								}



							});

					});
				}, 0);


			};



			scope.loadFile = function(file){
				d3.csv(file, function(data){
					scope.data = {};
					data.forEach(function(d){
						scope.data[d['Ville']] = d;
					});
				});
			}
		}
	}
}]);