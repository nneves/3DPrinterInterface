// REST interface

var configdata; // see module.export: set on require('rest.js')(configdata);

var flatiron = require('flatiron'),
    app = flatiron.app,
    config = {},
    mainapp = require('./mainapp.js'); // complete init in initialize(): required due to config

// lower level stream - hardware
var JSONStream = require('json-stream'),
	jsonStream = new JSONStream();

// socket.io - WebSockets communication channel to client
// used to broadcast printer mapped messages (temp, errors, etc)
var socketio;
// cache printer messages until 1st client connects
var flagCachePrinterMsg = true;
var arrayCachePrinterMsg = [];
var arrayJSONmapping = ["printer","response","error","filelistgcode","fileliststl"];

//------------------------------------------------------------------
// initialization
//------------------------------------------------------------------
// flatiron configurations
//app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

// flatiron plugins
app.use(flatiron.plugins.http);

// using flatiron
app.router.configure({"notfound":noroutingfound});

// pipe core.js->oStream to a json-stream
mainapp.outputStreamPrinter.pipe(jsonStream);

//------------------------------------------------------------------
// app start
//------------------------------------------------------------------
function initialize (configdata) {

	console.log('[rest.js]:initizalize: ', JSON.stringify(configdata));

	// initialize mainapp and send configdata
	mainapp.initialize(configdata);

   // internal module config
   config.ipaddress = 
	configdata.restapi.ipaddress !== undefined ?
    configdata.restapi.ipaddress :
    '127.0.0.1';   
   config.tcpport = 
	configdata.restapi.tcpport !== undefined ?
    configdata.restapi.tcpport :
    8081;
   config.websockets = 
	configdata.restapi.websockets !== undefined ?
    configdata.restapi.websockets :
    false;

	// launch app on tcpoprt
	app.start(config.tcpport);
	console.log('3D Printer REST-API Server running on port '+config.tcpport);

	// verify is WebSockets (socket.io) config is active
	if (config.websockets) {

		console.log('Launch/bind Soket.io WebSockets server');
		socketio = require('socket.io').listen(app.server); // listen(app.server, { log: false });
		socketio.set('log level', 1); // reduce logging

		//------------------------------------------------------------------
		// Socket.io
		//------------------------------------------------------------------
		socketio.sockets.on('connection', function(socket) {

			socket.on('clientmsg', function(data) {
		    	console.log('Received client message with data: '+data.wsdata);

		    	// broadcast to all clients (exluding the origin client)
		    	//socket.broadcast.emit('servermsg', { data: "I recieved your message: "+data.wsdata});

		    	//send message to client
		    	//socket.emit('servermsg', { data: "I recieved your message: "+data.wsdata});
			});

			// on 1s connection, emits cached printer array to jsonstream
			if (flagCachePrinterMsg) {

				flagCachePrinterMsg = false;
				var cmd;
				while (arrayCachePrinterMsg.length > 0) {
					cmd = arrayCachePrinterMsg.shift();
					console.log("[rest.js]:sockeio.OnConnection:jsonstream.emit: ", cmd);
					jsonStream.emit('data', cmd);
				}
			}
		});
	}	
};

//------------------------------------------------------------------
// routing
//------------------------------------------------------------------

// flatiron router - API for GCODE commands - call parseGCodeCmd from enginecore.js
app.router.get('/api', help);

app.router.get(/api\/sendprintercmd\/((\w|.)*)/, sendPrinterCmd);

app.router.get(/api\/sendprinterfilename\/((\w|.)*)/, sendPrinterFilename);

app.router.get(/api\/getfilelistgcode\/((\w|.)*)/, getFileListGCODE);
app.router.get(/api\/getfileliststl\/((\w|.)*)/, getFileListSTL);

//app.router.get(/urldownload\/((\w|.)*)/, downloadUrl);

app.router.get(/api\/getwsconfig\/((\w|.)*)/, getWSConfig);

//------------------------------------------------------------------
// functions
//------------------------------------------------------------------

jsonStream.on('data', function (dlines) {

	if (flagCachePrinterMsg) {
		console.log('[rest.js]:JSONSTREAM:arrayCachePrinterMsg: ', dlines);

		// add the complete json object to the cache array
		// when 1st client connects will emmit full object to the jsonstream
		arrayCachePrinterMsg.push(dlines);
	}
	else {
		console.log('[rest.js]:JSONSTREAM:socketio.emit: ', dlines);

		// verify message property to check if its mapped to propagate
		for (prop in dlines) {
			console.log(prop);
			dlines[prop]

			// verify if property should be used 
		    if (arrayJSONmapping.indexOf(prop) != -1) {
				socketio.sockets.emit('servermsg', { data: dlines});
			}			
		}
		// manual mapping: printer - not required, edit the arrayJSONmapping array to add mapping
		/*
	    if (dlines.printer !== undefined) {
			console.log("[rest.js]:JSONSTREAM:printer: ", dlines.printer);
			//socketio.sockets.emit('servermsg', { data: dlines.printer});
			socketio.sockets.emit('servermsg', { data: dlines});
		} */
	}
});

function help () {

	// responding back to the brower request
	this.res.writeHead(200, {'Content-Type':'text/plain'});
	this.res.write('3D Printer Interface - REST API');
	this.res.end();
}

function noroutingfound () {

	var response = {response: false, error: 'Resource not available!'};

	// responding back to the brower request
	//this.res.writeHead(404, {'Content-Type':'application/json'});
	this.res.writeHead(200, {'Content-Type':'application/json'});
	this.res.write(JSON.stringify(response));
	this.res.end();			
}
/*
function downloadUrl (url) {
	console.log('REST-API: Request URL download: %s', url);
	mainapp.downloadUrl(url, '');

	// responding back to the brower request
	this.res.writeHead(200, {'Content-Type':'text/plain'});
	this.res.write('OK');
	this.res.end();	
} */

function sendPrinterCmd (data) {

	var result = mainapp.sendPrinterCmd(data);
	var response = {response: result};

	// responding back to the brower request
	this.res.writeHead(200, {'Content-Type':'application/json'});
	this.res.write(JSON.stringify(response));
	this.res.end();		
}

function sendPrinterFilename (filename) {

	var result = mainapp.sendPrinterFilename(filename);
	var response = {response: result};

	// responding back to the brower request
	this.res.writeHead(200, {'Content-Type':'application/json'});
	this.res.write(JSON.stringify(response));
	this.res.end();		
}

function getFileListGCODE () {

	var result = mainapp.getFileList("GCODE");
	var response = {response: result};

	// responding back to the brower request
	this.res.writeHead(200, {'Content-Type':'application/json'});
	this.res.write(JSON.stringify(response));
	this.res.end();		
}

function getFileListSTL () {

	var result = mainapp.getFileList("STL");
	var response = {response: result};

	// responding back to the brower request
	this.res.writeHead(200, {'Content-Type':'application/json'});
	this.res.write(JSON.stringify(response));
	this.res.end();
}

function getWSConfig () {

	var response = {response: config};
	console.log('[rest.js]:getWSConfig: ',response);

	// responding back to the brower request
	this.res.writeHead(200, {'Content-Type':'application/json'});
	this.res.write(JSON.stringify(response));
	this.res.end();
}

//------------------------------------------------------------------
// export
//------------------------------------------------------------------
module.exports = {
	initialize: initialize
}
/*
module.exports = exports = function() {
   console.log('[rest.js]:arguments: %j\n', arguments[0]);
   configdata = arguments[0];
};
*/