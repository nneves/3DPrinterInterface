

<!-- Start ../modules/rest.js -->

3D Printer Interface - Interface with a 3d Printer using http protocol

This documentation provides a simple guideline on how to use the REST API 
from project [3D Printer Interface](https://github.com/nneves/3DPrinterInterface)
to be used with the UI/frontend integration in the app.js module. 

Please refer to [3DPi WebApp](https://www.lucidchart.com/documents/view/4f5c-1f6c-50baa492-9d74-10150a442276)
documentation for an overhaul overview of the project internal modules.

Author: Nelson Neves <nelson.s.neves@gmail.com>

Version: 0.0.1

## help()

REST API help.

Examples:

    http://restapi_ip:port/api

## sendPrinterCmd(gcodecmd)

Send GCODE command to printer

Examples:

    http://restapi_ip:port/api/sendprintercmd/G28

See: GET

### Params: 

* **String** *gcodecmd* 

### Return:

* **Object** {&quot;data&quot;:{&quot;response&quot;:&quot;ok&quot;}}

## sendPrinterCmdASync(gcodecmd)

Send GCODE command to printer [ASYNC method]

NOTE: request response is sent without waiting for printer 

Examples:

    http://restapi_ip:port/api/sendprintercmdasync/G1%20X1%20F800

See: GET

### Params: 

* **String** *gcodecmd* 

### Return:

* **Object** {&quot;response&quot;:true}

## sendPrinterData(filename)

Send GCODE data from file to printer

This command will trigger the 3d object print function,
it uses node.js FileStreams to read the content of the GCODE
file and send it in small blocks of data to the printer in a efficient way.

Examples:

    http://restapi_ip:port/api/sendprinterdata/octopus.gcode

See: GET

### Params: 

* **String** *filename* (cached file from: appdir/bin/gcode/)

### Return:

* **Object** {&quot;data&quot;:{&quot;response&quot;:&quot;ok&quot;}}

## sendPrinterDataASync(filename)

Send GCODE data from file to printer [ASYNC method]

NOTE: request response is sent without waiting for printer  

This command will trigger the 3d object print function,
it uses node.js FileStreams to read the content of the GCODE
file and send it in small blocks of data to the printer in a efficient way.

Examples:

    http://restapi_ip:port/api/sendprinterdataasync/octopus.gcode

See: GET

### Params: 

* **String** *filename* (cached file from: appdir/bin/gcode/)

### Return:

* **Object** {&quot;response&quot;:true}

## getFileListGCODE()

Get cached GCODE files list

Requests a list of existing GCODE files under appdir/bin/gcode/

Examples:

    http://restapi_ip:port/api/getfilelistgcode/

See: GET

### Return:

* **Object** {&quot;data&quot;:{&quot;filelistgcode&quot;:[{&quot;filename&quot;:&quot;octopus.gcode&quot;,&quot;extension&quot;:&quot;gcode&quot;,&quot;filesize&quot;:1670110}]}}

## getFileListSTL()

Get cached STL files list

Requests a list of existing STL files under appdir/bin/stl/

Examples:

    http://restapi_ip:port/api/getfileliststl/

See: GET

### Return:

* **Object** {&quot;data&quot;:{&quot;fileliststl&quot;:[{&quot;filename&quot;:&quot;octopus.stl&quot;,&quot;extension&quot;:&quot;stl&quot;,&quot;filesize&quot;:172626}]}}

## getWSConfig()

Get node.js WebSockets config data 

Requests data from node.js config (appdir/config/default.js) 
required for the UI Socket.io funcionality (WebSockets Server enabled flag, ip, port)

NOTE: different configs can be used when launching 'node.js app.js' using 'export NODE_ENV=rpi'
[npm config package](https://npmjs.org/package/config)

Examples:

    http://restapi_ip:port/api/getwsconfig/

See: GET

### Return:

* **Object** {&quot;response&quot;:{&quot;ipaddress&quot;:&quot;127.0.0.1&quot;,&quot;tcpport&quot;:8081,&quot;websockets&quot;:false}}

<!-- End ../modules/rest.js -->

