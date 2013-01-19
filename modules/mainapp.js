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

function initialize (configdata) {

	console.log('[mainapp.js]:initizalize: ', JSON.stringify(configdata));

	// for debug purpose only - output core.js oStream data messages
	printercore.oStreamPrinter.pipe(process.stdout);

	printercore.setCbAfterOpenPrinter(function () { console.log('Printer initialization completed'); });
	// try interface without real 3d printer by using /dev/null
	//printercore.setConfigPrinter({serialport: "/dev/null", baudrate: 115200});
	//printercore.setConfigPrinter({serialport: "/dev/tty.usbmodem621", baudrate: 115200});
	//printercore.setConfigPrinter({serialport: "/dev/tty.usbmodem622", baudrate: 115200});

	// or (with 3d printer hardware) - alternative init method with args
	//printercore.initialize({serialport: "/dev/tty.usbmodem622", baudrate: 115200});

   	var spconfig = {};

   	spconfig.serialport = 
		configdata.serialport.serialport !== undefined ?
    	configdata.serialport.serialport :
		"/dev/null";

	spconfig.baudrate = 
		configdata.serialport.baudrate !== undefined ?
    	configdata.serialport.baudrate :
		115200;

	printercore.initialize(spconfig);
}

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

function sendPrinterData (filename) {
	
	var path = process.cwd()+'/bin/gcode/'+filename;
	console.log('Send file to printer: %s', path);

	readableStream = fs.createReadStream(path, {'bufferSize': 1 * 256});
	readableStream.setEncoding('utf8');

	// This catches any errors that happen while creating the readable stream (usually invalid names)
	readableStream.on('error', function(err) {
		console.log('Error while trying to sendPrinterData: ', err);
		// error triggered asynchronously, need to report back to the origin of the request
	});

	readableStream.pipe(printercore.iStreamPrinter);
	//printercore.oStreamPrinter.pipe(process.stdout);

	// true -> request/call accepted with success, any other errors originated from 
	// the asynchronous requests must be reported to the origin via other channels
	return true; 
}

function getFileList (filetype) {

	var path;
	if (filetype.toUpperCase() === "GCODE")
		path = "/bin/gcode";
	else if (filetype.toUpperCase() === "STL")
		path = "/bin/stl";
	else
		return false;

	listdir(process.cwd()+path, [filetype.toLowerCase()], function (data) {
		
		var jsoncmd;
		if (filetype.toUpperCase() === "GCODE")
			jsoncmd = {"filelistgcode": data};
		else if (filetype.toUpperCase() === "STL")
			jsoncmd = {"fileliststl": data};

		console.log("[mainapp.js]:getFileList:"+path+": ", JSON.stringify(jsoncmd));
		var result = printercore.oStreamPrinter.emit('data', JSON.stringify(jsoncmd)+'\r\n\r\n');
	});        

	// inputStream will return false, only after processing data 
	// will the drain even be triggered, only at that time it would return true
	return true;
}

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

function listdir (path, extfilter, callback) {
	// Assert that it's a function
	if (typeof callback !== "function")
		callback = function (datalist) { };

	var datalist = [];
	var counter = 0;

	// remove last '/' from path
	if (path.charAt(path.length-1) !== "/")
		path += "/";

	fs.readdir(path, function (err, list) { 
		if (err) 
			console.log("[mainapp.js]: Error while getting dir list: ", err);

		//console.log("[mainapp.js]:List: ", list);
		// For every file in the list
    	list.forEach(function (file) {

    		counter++;
    		
    		// Full path of that file
    		var fullpath = path + file;
    		//console.log("[mainapp.js]:File:", fullpath);

    		// Get the file's stats
    		fs.stat(fullpath, function (err, stat) {

    			counter--;

    			if (stat && stat.isDirectory()) {
    				//console.log("[mainapp.js]:datalist:DIRECTORY:",fullpath);
    			}
    			else if (stat && stat.isFile()) {
    				var filename = fullpath.substring(fullpath.lastIndexOf("/")+1,fullpath.length);
    				var extension = fullpath.substring(fullpath.lastIndexOf(".")+1,fullpath.length);

    				if (extfilter.length == 0 || extfilter.indexOf(extension) != -1) {

    					// "filepath":fullpath, 
	    				datalist.push({
	    						"filename":filename,
	    						"extension":extension,
	    						"filesize":stat.size});
    				}
    			}
    			if (counter == 0)
    				callback(datalist);
    		});
    		
    	});
	});
}
/*
listdir(process.cwd()+'/bin/gcode', ["gcode"], listdircallback);
listdir(process.cwd()+'/bin/stl', ["stl"], listdircallback);

function listdircallback (datalist) {
	console.log("[mainapp.js]:datalistCB:COMPLETED", datalist);
} */

//------------------------------------------------------------------
// export
//------------------------------------------------------------------
module.exports = {
	initialize: initialize,
	sendPrinterCmd: sendPrinterCmd,
	sendPrinterData: sendPrinterData,
	getFileList: getFileList,
	outputStreamPrinter: printercore.oStreamPrinter
};
//------------------------------------------------------------------
// demo: ...
//downloadUrl('http://www.thingiverse.com/download:101530', __dirname+'/../bin/stl/');