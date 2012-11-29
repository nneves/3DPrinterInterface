/* DEMO CODE
var printer = new 3DP.WebInterface(); // explicit contructor call
or
var printer = PRINTER.WebInterface();

	<!-- Demo code to be used in the main HTML file -->
	<script type="text/javascript" src="js/printer.js"></script>
	<script type="text/javascript">
		var printer = PRINTER.WebInterface();
	</script>
*/
//-----------------------------------------------------------------------------
var PRINTER = {};
//-----------------------------------------------------------------------------
PRINTER.WebInterface = function () {
	//var printer = PRINTER.WebInterface();	
	if(!(this instanceof arguments.callee)) {
		console.log("Auto create and return object!");
		return new arguments.callee();
	}	
	console.log("Creating PRINTER.WebInterface object.");

	/*
	// avoid using this solution, will require special Access Control rule to allow
	// making a request to REST SERVER on different port from normal UI WebServer
	this.restserver_protocol = "http://";
	this.restserver_ip = "127.0.0.1";
	this.restserver_tcpport = "8081";
	this.restserver_addr = this.restserver_protocol+this.restserver_ip+":"+this.restserver_tcpport;
	console.log("REST SERVER ADDR: %s", this.restserver_addr);
	*/
	this.restserver_addr = "";
};
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Public - PRINTER namespace Scope
//-----------------------------------------------------------------------------	
PRINTER.WebInterface.prototype.sendCmd = function (cmd) {

	var sendReq = this._getXHRObject();	
	var url_cmd = this.restserver_addr+'/api/sendprintercmd/'+cmd;

	if (sendReq.readyState == 4 || sendReq.readyState == 0) {
		sendReq.open("GET",url_cmd,true);
        sendReq.setRequestHeader('Accept','application/json');
        sendReq.setRequestHeader('Content-Type','text/xml');
		sendReq.onreadystatechange = this._XHRcallback(url_cmd);
        console.log("-> XHR cmd["+url_cmd+"]");
		sendReq.send(null);
	}	
};

PRINTER.WebInterface.prototype.sendFilename = function (filename) {

	// internal ajax request object
	var sendReq = this._getXHRObject();	
	var url_cmd = this.restserver_addr+'/api/sendprinterfilename/'+filename;

	if (sendReq.readyState == 4 || sendReq.readyState == 0) {
		sendReq.open("GET",url_cmd,true);
        sendReq.setRequestHeader('Accept','application/json');
        sendReq.setRequestHeader('Content-Type','text/xml');
		sendReq.onreadystatechange = this._XHRcallback(url_cmd);
        console.log("-> XHR cmd["+url_cmd+"]");
		sendReq.send(null);
	}	
};

//-----------------------------------------------------------------------------	

//-----------------------------------------------------------------------------
// Private - PRINTER namespace Scope
//-----------------------------------------------------------------------------	
PRINTER.WebInterface.prototype._getXHRObject = function () {

	if (window.XMLHttpRequest) {
		return new XMLHttpRequest();
	} else if(window.ActiveXObject) {
		return new ActiveXObject("Microsoft.XMLHTTP");
	} else {
		alert(
		'Status: Could not create XmlHttpRequest Object.' +
		'Consider upgrading your browser.');
	}
};
//-----------------------------------------------------------------------------	

PRINTER.WebInterface.prototype._XHRcallback = function (url) {
	return function() {
		if (this.readyState == 4 || this.readyState == 0) {
			console.log('<- XHR cmd['+url+'] = '+this.responseText);
		}
	};
};
//-----------------------------------------------------------------------------	


//-----------------------------------------------------------------------------
// AUX - demo functionality
//-----------------------------------------------------------------------------
