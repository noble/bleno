/* jshint loopfunc: true */
var events = require('events');

var debug = require('debug')('blenoslave');
var WebSocket = require('ws');

var bleno = require('./index');

var serverMode = !process.argv[2];
var port = 0xB1f;
var host = process.argv[2];


var ws;
var wss;

if (serverMode) {
  debug('bleno - ws slave - server mode');
  wss = new WebSocket.Server({
    port: 0xB1f
  });

  wss.on('connection', function(ws_) {
    debug('ws -> connection');

    ws = ws_;

    sendEvent({
      type: 'stateChange',
      state: bleno.state
    });

    ws.on('message', onMessage);

    ws.on('close', function() {
      debug('ws -> close');

      bleno.stopAdvertising();
    });
  });
} else {
  ws = new WebSocket('ws://' + host + ':' + port);

  ws.on('open', function() {
    debug('ws -> open');
  });

  ws.on('message', function(message) {
    onMessage(message);
  });

  ws.on('close', function() {
    debug('ws -> close');

    bleno.stopAdvertising();
  });
}

var peripherals = {};

// TODO: open/close ws on state change

function sendEvent(event) {
  var message = JSON.stringify(event);

  debug('ws -> send: ' + message);

  var clients = serverMode ? wss.clients : [ws];

  for (var i = 0; i < clients.length; i++) {
    clients[i].send(message);
  }
}

var onMessage = function(message) {
  debug('ws -> message: ' + message);

  var command = JSON.parse(message);
  
  var action = command.action;
  var name = command.name;
  var serviceUuids = command.serviceUuids;
  var data = command.data ? new Buffer(command.data, 'hex') : null;
  var advertisementData = command.advertisementData ? new Buffer(command.advertisementData, 'hex') : null;
  var scanData = command.scanData ? new Buffer(command.scanData, 'hex') : null;

  //todo, deserialize services properly
  var services = command.services;

  if (action === 'disconnect') {
    bleno.disconnect();
  } else if (action === 'startAdvertising') {
    bleno.startAdvertising(name, serviceUuids);
  } else if (action === 'startAdvertisingIBeacon') {
    bleno.startAdvertisingIBeacon(data);
  } else if (action === 'startAdvertisingWithEIRData') {
    bleno.startAdvertisingWithEIRData(advertisementData, scanData);
  } else if (action === 'stopAdvertising') {
    bleno.stopAdvertising();
  } else if (action === 'setServices') {
    bleno.setServices(services);
  } else if (action === 'updateRssi') {
    bleno.updateRssi();
  }
};

bleno.on('addressChange', function(clientAddress){
  sendEvent({
    type: 'addressChange',
    clientAddress: clientAddress
  });
});

bleno.on('advertisingStart', function(error){
  sendEvent({
    type: 'advertisingStart',
    error: error
  });
});

bleno.on('advertisingStartError', function(error){
  sendEvent({
    type: 'advertisingStartError',
    error: error
  });
});

bleno.on('advertisingStop', function(){
  sendEvent({
    type: 'advertisingStop'
  });
});

bleno.on('servicesSet', function(error){
  sendEvent({
    type: 'servicesSet',
    error: error
  });
});

bleno.on('servicesSetError', function(error){
  sendEvent({
    type: 'servicesSetError',
    error: error
  });
});

bleno.on('accept', function(clientAddress){
  sendEvent({
    type: 'accept',
    clientAddress: clientAddress
  });
});

bleno.on('disconnect', function(clientAddress){
  sendEvent({
    type: 'disconnect',
    clientAddress: clientAddress
  });
});

bleno.on('rssiUpdate', function(rssi){
  sendEvent({
    type: 'rssiUpdate',
    rssi: rssi
  });
});
