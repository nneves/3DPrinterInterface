// mainapp.js -

var config = {},
	downloadr = require('./downloader.js'),
	slicer = require('./slicer.js'),
	printercore = require('./core.js');

//------------------------------------------------------------------
// initialization
//------------------------------------------------------------------
var dl = new downloadr.Downloader(); 

printercore.setCbAfterOpenPrinter(function () { console.log('Printer initialization completed'); });
// try interface without real 3d printer by using /dev/null
printercore.setConfigPrinter({serialport: "/dev/null", baudrate: 115200});
//printercore.setConfigPrinter({serialport: "/dev/tty.usbmodem622", baudrate: 115200}); 
printercore.initializePrinter();

// or (with 3d printer hardware) - alternative init method with args
//printercore.initializePrinter({serialport: "/dev/tty.usbmodem622", baudrate: 115200});

//------------------------------------------------------------------
// public functions
//------------------------------------------------------------------
function writePrinterCmd (data) {
	
	var result = printercore.writePrinter(data);
	return result;
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
	writePrinterCmd: writePrinterCmd
};
//------------------------------------------------------------------
// demo: ...
//downloadUrl('http://www.thingiverse.com/download:101530', __dirname+'/../bin/stl/');