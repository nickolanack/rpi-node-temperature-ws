/**
 * 
 */

var UIGeneralPurposeIOPanel = new Class({
	Implements: Events,

	initialize: function(element, options) {

		var me = this;
		me.options = Object.append({
			websocket: 'ws://' + window.location.hostname + ':8080'
		}, options);

		var websocket = new WebsocketControlQuery(me.options.websocket).addEvent('connect', function() {

			var getDevices = function(callback) {
				websocket.execute('list_devices', {}, function(response) {
					callback(JSON.parse(response));
				});
			};

			var signalDeviceValue = function(pin, value) {
				websocket.execute('set_device_value', {
					pin: pin,
					value: value
				}, function(response) {
					console.log(response);
				});
			}

			getDevices(function(devices) {

				websocket.addEvent('notification.statechange', function(response) {

					var data = JSON.parse(response);
					Array.each(devices, function(device) {

						if (device.device==data.device||(device.pin&&device.pin === data.pin)) {

							device._suppressEventSignal = true;
							device.control.setValue(data.value);

						}

					});

				});

				var graph;
				var startTime=(new Date()).valueOf();
				var data={};
				var deviceData=function(device){
					var name=device.name||device.device||device.pin;
					return data[name];
				}
				var addGraphHistory=function(device, value){

					var name=device.name||device.device||device.pin;
				
					
					var now=(new Date()).valueOf();
					if(!graph){
						graph=new UIGraph(element.appendChild(new Element('div',{'class':'rms-graph'})), {sets:{}}, {
							title:"",
							height:200,
							width:600,
							padding:14,
							lineColor:'cornflowerblue',
							parseX: function(dataValue, i) {
				                var x=dataValue.x;
				                return (x-startTime)/1000.0;
				            },
				            parseY: function(dataValue, i) {
				                var y= parseFloat(dataValue.y);
				                return y;
				            },
				            lineTemplate: UIGraph.LineTemplate,
				            parseSets:function(dataSet){
				            	var sets=[];
				            	Object.keys(dataSet.sets).forEach(function(k){
				            		sets.push(dataSet.sets[k]);
				            	});
				            	return sets;
				            },
				            parseSetData:function(set){
				            	return set.values;
				            },
				            parseSetOptions:function(set, i){
				            	return set.options;
				            }
						});
					}


					if(!data[name]){
						var index = Object.keys(data).length;
						data[name]={values:[], options:Object.append(([
	            			{
		            			lineColor:"blue"
		            		},{
		            			lineColor:"green"
		            		},{
		            			lineColor:"orange"
		            		},{
		            			lineColor:"magenta"
		            		},{
		            			lineColor:"black"
		            		}
		            	])[index], device.graphOptions||{}), index:index};
					}

					
					var min=now-(1000*100);
					if(startTime<min){
						Object.keys(data).forEach(function(k){
							while(data[k].values.length&&data[k].values[0].x<min){
								data[k].values.shift();
							}
						})
						startTime=min;
					}

					data[name].values.push({x:now, y:value});
					graph.setData({sets:data});
					
					


				}


				var addSwitch=function(device){

					


					var state = device.state;
					addGraphHistory(device, state);

					var container = element.appendChild(new Element('div'));
					var control = new UISwitchControl(container, {
						state: state
					}).addEvent("change", function(newState) {
						if (state != newState) {

							addGraphHistory(device, newState);

							if (!device._suppressEventSignal) {
								signalDeviceValue(device.pin, newState);
							}

							state = newState;
						}

						if (device._suppressEventSignal) {
							// state was set on a notification from server. 
							// it is not necessary to re-signal the state back 
							// to the server and could cause an infinite loop 
							delete device._suppressEventSignal;
						}
					});
					container.appendChild(new Element('label', {
						html: device.name
					}));

					if (device.direction === 'in') {
						control.disable(); //read display only device
					}
					device.control = control;



				}


				var UILabelControl=new Class({
					Implements:[Events],
					initialize:function(container, options){
						var me=this;
						me.element=container.appendChild(new Element('label',{"class":"value"}));
						me.state=options.state;
						me.element.innerHTML=me.state;
						if(options.className){
							me.element.addClass(options.className);
						}

					},
					setValue:function(state){
						var me=this;
						if(me.state!==state){
							me.state=state;
							me.element.innerHTML=me.state;
							me.fireEvent('change', [state]);
						}
						
					},
					setStyle:function(style, value){
						var me=this;
						me.element.setStyle(style, value);
					},
					setAttribute:function(name, value){
						var me=this;
						me.element.setAttribute(name, value);
					}

				})

				var addValueIndicator=function(device){

					

					var state = device.state;
					addGraphHistory(device, state);
					var container = element.appendChild(new Element('div'));
					var control = new UILabelControl(container, {
						state: state,

					}).addEvent("change",function(newState){
						if (state != newState) {

							addGraphHistory(device, newState);
							state = newState;
						}
					});
					control.setAttribute('data-units', device.units||"");
					container.appendChild(new Element('label', {
						html: device.name
					}));
					control.setStyle('color', deviceData(device).options.lineColor);

					device.control = control;

				}


				Array.each(devices, function(device) {

					if(device.type=="bool"){
						if(device.readonly!==true){
							addSwitch(device);
						}else{
							console.error('TODO implement on off indicator');
						}
						return;
					}

					if(device.type=="float"){
						if(device.readonly!==true){
							console.error('TODO implement slider control');
						}else{
							addValueIndicator(device);
						}
						return;
					}


					console.error('TODO unknown device: '+JSON.stringify(device));

					

				});



				websocket.addEvent('disconnect', function() {
					//disable switches while disconnected
					Array.each(devices, function(device) {
						device.control.disable();
					});

				});
				websocket.addEvent('reconnect', function() {
					//enable switches when reconnected
					Array.each(devices, function(device) {
						device.control.enable();
					});

				});

				websocket.addEvent('reconnect', function() {

					//update all devices with current state from request

					getDevices(function(updatedDevices) {
						Array.each(updatedDevices, function(updatedDevice) {
							var state = updatedDevice.state;
							Array.each(devices, function(device) {
								if(device.device==updatedDevice.device||(device.pin&&device.pin === updatedDevice.pin)){
									device._suppressEventSignal = true;
									device.control.setValue(state);
								}

							});

						});
					});

				});

			});

		});

	}
});