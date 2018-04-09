# rpi-node-temperature-ws
A simple webserver/websocketserver for displaying live temperature sensor readings from multiple i2c sensors (DS18B20) on a rasberry pi

the webserver will display all the temperature sensors you attach to the i2c pins...

requires i2c to be set up for `1-WIRE temperature sensor on GPIO4` on the rasberrypi see* https://github.com/nickolanack/node-rpio-temperature

Also includes (but not implemented completely) the framework for displaying and controlling GPIO as toggle switches - the intention is to display temperature (i2c) as well as switch on and off heaters using other GPIO pins

```

git clone https://github.com/nickolanack/rpi-node-temperature-ws.git
cd rpi-node-temperature-ws
npm install
node index.js

```

modify server.json to change server port and websocket port
modify devices.json to add/alter other gpio pin switches 
