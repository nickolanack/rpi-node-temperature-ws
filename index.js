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
	
	
	(new Temperature.Mock([{device:"000001"}, {device:"000002"}])).on('update', function(sensor) {

		temperatureSensors[sensor.device]=sensor;
		console.log(JSON.stringify(sensor));
		counter++;

		wsserver.broadcast('notification.statechange', JSON.stringify({
					"device":sensor.device,
					"value": sensor.value
				}));


	});




	var wsserver=(new(require('tinywebsocketjs'))({
		port: config.websocketPort
	})).addTask('list_devices', function(options, callback) {


		callback(Object.keys(temperatureSensors).map(function(sensor){

			var device=temperatureSensors[sensor];
			return {

				"name":"Temperature: "+sensor,
				"device":sensor,
				"type":"float",
				"state":device.value,
				"readonly":true
			}

		}));

	});



}