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

	this.initRelativeMoveCmd();

	// rest callbackXHR bridge to socket.io reponse channel
	this.xhrcbrest = this.initXHRCallbackRest();

	//socketio
	this.socket;

	// request WebSockets config
	this.getWSConfig();

	// callback object list for UI/frontend easy usage
	// maps socket.io object and calls callback function(data)
	this.cblist = {};
};
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Public - PRINTER namespace Scope
//-----------------------------------------------------------------------------	

PRINTER.WebInterface.prototype._XHRcallbackWSConfig = function (parent, url) {
	return function() {
		if (this.readyState == 4 || this.readyState == 0) {
			console.log('<- XHR WSConfig['+url+'] = '+this.responseText);

			var data = JSON.parse(this.responseText);
			console.log(data);
			if (data.response.websockets == true) {
				parent.initSocketio(data.response.ipaddress, data.response.tcpport); // rest.js API module
				//if (parent.socket !== undefined)
				//	parent.socket.emit('clientmsg', { wsdata: "HelloAgain!" });
			}
		}
	};
};
//-----------------------------------------------------------------------------	

PRINTER.WebInterface.prototype.initSocketio = function (ip, port) {

	var self = this;
    if (typeof io !== "undefined") {

    	// remove original port (when using ip=window.location.host port is not correct)
    	var array_ip = ip.split(":");
		if (array_ip.length > 0)
			ip = array_ip[0];

    	var server_addr = 'http://'+ip+':'+port;
    	console.log("Connecting to Socketio server: ", server_addr);
    	this.socket = io.connect(server_addr);

		var inlinefunc = function (self) {
			return function(serverdata) {
	        	//console.log('Received server message with data: '+JSON.stringify(serverdata.data));
	        	//console.log('->: ', serverdata.data);
	        	if (self.pPrinterMessage !== undefined)
	        		self.pPrinterMessage(serverdata.data);

	        	// get serverdata.data object property, calls remote callback if defined
	        	for (prop in serverdata.data) {
		        	if (self.cblist[prop] !== undefined && typeof self.cblist[prop] === 'function') {
		        		//console.log("Socket.io: ", serverdata);
		        		self.cblist[prop](serverdata.data);
		        	}
	        	}
			};
		};
		// socket.io
    	this.socket.on('servermsg', inlinefunc(this));
    }
};

PRINTER.WebInterface.prototype.initXHRCallbackRest = function () {

	// verify if socket.io is already assigned
	// if so don't bridge the REST response via the same channel
	if (typeof io === "undefined") {
		var self = this;
		var inlinefunc = function (self) {
			return function(serverdata) {
	        	//console.log('Received server message with data: '+JSON.stringify(serverdata.data));
	        	console.log('initXHRCallbackRest: ', JSON.stringify(serverdata.data));
	        	if (self.pPrinterMessage !== undefined)
	        		self.pPrinterMessage(serverdata.data);

	        	// get serverdata.data object property, calls remote callback if defined
	        	for (prop in serverdata.data) {
		        	if (self.cblist[prop] !== undefined && typeof self.cblist[prop] === 'function') {
		        		//console.log("Socket.io: ", serverdata);
		        		self.cblist[prop](serverdata.data);
		        	}
	        	}
			};
		};
		return inlinefunc(this);
	}
	else {
		return function (self) { console.log("initXHRCallbackRest: REST channel disabled!"); };	
	}
};

PRINTER.WebInterface.prototype.sendCmd = function (cmd) {

	var sendReq = this._getXHRObject();	
	var url_cmd = '/api/sendprintercmd/'+cmd;

	if (sendReq.readyState == 4 || sendReq.readyState == 0) {
		sendReq.open("GET",url_cmd,true);
        sendReq.setRequestHeader('Accept','application/json');
        sendReq.setRequestHeader('Content-Type','text/xml');
		sendReq.onreadystatechange = this._XHRcallback(this, url_cmd);
        console.log("-> XHR cmd["+url_cmd+"]");
		sendReq.send(null);
	}	
};

PRINTER.WebInterface.prototype.sendData = function (filename) {

	// internal ajax request object
	var sendReq = this._getXHRObject();	
	var url_cmd = '/api/sendprinterdata/'+filename;

	if (sendReq.readyState == 4 || sendReq.readyState == 0) {
		sendReq.open("GET",url_cmd,true);
        sendReq.setRequestHeader('Accept','application/json');
        sendReq.setRequestHeader('Content-Type','text/xml');
		sendReq.onreadystatechange = this._XHRcallback(this, url_cmd);
        console.log("-> XHR cmd["+url_cmd+"]");
		sendReq.send(null);
	}	
};

PRINTER.WebInterface.prototype.getFileListGCODE = function () {

	// internal ajax request object
	var sendReq = this._getXHRObject();	
	var url_cmd = '/api/getfilelistgcode/';

	if (sendReq.readyState == 4 || sendReq.readyState == 0) {
		sendReq.open("GET",url_cmd,true);
        sendReq.setRequestHeader('Accept','application/json');
        sendReq.setRequestHeader('Content-Type','text/xml');
		sendReq.onreadystatechange = this._XHRcallback(this, url_cmd);
        console.log("-> XHR cmd["+url_cmd+"]");
		sendReq.send(null);
	}	
};

PRINTER.WebInterface.prototype.getFileListSTL = function () {

	// internal ajax request object
	var sendReq = this._getXHRObject();	
	var url_cmd = '/api/getfileliststl/';

	if (sendReq.readyState == 4 || sendReq.readyState == 0) {
		sendReq.open("GET",url_cmd,true);
        sendReq.setRequestHeader('Accept','application/json');
        sendReq.setRequestHeader('Content-Type','text/xml');
		sendReq.onreadystatechange = this._XHRcallback(this, url_cmd);
        console.log("-> XHR cmd["+url_cmd+"]");
		sendReq.send(null);
	}	
};

PRINTER.WebInterface.prototype.getWSConfig = function () {

	// internal ajax request object
	var sendReq = this._getXHRObject();	
	var url_cmd = '/api/getwsconfig/';

	if (sendReq.readyState == 4 || sendReq.readyState == 0) {
		sendReq.open("GET",url_cmd,true);
        sendReq.setRequestHeader('Accept','application/json');
        sendReq.setRequestHeader('Content-Type','text/xml');
		sendReq.onreadystatechange = this._XHRcallbackWSConfig(this, url_cmd);
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

PRINTER.WebInterface.prototype._XHRcallback = function (parent, url) {

	return function() {
		if (this.readyState == 4 || this.readyState == 0) {
			console.log('<- XHR cmd['+url+'] = '+this.responseText);

			var data = JSON.parse(this.responseText);
			console.log("_XHRcallback: ", JSON.stringify(data));
			parent.xhrcbrest(data);
		}
	};	
};
//-----------------------------------------------------------------------------	

//-----------------------------------------------------------------------------
// AUX - demo functionality
//-----------------------------------------------------------------------------
// initialize printer to relative movement
PRINTER.WebInterface.prototype.initRelativeMoveCmd = function() {
    this.sendCmd('G91');
}

// auxiliar function to compose absolute gcode move command 
PRINTER.WebInterface.prototype.generateGCODE = function (posx, posy, posz, feedrate) {

	var igcode = 	"G1 X"+posx.toFixed(6).toString(10)+
					" Y"+posy.toFixed(6).toString(10)+
					" Z"+posz.toFixed(6).toString(10)+
					" F"+feedrate.toString(10);
	return igcode;
};

PRINTER.WebInterface.prototype.moveHome = function() {

	this.sendCmd('G28');
}

PRINTER.WebInterface.prototype.moveXPlus = function(jogvalue, feedrate) {

	var gcodeCMD = this.generateGCODE(jogvalue, 0, 0, feedrate);

	console.log("GCODE: ", gcodeCMD);
	this.sendCmd(gcodeCMD);
}

PRINTER.WebInterface.prototype.moveXMinus = function(jogvalue, feedrate) {

	var gcodeCMD = this.generateGCODE(-jogvalue, 0, 0, feedrate);

	console.log("GCODE: ", gcodeCMD);
	this.sendCmd(gcodeCMD);
}

PRINTER.WebInterface.prototype.moveYPlus = function(jogvalue, feedrate) {

	var gcodeCMD = this.generateGCODE(0, jogvalue, 0, feedrate);

	console.log("GCODE: ", gcodeCMD);
	this.sendCmd(gcodeCMD);
}

PRINTER.WebInterface.prototype.moveYMinus = function(jogvalue, feedrate) {

	var gcodeCMD = this.generateGCODE(0, -jogvalue, 0, feedrate);

	console.log("GCODE: ", gcodeCMD);
	this.sendCmd(gcodeCMD);
}

PRINTER.WebInterface.prototype.moveZPlus = function(jogvalue, feedrate) {

	var gcodeCMD = this.generateGCODE(0, 0, jogvalue, feedrate);

	console.log("GCODE: ", gcodeCMD);
	this.sendCmd(gcodeCMD);
}

PRINTER.WebInterface.prototype.moveZMinus = function(jogvalue, feedrate) {

	var gcodeCMD = this.generateGCODE(0, 0, -jogvalue, feedrate);

	console.log("GCODE: ", gcodeCMD);
	this.sendCmd(gcodeCMD);
}