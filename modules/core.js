var config = {serialport: "/dev/ttyACM0", baudrate: 115200},	
	iserialport = require("serialport"),
	iSerialPort = iserialport.SerialPort, // Serial Port - Localize object constructor
	spCBAfterOpen = undefined,
	sp = undefined,
	spFlagInit = false,
	osFlagAssigned = false;

var stream = require('stream'),
	inputStream = new stream.Stream(),
	outputStream = new stream.Stream();

inputStream.writable = true;

var util = require('util'),
	eventemitter = require('events').EventEmitter;
	
//------------------------------------------------------------------
// event emitter
//------------------------------------------------------------------
var EvntClass = function() {

	//var eventemit = EVTClass();
	if(!(this instanceof arguments.callee)) {
		console.log("Create EvntClass and return object!");
		return new arguments.callee();
	}
	console.log("EVTClass object.");
}
util.inherits(EvntClass, eventemitter);
var evnt = EvntClass();

//------------------------------------------------------------------
// register event emitter functions
//------------------------------------------------------------------
evnt.on('sendGCodeBlockData', sendGCodeBlockData);

//------------------------------------------------------------------
// class definition
//------------------------------------------------------------------
var GCodeDataClass = function() {

	if(!(this instanceof arguments.callee)) {
		console.log("Create GCodeDataClass and return object!");
		return new arguments.callee();
	}
	console.log("GCodeDataClass object.");

	//this.filepath = "";
	this.linescounter = 0;
	//this.totalcounter = 0;
	//this.jobpercent = 0.0;
	//this.readablestream;
    this.array_block = [];
    this.array_strbuffer = "";

	this.sp_queue_total = 0;
	this.sp_queue_current = 0;	
}
var gcodedata = GCodeDataClass();

//------------------------------------------------------------------
// public functions
//------------------------------------------------------------------
function spSetConfig (iconfig) {

	// verify and updates config
	verifyUpdateConfig(iconfig);
};

function spInitialize (iconfig) {

	// verify if object was already initialized
	if (sp !== undefined)
		return sp;

	// verify and updates config
	if (typeof iconfig === 'object')
		verifyUpdateConfig(iconfig);

	// SerialPort object initializationconsole
	sp = new iSerialPort(config.serialport, {
	    baudrate: config.baudrate,
	    parser: iserialport.parsers.readline("\n")
	});

	// Register Serial Port RX callback
	sp.on("data", function (data) {
	   //console.log("[Board_TX]->[Node.JS_RX]: %s\r\n", data);
	   	
	   	if (data.indexOf("ok") != -1) {
			// send event to trigger sendGCodeBlockData(..) function
			evnt.emit('sendGCodeBlockData', gcodedata);
			if (osFlagAssigned == true)
				outputStream.write('<-'+data+'\r\n', 'utf8');
		}
	});

	// register serial port on.open callback
	sp.on('open', function(err) {
    if ( !err )
    	spFlagInit = true;
        console.log("Serial Port %s Connected at %d bps!", config.serialport, config.baudrate);

        if (spCBAfterOpen !== undefined) {
        	console.log("Launching SerialPort After Open callback...");
        	spCBAfterOpen();
        }
        else {
        	console.log("No SerialPort After Open callback defined!");
        }
	});
};

function spWrite (cmd) {
	
	if (cmd === undefined || cmd.length == 0)
		return false;
	
	// verifiy if cmd last char equals to '\n'
	var endchar = '';
	if (cmd.charAt(cmd.length-1) != '\n')
		endchar = '\n';

	console.log('->'+cmd+endchar);

	// writes data to serialport
	sp.write(cmd+endchar);

	return true;
};


//------------------------------------------------------------------
// getters/setters functions
//------------------------------------------------------------------
function spSetCbAfterOpen (cbfunc) {
	spCBAfterOpen = cbfunc;
};

function spSetCallback (cbfunc) {
	// Register (additional) Serial Port RX callback
	sp.on("data", cbfunc);
};

function setOutputStream (iOutputStream) {
	outputStream = iOutputStream;
	osFlagAssigned = true;
}

//------------------------------------------------------------------
// private functions
//------------------------------------------------------------------
function verifyUpdateConfig (iconfig) {

	console.log("verifyUpdateConfig();");
	if (typeof iconfig === 'object' && iconfig.serialport !== undefined && iconfig.serialport !== undefined) {
		
		console.log('Config SerialPort: '+iconfig.serialport);
		config.serialport = iconfig.serialport;
	}
	if (typeof iconfig === 'object' && iconfig.baudrate  !== undefined && iconfig.baudrate !== undefined) {
		
		console.log('Config BaudRate: '+iconfig.baudrate);	
		config.baudrate = iconfig.baudrate;
	}
	console.log('Serial Port initialization: %s, %d ...', config.serialport ,config.baudrate);
};

inputStream.write = function (data) {

  	//console.log(data);

  	// split stream 'raw' data into string lines (array)
	internalcounter = (data.match(/\n/g)||[]).length;
	gcodedata.linescounter += internalcounter;
	//igcodedata.jobpercent = (igcodedata.linescounter/igcodedata.totalcounter)*100.0;
	//console.log(igcodedata.jobpercent.toFixed(3)+'\%\r\n');

	gcodedata.array_block = data.split("\n");
	if (gcodedata.array_block.length > 0)
		gcodedata.array_block[0] = gcodedata.array_strbuffer + gcodedata.array_block[0];

	gcodedata.array_strbuffer = "";
	if (gcodedata.array_block.length > 1) {
		gcodedata.array_strbuffer = gcodedata.array_block[gcodedata.array_block.length - 1];
		gcodedata.array_block.splice(gcodedata.array_block.length - 1);
	}

	gcodedata.sp_queue_total = gcodedata.array_block.length,
	gcodedata.sp_queue_current = 0;

	/*
	for (var i=0; i<gcodedata.array_block.length; i++) {
		console.log("[%d]=%s", i, gcodedata.array_block[i]);
	} */

	// send event to trigger sendGCodeBlockData(..) function 
	evnt.emit('sendGCodeBlockData', gcodedata);

  	//return true // true means 'yes i am ready for more data now'
  	// OR return false and emit('drain') when ready later	
	return false;
};

inputStream.end = function (data) {
  // no more writes after end
  // emit "close" (optional)
  console.log("inputStream END!");
  this.emit('close');
};

// event emit function
function sendGCodeBlockData (igcodedata) {

	//console.log("sendGCodeBlockData");

	// checks if all queue lines were sent
	if (igcodedata.sp_queue_current == igcodedata.sp_queue_total) {
	  	igcodedata.sp_queue_total = 0,
	  	igcodedata.sp_queue_current = 0;	
	  	//console.log('GCode ReadStream Resume\r\n');
	  	//igcodedata.readablestream.resume();	
	  	inputStream.emit('drain');
	  	return;	
	}

	//console.log(igcodedata.array_block[igcodedata.sp_queue_current]);
	spWrite(igcodedata.array_block[igcodedata.sp_queue_current]);
	igcodedata.sp_queue_current += 1;	

	// normal conditions: serialport (cnc/reprap/3dprinter) will responde 'ok' and sp.on("data"...) is triggered
	// special condition: /dev/null needs to emulate serialport callback (using setTimeout for additional delay)
	if (config.serialport.toUpperCase() === '/DEV/NULL') {

		setTimeout(function () {

			//console.log('SerialPort simulated callback response (/dev/null): ok\r\n');
			// send event to trigger sendGCodeBlockData(..) function
			evnt.emit('sendGCodeBlockData', igcodedata);
			if (osFlagAssigned == true)
				outputStream.write('<-ok\r\n\r\n', 'utf8');
		}, 10 /*250*/);
	}
};

//------------------------------------------------------------------
// export
//------------------------------------------------------------------
module.exports = {
	setConfigPrinter: spSetConfig,
	initializePrinter: spInitialize,
	writePrinter: spWrite,
	setCbPrinterRx: spSetCallback,
	setCbAfterOpenPrinter: spSetCbAfterOpen,
	inputStreamPrinter: inputStream,
	setOutputStreamPrinter: setOutputStream
};
//------------------------------------------------------------------