// EXPERIMENTAL:
// Tested with Thrustmaster Firestorm Dual Power 3 Gamepad model
// connected to a Linux OS (Debian) with built-in support for joysticks
// Device gets mounted in /dev/input/js1

// COMPELTED: All buttons can now be mapped to printer functionality via GCODE cmd
// TODO: PADs (analog joysticks) require special implementation to control printer X,Y,Z motors

var configdata; // see module.export: set on require('joystick.js')(configdata);

var fs = require('fs'),
  cmdStreamPrinter,
  oStreamPrinter,
  config = {};

var devicedata = {
    "id": 0,
    "type": "",
    "trigger": false,
    "value0": 0,
    "value1": 0,
    "cursor": 0,
    "percentage": 0.00
  };

var cmdmap = {"list": 
[
  {"id":0,"type":"button","trigger":false,"action":"Extrude","cmd":"G1 E10 F4000"}, 
  {"id":3,"type":"button","trigger":false,"action":"Retract","cmd":"G1 E-10 F4000"},

  {"id":2,"type":"button","trigger":false,"action":"Get Temp.","cmd":"M105"},
  
  {"id":4,"type":"button","trigger":true,"action":"Fan ON","cmd":"M106 255"},
  {"id":5,"type":"button","trigger":true,"action":"Fan OFF","cmd":"M107"},

  {"id":6,"type":"button","trigger":true,"action":"Set Temp. 220º","cmd":"M104 S220"},
  {"id":7,"type":"button","trigger":true,"action":"Set Temp. 0º","cmd":"M104 S0"}
]};

//------------------------------------------------------------------
// initialization
//------------------------------------------------------------------
function initialize (configdata, cmdstreamprinter, ostreamprinter) {

  console.log('[joystick.js]:initizalize: ', JSON.stringify(configdata));

  // assign internal object to reference core.js Streams
  cmdStreamPrinter = cmdstreamprinter;
  oStreamPrinter = ostreamprinter;

  // internal module config
    config.device = 
  configdata.joystick.device !== undefined ?
    configdata.joystick.device :
    '/dev/input/js1'; 

    config.enabled = 
  configdata.joystick.enabled !== undefined ?
    configdata.joystick.enabled :
    false;

    if (config.enabled === true) {

      console.log('[joystick.js]:initizalize: Open Joystick port:', configdata.joystick.device);

    fs.open(config.device, "r", function (err, fd) {
      if (err) throw err;
      var buffer = new Buffer(8);
      
      function startRead () {
        fs.read(fd, buffer, 0, 8, null, function (err, bytesRead) {
          if (err) throw err;
          
          parseData(buffer);
          processData();
          startRead();
        });
      }
      startRead();
    });
  }
}

function parseData (data) {

  devicedata.id = data[7];

  devicedata.value0 = data[4];
  devicedata.value1 = data[5];

  if (devicedata.value0 == 0 && devicedata.value1 == 0)
    devicedata.trigger = false;
  else
    devicedata.trigger = true;

  if (data[6] == 1) {
    devicedata.type = "button";
  }
  else if (data[6] == 2) {
    devicedata.type = "pad";
  }

  var maxval0 = 254;
  var maxval1 = 127;
  var maxcursor = maxval0 + (maxval1 * 255);
  // calculates the pads cursor in percentage
  if (devicedata.value1 >=1 && devicedata.value1 <= 127) {
    // positive quadrante val1 {1,127}
    devicedata.cursor = (devicedata.value0 - 1) + (devicedata.value1 * 255);
    devicedata.percentage = ((devicedata.cursor / maxcursor) * 100.00).toFixed(2);
  }
  else if (devicedata.value1 >=128 && devicedata.value1 <= 254) {
    // negative quadrante val1 {254,128}
    devicedata.cursor = (devicedata.value0-255) + ((devicedata.value1-255) * 255);
    devicedata.percentage = ((devicedata.cursor / maxcursor) * 100.00).toFixed(2);
  }
  else {
    devicedata.cursor = 0;
    devicedata.percentage = 0.00;
  }

  if (devicedata.type !== "") // skip initial buffered data
    console.log("[joystick.js]:deviceEvent: ", JSON.stringify(devicedata));
}

function processData () {

  if (devicedata.type === "") // skip initial buffered data
    return;

  cmdmap.list.forEach(function(element){ 
    
    if (element.type == devicedata.type&&
      element.id == devicedata.id && 
      element.trigger == devicedata.trigger) {

        console.log("[joystick.js]:found joystick matching rule: ", element.action);

        var data = element.cmd;
        var jsoncmd = {"id":getId(), "gcode": data};
        var result = cmdStreamPrinter.emit('data', jsoncmd);
    }
  }); 
}

//------------------------------------------------------------------
// auxiliar funtions
//------------------------------------------------------------------

function getId () {
    return Math.floor((Math.random()*10000)+1);
}
//------------------------------------------------------------------
// export
//------------------------------------------------------------------
module.exports = {
  initialize: initialize
};
//------------------------------------------------------------------
