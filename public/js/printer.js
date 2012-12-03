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
};
//-----------------------------------------------------------------------------

//-----------------------------------------------------------------------------
// Public - PRINTER namespace Scope
//-----------------------------------------------------------------------------	
PRINTER.WebInterface.prototype.sendCmd = function (cmd) {

	var sendReq = this._getXHRObject();	
	var url_cmd = '/api/sendprintercmd/'+cmd;

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
	var url_cmd = '/api/sendprinterfilename/'+filename;

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