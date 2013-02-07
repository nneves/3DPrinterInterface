// Core Module Objectives:
// - initialize serial port to communicate with a 3d printer
// - exports a writable stream to receive data for printer 
//   (GCODE data stream, individual GCODE lines or custom commands)
// - exports a readable stream to write responses from printer

var config = {serialport: "/dev/ttyACM0", baudrate: 115200},
	iserialport = require("serialport"),
	iSerialPort = iserialport.SerialPort, // Serial Port - Localize object constructor
	spCBAfterOpen = undefined,
	sp = undefined,
	spFlagInit = false,
	emulatedPrinterResponseTime = 5000;

// module interface stream
var stream = require('stream'),
	iStream = new stream.Stream(),
	oStream = new stream.Stream();

// lower level stream - hardware
var JSONStream = require('json-stream'),
	jsonStream = new JSONStream();

iStream.writable = true;
oStream.readble = true;

// internal auxiliar vars
var array_strbuffer = "";
var lines_counter = 0;
var idcmdlist = [];

//------------------------------------------------------------------
// public functions
//------------------------------------------------------------------
function spSetConfig (iconfig) {

	console.log('[core.js]:Serial Port Set Config: ', JSON.stringify(iconfig));

	// verify and updates config
	verifyUpdateConfig(iconfig);
};

function initialize (iconfig) {

	console.log('[core.js]:initialize: ',JSON.stringify(iconfig));

	// verify if object was already initialized
	if (sp !== undefined)
		return sp;

	// verify and updates config
	if (typeof iconfig === 'object')
		verifyUpdateConfig(iconfig);

	// SerialPort object initializationconsole
	console.log('[core.js]:Instantiate Serial Port object');
	sp = new iSerialPort(config.serialport, {
	    baudrate: config.baudrate,
	    parser: iserialport.parsers.readline("\n")
	});

	// Register Serial Port RX callback
	sp.on("data", spCBResponse);

	// register serial port on.open callback
	sp.on('open', function(err) {
    if ( !err )
    	spFlagInit = true;
        console.log("[core.js]:Serial Port %s Connected at %d bps!", config.serialport, config.baudrate);

        if (spCBAfterOpen !== undefined) {
        	console.log("[core.js]:Launching SerialPort After Open callback...");
        	spCBAfterOpen();
        }
        else {
        	console.log("[core.js]:No SerialPort After Open callback defined!");
        }

        // calling printer emulator initializaion messages when using /dev/null
        emulatePrinterInitMsg();
	});
};

//------------------------------------------------------------------
// getters/setters functions
//------------------------------------------------------------------
function spSetCbAfterOpen (cbfunc) {
	spCBAfterOpen = cbfunc;
};

//------------------------------------------------------------------
// private functions
//------------------------------------------------------------------
function verifyUpdateConfig (iconfig) {

	console.log("[core.js]:verifyUpdateConfig();");
	if (typeof iconfig === 'object' && iconfig.serialport !== undefined && iconfig.serialport !== undefined) {
		
		console.log('[core.js]:Config SerialPort: '+iconfig.serialport);
		config.serialport = iconfig.serialport;
	}
	if (typeof iconfig === 'object' && iconfig.baudrate  !== undefined && iconfig.baudrate !== undefined) {
		
		console.log('[core.js]:Config BaudRate: '+iconfig.baudrate);	
		config.baudrate = iconfig.baudrate;
	}
	console.log('[core.js]:Serial Port initialization: %s, %d ...', config.serialport, config.baudrate);
};

function spWrite (dlines) {
	
	var cmd = dlines.gcode;
	var cmdid = dlines.cmdid;

	if (cmdid === undefined)
		cmid = 0;

	if (cmd === undefined || cmd.length == 0) {
		spCBResponse("empty_cmd\n");
		return false;
	}
	
	// verifiy if cmd last char equals to '\n'
	var endchar = '';
	if (cmd.charAt(cmd.length-1) != '\n')
		endchar = '\n';

	// verify if inline comments are present, if so splits data to recover valid gcode
	var array_cmd = cmd.split(";");
	if (array_cmd.length > 0) {
		//console.log('[core.js]: Removing inline comments');
		cmd = array_cmd[0];

		// check if the command is empty
		if (cmd.trim().length == 0)
			cmd = " G4 P10"; // do nothing for 10 ms
	}

	if (cmdid > 0)
		console.log("[core.js]:spWrite: CMDID[%d]=%s", cmdid, cmd+endchar);
	else
		console.log("[core.js]:spWrite: %s", cmd+endchar);

	// add cmdid to response list
	if (cmdid > 0) {
		console.log("[core.js]:Pushing CMDID=%d to response list", cmdid);
		idcmdlist.push(cmdid);
	}

	// writes data to serialport
	sp.write(cmd.trim()+endchar);

	// normal conditions: serialport (cnc/reprap/3dprinter) will responde 'ok' and sp.on("data"...) is triggered
	// special condition: /dev/null needs to emulate serialport callback (using setTimeout for additional delay)
	if (config.serialport.toUpperCase() === '/DEV/NULL') {

		setTimeout(function () {
			//console.log('[core.js]: SerialPort simulated callback response (/dev/null): ok\r\n');
			spCBResponse("ok\n");

		}, emulatedPrinterResponseTime );
	}

	return true;
};

function spCBResponse (data) {

	// remove \r or \n from response data
	var idata = data.replace(/\r/g, "");
		idata = idata.replace(/\n/g, "");

	//console.log("[core.js]:[Board_TX]->[Node.JS_RX]: %s\r\n", idata);
   	
	if (data.indexOf("ok") != -1) {
		lines_counter--;

		//console.log('[core.js]:JSONSTREAM:countlines ', lines_counter);	

//NOTE: printer temperature data will be triggered in the 'ok' switch
//		{"response":"ok T:18.8 /0.0 B:0.0 /0.0 @:0"}
//		need to implement a special case with regex to test this 
//		specific response and warp it in a {"temperture":idata}; 
		var pattern = /([a-zA-z@]:)/;
		if (pattern.test(idata)) {
			// found temperature response, split data into format:
			// ["ok ", "T:", "131.3 /0.0 ", "B:", "0.0 /0.0 ", "@:", "0"]
			var tempdata = idata.split(pattern);
			var temperature = {
					"T0": tempdata[2].split("/")[0].replace(" ", ""),
					"T1": tempdata[2].split("/")[1].replace(" ", ""),
					"B0": tempdata[4].split("/")[0].replace(" ", ""),
					"B1": tempdata[4].split("/")[1].replace(" ", ""),
					"C": tempdata[6].replace(" ", "")
				};
			var rescmd2 = {"temperature":temperature};
			oStream.emit('data', JSON.stringify(rescmd2)+'\r\n\r\n');			
		}
		else {
			// normal response
			var rescmd = {"response":idata};
			if (idcmdlist.length > 0) {
				rescmd.cmdid = idcmdlist.shift();

				console.log("[core.js]:Adding CMDID=%d to response: %s", rescmd.cmdid, JSON.stringify(rescmd));
			}

			oStream.emit('data', JSON.stringify(rescmd)+'\r\n\r\n');			
		}

		// verify if it can 'drain' the iStream
		if (lines_counter <= 0)
			iStream.emit('drain');
	}
	else if (data.indexOf("invalid_cmd") != -1) {  // future implementation
		lines_counter--;

		var rescmd = {"error":idata};
		oStream.emit('data', JSON.stringify(rescmd)+'\r\n\r\n');		
	}
	else if (data.indexOf("empty_cmd") != -1) {
		lines_counter--;

		var rescmd = {"error":idata};
		oStream.emit('data', JSON.stringify(rescmd)+'\r\n\r\n');		
	}
	else {
		var rescmd = {"printer":idata};
		oStream.emit('data', JSON.stringify(rescmd)+'\r\n\r\n');				
	}

	// TODO: need to map printer initialization/error/temperature/other 
	//       non "ok" messages and send them to the upper layers for status tracking.
};

function emulatePrinterInitMsg () {

	//emulater printer initial messages when unsing /dev/null
	if (config.serialport.toUpperCase() === '/DEV/NULL') {

		setTimeout(function () {
			console.log('[core.js]:emulatePrinterInitMsg\r\n');
			spCBResponse("printer: 3D Printer Initialization Messages\n");
			spCBResponse("printer: Emulated printer is ready!\n");

		}, 1000 );
	}
};

jsonStream.on('data', function (dlines) {
	
	console.log('[core.js]:JSONSTREAM: ', dlines);
 	lines_counter++;
	//console.log('[core.js]:JSONSTREAM:countlines ', lines_counter);	

	//send gcode data to serial port
	spWrite(dlines);
});

iStream.write = function (data) {
    
  	// count number of lines present in the data block
	var internalcounter = (data.match(/\n/g)||[]).length;

	// split stream data into lines of strings (array)
	var array_block = data.split("\n");
	
	// pre-adds previous partial line to the new data
	if (array_block.length > 0)
		array_block[0] = array_strbuffer + array_block[0];

	// test if the last line is an incomplete line, if so 
	// buffers it to be pre-added into the next data block
	array_strbuffer = "";
	if (array_block.length > 1) {
		array_strbuffer = array_block[array_block.length - 1];
		array_block.splice(array_block.length - 1);
	}

	// send each line to the JSON stream
	var cmd;
	for (var i=0; i<array_block.length; i++) {

		// convert string to json to evaluate if it's a JSON command
		try
		{
			//console.log('TRY JSON PARSE');
		   	cmd = JSON.parse(array_block[i]);
		}
		catch(e)
		{
			// got a normal GCODE string, put it in a valid JSON object
			//console.log('CATCH JSON PARSE');
			cmd = {"gcode": array_block[i]};
		}
		//console.log("[core.js]:iStream: emit:data: ", cmd);
		jsonStream.emit('data', cmd);
	}		
  	//return true // true means 'yes i am ready for more data now'
  	// OR return false and emit('drain') when ready later	
	return false;
};

iStream.end = function (data) {
  // no more writes after end
  // emit "close" (optional)
  // console.log("[Core.js]: Close inputStream!");
  this.emit('close');
};

//------------------------------------------------------------------
// export
//------------------------------------------------------------------
module.exports = {
	initialize: initialize,
	setConfigPrinter: spSetConfig,
	setCbAfterOpenPrinter: spSetCbAfterOpen,
	iStreamPrinter: iStream,
	oStreamPrinter: oStream,
	cmdStreamPrinter: jsonStream
};
//------------------------------------------------------------------