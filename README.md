3D Printer Interface
--------------------

3D Printer Interface using Node.js!

ChangeLog
---------
Status: Initial structure ideia ... still a long way to go!

* Update1 (06-Nov-2012): 
Initial ./modules/core.js module is now working with writable stream interface, serialport communication support completed and also internal minimal cache/stream data parser engine in place.

* Update2 (29-Nov-2012): 
	- Ported and re-factored R2C2 webinterface (including client javascript helper file)
	- Added app.js code to deploy initial WebInterface for UI testing
	- Added rest.js module code to deploy REST API
	- Created mainapp.js to bind upper rest.js module requests with lower level modules (core.js serial communications module, slicer.js, downloader.js, etc)

It is now possible to test the WebInterface and send a simple GCODE command to printer. There is also an initial support to print data from .gcode files located at /bin/gcode/ .

// update node required packages
```bash
$ npm update
```

// launch demo WebInterface (will run on port 8080, REST API on 8081 and using /dev/null to emulate printer serial port - printer response emulated by timer)
```bash
$ node app.js
```


Testing core.js module via command line
----------------------

The ./modules/core.js base module is responsible for managing all the 3D Printer configurations/communication and abstract all the underlaying functionality in a usable generic stream interface. To test this initial work there is a simple appcmd.js file with the minimal necessary required configurations to launch a simple 3d printer interface that can receive GCODE data from file/stream/STDIN and start printing the 3d object.

Install project npm package dependencies:

```bash
npm install
```

1- send gcode data to printer from file using command line ARGUMENTS

```bash
node appcmd.js ./bin/gcode/demo.gcode
```

2- send gcode data to printer from STDIN pipe (file content stream using cat)

```bash
cat ./bin/gcode/demo.gcode | node appcmd.js
```

3- send gcode data to printer from STDIN: manual GCODE data insert on the console + ENTER (interactive/manual control)

```bash
node appcmd.js

(enter commands): 
// M104 S200\n
// G28\n
// G90\n
// G21\n
// G92\n
// M82\n
// G1 Z0.200 F7800.000\n
```

3d Printers/electronic boards/microcontrollers tested hardware
----------------------
Currently testing with R2C2 electronic board from this project: https://github.com/nneves/R2C2_WebInterface

Using MBED microcontroller (could also use an Arduino) for a 3d printer emulator (without any logic, just receives USB serialport data and responds back with an 'ok' when it finds and ENTER - no gcode validation nor other logic):
http://mbed.org/users/botdream/code/3dprinter_usbserialport_emulator/

Also using /dev/null interface for dummy tests.

License
=======
Copyright (C) 2012 Nelson Neves

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see http://www.gnu.org/licenses/agpl-3.0.html
