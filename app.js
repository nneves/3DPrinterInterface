// app.js
//
// * npm start initial point 
// * load modules configurations files
// * set modules configurations data
// * start web interface

var flatiron = require('flatiron'),
    path = require('path'),
    ecstatic = require('ecstatic'),
    app = flatiron.app,    
    tcpport = 8080,
    restserver = require('./modules/rest.js'),
    restserver_ip = '127.0.0.1',
    restserver_tcpport = 8081,
    restserver_proxy = require('request');

// flatiron configurations
app.config.file({ file: path.join(__dirname, 'config', 'app.json') });

// flatiron plugins
app.use(flatiron.plugins.http);

// flatiron - ecstatic (server resources from directory - html, css, js, images)
app.http.before = [
  ecstatic(__dirname + '/public')
];

// http proxy rules
app.router.get(/sendprintercmd\/((\w|.)*)/, requestProxy);

// not yet implemented in the rest.js module ... wip
//app.router.get(/sendprinterfilename\/((\w|.)*)/, requestProxy);

// launch app on tcpoprt
app.start(tcpport);
console.log('3D Printer WebInterface Server running on port '+tcpport);

function requestProxy (data) {

	var rest_addr = 'http://'+restserver_ip+':'+restserver_tcpport+this.req.url;

	console.log("Proxying request to %s", rest_addr);

	restserver_proxy.get(rest_addr).pipe(this.res);
}
