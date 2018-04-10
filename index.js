/**
 * 
 */

var config = require('./server.json');
if (config.serverPort !== false) {

	(function() {

		var Server = require('tinywebjs');
		new Server({
			port: config.serverPort,
			documentRoot: __dirname + '/html/'
		});

	})();
}

if (config.websocketPort !== false) {






	var temperatureSensors={}
	var counter=0;

	var Temperature = require('node-rpio-temperature');
	var wsserver;
	
	
	//(new Temperature.Mock([{device:"000001"}, {device:"000002"}])).on('update', function(sensor) {
	 (new Temperature()).on('update', function(sensor) {
		temperatureSensors[sensor.device]=sensor;
		//console.log(JSON.stringify(sensor));
		counter++;

		wsserver.broadcast('notification.statechange', JSON.stringify(sensor));


	});

	var devices =require('./devices.json');
	



	var wsserver=(new(require('tinywebsocketjs'))({
		port: config.websocketPort
	})).addTask('list_devices', function(options, callback) {

		var additionalDevices=require('./devices.json');
		
		

		callback(Object.keys(temperatureSensors).map(function(sensorId){

			var device=temperatureSensors[sensorId];

			console.log(JSON.stringify(device));

			devices.forEach(function(d, i){
				if(d.device==sensorId){
					additionalDevices.splice(i,1);
					Object.keys(d).forEach(function(k){
						device[k]=d[k];
					});
				}
			});

			return {

				"name":device.name || "Temp: "+device.device,
				"device":sensorId,
				"type":"float",
				"state":device.value,
				"readonly":true
			}

		}).concat(additionalDevices));

	});



}