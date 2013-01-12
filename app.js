// app.js
//
// * npm start initial point 
// * load modules configurations files
// * set modules configurations data
// * start web interface

var configdata = require('config');
var node_env = 
        process.env.NODE_ENV !== undefined ? 
        process.env.NODE_ENV : 
        "default";
console.log("[app.js]:config/%s.json: $s", node_env, JSON.stringify(configdata));

var flatiron = require('flatiron'),
    path = require('path'),
    ecstatic = require('ecstatic'),
    app = flatiron.app,    
    tcpport = 
        configdata.webinterface.tcpport !== undefined ? 
        configdata.webinterface.tcpport : 
        8080;

// need to change REST API flatiron to launch from init function
var restserver = require('./modules/rest.js').initialize(configdata);

var restserver_ip = 
        configdata.restapi.tcpport !== undefined ?
        configdata.restapi.ipaddress : 
        '127.0.0.1',
    restserver_tcpport = 
        configdata.restapi.tcpport !== undefined ?
        configdata.restapi.tcpport :
        8081,
    restserver_proxy = require('request');

// flatiron configurations
app.config.file({ file: path.join(__dirname, 'config', 'app.json') });

// flatiron plugins
app.use(flatiron.plugins.http);

// flatiron - ecstatic (server resources from directory - html, css, js, images)
app.http.before = [
  ecstatic(__dirname + '/public')
];

// http proxy rules - valid for all /api requests
app.router.get(/api\/((\w|.)*)/, requestProxy);

// socketio resource: socket.io.js provided from socket.io itself (rest.js)
if (configdata.restapi.websockets == true)
  app.router.get(/socket.io\/((\w|.)*)/, requestProxy);
else
  app.router.get(/socket.io\/((\w|.)*)/, dummySocketIo);

// launch app on tcpoprt
app.start(tcpport);
console.log('3D Printer WebInterface Server running on port '+tcpport);

function requestProxy (data) {

	var rest_addr = 'http://'+restserver_ip+':'+restserver_tcpport+this.req.url;

	console.log("Proxying request to %s", rest_addr);

	restserver_proxy.get(rest_addr).pipe(this.res);
}

function dummySocketIo () {
    
    console.log("[app.js]:Dummy Socket.io javascript resource");

    this.res.writeHead(200, {'Content-Type':'application/javascript'});
    this.res.write("// dummy socket.io.js file (required to silence browser errors ");
    this.res.write("when loading default HTTP REST mode - without websockets support)");
    this.res.end();     
}
