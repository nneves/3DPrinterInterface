var downloadr = require('./modules/downloader.js'); 

var dl = new downloadr.Downloader(); 

	// download file
	var url = 'http://www.thingiverse.com/download:101530';
	dl.set_remote_file(url); 
	dl.set_local_path(__dirname+'/'); // need to implement last char check == '/' on the module
	dl.run();	