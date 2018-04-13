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



	var fs = require('fs');
	var temperatureSensors = {}
	var counter = 0;

	var Temperature = require('node-rpio-temperature');
	var wsserver;

	var devices = require('./devices.json');

	//(new Temperature.Mock(devices)).on('update', function(sensor) {
	(new Temperature()).on('update', function(sensor) {
		// 
		//sensor.time=(new Date()).valueOf();
		temperatureSensors[sensor.device] = sensor;
		//console.log(JSON.stringify(sensor));
		counter++;

		wsserver.broadcast('notification.statechange', JSON.stringify(sensor));



		fs.appendFile('.history.'+sensor.device + '.json', JSON.stringify({
			"time": (new Date()).valueOf(),
			"value": sensor.value
		}) + ",\n", function(err) {
			if (err) {
				throw err;
			}
			//console.log('Saved!');
		});



	});



	var wsserver = (new(require('tinywebsocketjs'))({
		port: config.websocketPort
	})).addTask('list_devices', function(options, callback) {

		var additionalDevices = JSON.parse(JSON.stringify(devices));

		console.log(JSON.stringify(additionalDevices));


		callback(Object.keys(temperatureSensors).map(function(sensorId) {

			var device = temperatureSensors[sensorId];



			additionalDevices.forEach(function(d, i) {
				if (d.device == sensorId) {
					additionalDevices.splice(i, 1);
					Object.keys(d).forEach(function(k) {
						device[k] = d[k];
					});
				}
			});

			return {

				"name": device.name || "Temp: " + device.device,
				"device": sensorId,
				"type": "float",
				"state": device.value,
				"readonly": true,
				"graphOptions": device.graphOptions || {},
				"units": device.units
			}

		}).concat(additionalDevices));

	}).addTask('device_history', function(options, callback) {

		var additionalDevices = JSON.parse(JSON.stringify(devices));

		console.log(JSON.stringify(additionalDevices));


		callback(Object.keys(temperatureSensors).map(function(sensorId) {

			var device = temperatureSensors[sensorId];



			additionalDevices.forEach(function(d, i) {
				if (d.device == sensorId) {
					additionalDevices.splice(i, 1);
					Object.keys(d).forEach(function(k) {
						device[k] = d[k];
					});
				}
			});

			var file='.history.'+(device.device||device.pin||device.name)+'.json';

			var data=fs.readFileSync(file, 'utf8');

			var values=JSON.parse('['+data.substring(0,data.length-2)+']');
			//console.log('['+data.substring(0,data.length-2)+']');

			return {

				"name": device.name || "Temp: " + device.device,
				"device": sensorId,
				"type": "float",
				"values":values,
				"readonly": true,
				"graphOptions": device.graphOptions || {},
				"units": device.units
			}

		}).concat(additionalDevices));

	});



}