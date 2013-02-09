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
  config = {},
  queuedcmd = [];

var cmdmap = {"list": 
[
  // button
  {"hwid":0,"type":"button","trigger":true,"action":"Extrude","cmd":"G1 E10 F4000"}, 
  {"hwid":3,"type":"button","trigger":true,"action":"Retract","cmd":"G1 E-10 F4000"},

  {"hwid":1,"type":"button","trigger":true,"action":"Relative Mov. Cmd.","cmd":"G91"},
  {"hwid":2,"type":"button","trigger":true,"action":"Get Temp.","cmd":"M105"},
  
  {"hwid":4,"type":"button","trigger":true,"action":"Fan ON","cmd":"M106 255"},
  {"hwid":5,"type":"button","trigger":true,"action":"Fan OFF","cmd":"M107"},

  {"hwid":6,"type":"button","trigger":true,"action":"Set Temp. 220º","cmd":"M104 S220"},
  {"hwid":7,"type":"button","trigger":true,"action":"Set Temp. 0º","cmd":"M104 S0"},

  {"hwid":8,"type":"button","trigger":true,"action":"Motors OFF","cmd":"M18"},
  {"hwid":9,"type":"button","trigger":true,"action":"Motors ON","cmd":"M17"},

  // pad
  {"hwid":0,"type":"pad","trigger":true,"action":"Pad X","cmd":"G1 X$var1 F$var2"},
  {"hwid":1,"type":"pad","trigger":true,"action":"Pad Y","cmd":"G1 Y$var1 F$var2"}
]};

// response listener stream
var JSONStream = require('json-stream'),
  jsonStream = new JSONStream();

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
      
      // pipe core.js->oStream to a json-stream
      ostreamprinter.pipe(jsonStream);

      function startRead () {
        fs.read(fd, buffer, 0, 8, null, function (err, bytesRead) {
          if (err) throw err;
          
          var pdata = parseData(buffer);
          processData(pdata);
          startRead();
        });
      }
      startRead();
    });
  }
}

function parseData (data) {
  
  var devicedata = {
      "hwid": 0,
      "type": "",
      "trigger": false,
      "value0": 0,
      "value1": 0,
      "cursor": 0,
      "percentage": 0.00,
      "cmdid": 0,
      "cmdgcode": "",
      "inprinting": false
    };

  devicedata.hwid = data[7];

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

  //if (devicedata.type !== "") // skip initial buffered data
  //  console.log("[joystick.js]:deviceEvent: ", JSON.stringify(devicedata));

  return devicedata;
}

function processData (devicedata) {

  if (devicedata.type === "") // skip initial buffered data
    return;

  // special case: PAD trigger=false -> should remove any matching
  // pad entry (inprinting=false) in the queue to avoid REPEAT command
  // and replace the current hwid with -1 to current inprinting=true
  if (devicedata.type === "pad" && devicedata.trigger == false) {
    
    //console.log("[joystick.js]: PAD RESET");

    for (i=queuedcmd.length-1; i>=0; i--) {
      if (queuedcmd[i].hwid == devicedata.hwid &&
          queuedcmd[i].type == devicedata.type) {

        if (queuedcmd[i].inprinting == false) {
          //console.log("[joystick.js]: Removed PAD queued entry to cancel REPEAT: ",
          //  JSON.stringify(queuedcmd[i]));
  
          queuedcmd.splice(i,1);
        }
        else {
          //console.log("[joystick.js]: PAD hwid reset to cancel REPEAT: ",
          //  JSON.stringify(queuedcmd[i]));
  
          queuedcmd[i].hwid = -1;          
        }
      }
    }
  }

  // search for mapped commands
  cmdmap.list.forEach(function(element){ 
    
    if (element.type == devicedata.type &&
      element.hwid == devicedata.hwid && 
      element.trigger == devicedata.trigger) {        

        console.log("[joystick.js]: Found joystick matching rule: ", element.action);

        // before adding the new matching command to the queue, checks if
        // there is any similar command already present in queue but not 
        // yet send to printer, if so replaces that command with the most 
        // recent data to prevent from having extra data in queue
        var updatedcmd = false;
        // reverse queue search - form last to first
        for (i=queuedcmd.length-1; i>=0; i--) {
          if (queuedcmd[i].hwid == devicedata.hwid &&
              queuedcmd[i].type == devicedata.type &&
              queuedcmd[i].trigger == devicedata.trigger &&
              queuedcmd[i].inprinting == false) {

            //console.log("[joystick.js]:found command in queue, replace with new data");

            queuedcmd[i].value0 = devicedata.value0;
            queuedcmd[i].value1 = devicedata.value1;
            queuedcmd[i].cursor = devicedata.cursor;
            queuedcmd[i].percentage = devicedata.percentage;

            // no more processing required, printer response will manage
            // the required triggerQueue();
            return;
          }
        }

        // get cmdid and gcode data
        var cmdid = getId();
        var cmdgcode = element.cmd;
        // insert additional cmdid and cmdgcode into devicedata
        devicedata.cmdid = cmdid;
        devicedata.cmdgcode = cmdgcode;

        // push complete devicedata into queue
        queuedcmd.push(devicedata);
        //console.log("[joystick.js]:pushed command into queue: ", JSON.stringify(devicedata));
        
        // trigger queue processing (manual trigger if queue has only 1 command)
        // additional trigger will be managed by the jsonStream (printer) response
        if (queuedcmd.length == 1){
          //console.log("[joystick.js]:Queue manual trigger command");
          triggerQueue();
        }
    }
  }); 
}

// special function to parse custom joystick PAD commands 
function parseGCode (qcmd) {
  // if button returns the normal cmdgcode property
  if (qcmd.type == "button")
    return qcmd.cmdgcode;

  // cmd.type == "pad"
  var gcode = qcmd.cmdgcode;
  //console.log("[joystick.js]: Parsing original pad gcode cmd: ",gcode);

  var percentvalue = parseFloat(qcmd.percentage);
  var datavalue = percentvalue/10;
  var speedvalue = 500 + Math.abs(Math.round(percentvalue*20));
  
  gcode = gcode.replace(/\$var1/g, datavalue);
  gcode = gcode.replace(/\$var2/g, speedvalue.toFixed(3)); // may need to adjust speed in function of $var1

  console.log("[joystick.js]: Parsed gcode cmd: ",gcode);

  return gcode;

}

function triggerQueue () {

  if (queuedcmd.length > 0) {
    var icmdid = queuedcmd[0].cmdid;
    var icmdgcode = parseGCode(queuedcmd[0]);
    var jsoncmd = {"cmdid":icmdid,"gcode":icmdgcode};
    if (queuedcmd[0].type === "pad") {
      var timesample = (150/100)*Math.abs(Math.round(parseFloat(queuedcmd[0].percentage)));
      // special case: PAD -> delayed printer write
      setTimeout( function () {
        //console.log("[joystick.js]:Sending command from queue: ", JSON.stringify(jsoncmd));
        cmdStreamPrinter.emit('data', jsoncmd);
      },25+timesample);
    }
    else {
      //console.log("[joystick.js]:Sending command from queue: ", JSON.stringify(jsoncmd));
      cmdStreamPrinter.emit('data', jsoncmd);      
      }
    queuedcmd[0].inprinting = true;
  }
  else {
    //console.log("[joystick.js]:error: Trying to send command from empty queue!");
  }
}

function triggerResponse (dlines) {
  
  if (dlines.hasOwnProperty("response") && dlines.hasOwnProperty("cmdid")) {

    var removeindex = -1;
    queuedcmd.forEach(function (value, index, arr) {
      if (value.cmdid === dlines.cmdid) {  
        removeindex = index;
      }
    });

    if (removeindex >= 0) {
        // removing processed command from queue
        var qcmd = queuedcmd.splice(removeindex,1);
        //console.log("[joystick.js]:Found a matching response, removing from queue: ",
        //  JSON.stringify(qcmd));

        // verify if previous qcmd was from a PAD
        // if queue does not have a similar command, resends it to queue for REPEAT functionality       
        if (qcmd[0].type === "pad" && qcmd[0].hwid >= 0) {
          var pad_found = false;
          for (i=0; i<queuedcmd.length; i++) {
            if (queuedcmd[i].type == qcmd[0].type &&
                queuedcmd[i].hwid == qcmd[0].hwid &&
                queuedcmd[i].trigger == qcmd[0].trigger) {  
              pad_found = true;
              break;
            }
          } 
          // found a similar cmd in queue, skiping REPEAT
          if (pad_found) {
            //console.log("[joystick.js]: PAD command already in queue, skiping REPEAT");
          }
          else {
            //console.log("[joystick.js]: Repeat PAD key: ",JSON.stringify(qcmd[0]));
            qcmd[0].cmdid = getId();
            qcmd[0].inprinting = false;
            queuedcmd.push(qcmd[0]);
          }
        }

        // process the next command in queue (from top)
        //console.log("[joystick.js]:Queue AUTO trigger command ");
        triggerQueue();
    }
  }  
}

jsonStream.on('data', function (dlines) {

  //console.log("[joystick.js]:listener: Found message: ", JSON.stringify(dlines));
  triggerResponse(dlines);
});

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