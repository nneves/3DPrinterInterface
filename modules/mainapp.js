// mainapp.js -

var config = {},
	fs = require('fs'),
	readableStream,
	downloadr = require('./downloader.js'),
	slicer = require('./slicer.js'),
	printercore = require('./core.js');

//------------------------------------------------------------------
// initialization
//------------------------------------------------------------------
var dl = new downloadr.Downloader(); 

// for debug purpose only - output core.js oStream data messages
printercore.oStreamPrinter.pipe(process.stdout);

printercore.setCbAfterOpenPrinter(function () { console.log('Printer initialization completed'); });
// try interface without real 3d printer by using /dev/null
printercore.setConfigPrinter({serialport: "/dev/null", baudrate: 115200});
//printercore.setConfigPrinter({serialport: "/dev/tty.usbmodem621", baudrate: 115200});
//printercore.setConfigPrinter({serialport: "/dev/tty.usbmodem622", baudrate: 115200});

// or (with 3d printer hardware) - alternative init method with args
//printercore.initializePrinter({serialport: "/dev/tty.usbmodem622", baudrate: 115200});

printercore.initializePrinter();

//------------------------------------------------------------------
// public functions
//------------------------------------------------------------------
function sendPrinterCmd (data) {
	
	var jsoncmd = {"gcode": data};
	var result = printercore.cmdStreamPrinter.emit('data', jsoncmd);
	//printercore.oStreamPrinter.pipe(process.stdout);

	// inputStream will return false, only after processing data 
	// will the drain even be triggered, only at that time it would return true
	return true;
}

function sendPrinterFilename (filename) {
	
	var path = process.cwd()+'/bin/gcode/'+filename;
	console.log('Send file to printer: %s', path);

	readableStream = fs.createReadStream(path, {'bufferSize': 1 * 256});
	readableStream.setEncoding('utf8');

	// This catches any errors that happen while creating the readable stream (usually invalid names)
	readableStream.on('error', function(err) {
		console.log('Error while trying to sendPrinterFilename: ', err);
		// error triggered asynchronously, need to report back to the origin of the request
	});

	readableStream.pipe(printercore.iStreamPrinter);
	//printercore.oStreamPrinter.pipe(process.stdout);

	// true -> request/call accepted with success, any other errors originated from 
	// the asynchronous requests must be reported to the origin via other channels
	return true; 
}

//------------------------------------------------------------------
// getters/setters functions
//------------------------------------------------------------------
function setConfig (configdata) {
	
	config = configdata;
};

//------------------------------------------------------------------
// private functions
//------------------------------------------------------------------
function downloadUrl (url, destpath) {

	if (url === undefined) {
		console.log('No URL found to download');
		return false;
	}

	if (destpath === undefined) {
		destpath = __dirname+'/../bin/';
		console.log('Setting default download path to: %s', destpath);
	}
	if (destpath.charAt(destpath.length-1) !== '/') {
		console.log('Adding trailling char to download path');
		destpath = destpath + '/';
	}

	dl.set_remote_file(url); 
	dl.set_local_path(destpath); 
	dl.run();	

	console.log('Downloaded file: %s', url);
	return true;
}

//------------------------------------------------------------------
// export
//------------------------------------------------------------------
module.exports = {
	setConfig: setConfig,
	sendPrinterCmd: sendPrinterCmd,
	sendPrinterFilename: sendPrinterFilename,
	outputStreamPrinter: printercore.oStreamPrinter
};
//------------------------------------------------------------------
// demo: ...
//downloadUrl('http://www.thingiverse.com/download:101530', __dirname+'/../bin/stl/');