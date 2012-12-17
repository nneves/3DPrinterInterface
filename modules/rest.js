// REST interface

var flatiron = require('flatiron'),
    app = flatiron.app,
    config = {tcpPort: 8081},
    mainapp = require('./mainapp.js');

// lower level stream - hardware
var JSONStream = require('json-stream'),
	jsonStream = new JSONStream();

// socket.io - WebSockets communication channel to client
// used to broadcast printer mapped messages (temp, errors, etc)
var socketio;
// cache printer messages until 1st client connects
var flagCachePrinterMsg = true;
var arrayCachePrinterMsg = [];

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
// routing
//------------------------------------------------------------------

// flatiron router - API for GCODE commands - call parseGCodeCmd from enginecore.js
app.router.get('/api', help);

app.router.get(/api\/sendprintercmd\/((\w|.)*)/, sendPrinterCmd);

app.router.get(/api\/sendprinterfilename\/((\w|.)*)/, sendPrinterFilename);

//app.router.get(/urldownload\/((\w|.)*)/, downloadUrl);

//------------------------------------------------------------------
// app start
//------------------------------------------------------------------

// launch app on tcpoprt
app.start(config.tcpPort);
console.log('3D Printer REST-API Server running on port '+config.tcpPort);

console.log('Launch/bind Soket.io WebSockets server');
socketio = require('socket.io').listen(app.server)

//------------------------------------------------------------------
// Socket.io
//------------------------------------------------------------------
socketio.sockets.on('connection', function(socket) {

	socket.on('clientmsg', function(data) {
    	console.log('Received client message with data: '+data.wsdata);

    	// broadcast to all clients (exluding the origin client)
    	//socket.broadcast.emit('servermsg', { data: "I recieved your message: "+data.wsdata});

    	//send message to client
    	socket.emit('servermsg', { data: "I recieved your message: "+data.wsdata});
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

		// manual mapping: printer
	    if (dlines.printer !== undefined) {
			console.log("[rest.js]:JSONSTREAM:printer: ", dlines.printer);
			socketio.sockets.emit('servermsg', { data: dlines.printer});
		}
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