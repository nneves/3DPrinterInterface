// REST interface

var flatiron = require('flatiron'),
    app = flatiron.app,
    config = {tcpPort: 8081},
    mainapp = require('./mainapp.js');

//------------------------------------------------------------------
// initialization
//------------------------------------------------------------------

// flatiron configurations
//app.config.file({ file: path.join(__dirname, 'config', 'config.json') });

// flatiron plugins
app.use(flatiron.plugins.http);

// using flatiron
app.router.configure({"notfound":noroutingfound});

//------------------------------------------------------------------
// routing
//------------------------------------------------------------------

// flatiron router - API for GCODE commands - call parseGCodeCmd from enginecore.js
app.router.get('/', help);

app.router.get(/sendprintercmd\/((\w|.)*)/, sendPrinterCmd);

//app.router.get(/urldownload\/((\w|.)*)/, downloadUrl);

//------------------------------------------------------------------
// app start
//------------------------------------------------------------------

// launch app on tcpoprt
app.start(config.tcpPort);
console.log('3D Printer REST-API Server running on port '+config.tcpPort);

//------------------------------------------------------------------
// functions
//------------------------------------------------------------------

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

	var result = mainapp.writePrinterCmd(data);
	var response = {response: result};

	// responding back to the brower request
	this.res.writeHead(200, {'Content-Type':'application/json'});
	this.res.write(JSON.stringify(response));
	this.res.end();		
}