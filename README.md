3D Printer Interface
--------------------

3D Printer Interface using Node.js!

ChangeLog
---------
Status: Core functionality is now in place (just missing a few minor stuff - configs, etc)
UI interface still under development (at the moment there are only some basic test functionalities)

* Update3 (31-Dec-2012)
    - Added Socket.io for websockets communication (currently used to upload printer response to UI, should add support for bidirectional communication - will also maintain REST for API interface)
    - Added support in printer.js UI Library to map local callbacks with Socket.io Event Messages for easy integration with UI components
    - Fixed issues #2,#3,#4,#5,#6,#7,#8,#11
.

* Update2 (29-Nov-2012): 
    - Ported and re-factored R2C2 webinterface (including client javascript helper file)
    - Added app.js code to deploy initial WebInterface for UI testing
    - Added rest.js module code to deploy REST API
    - Created mainapp.js to bind upper rest.js module requests with lower level modules (core.js serial communications module, slicer.js, downloader.js, etc)
.

* Update1 (06-Nov-2012): 
Initial ./modules/core.js module is now working with writable stream interface, serialport communication support completed and also internal minimal cache/stream data parser engine in place.

TODO
----
    - Completlety redesign the frontend UI and add extra functionalities
    - Refactor core module configurations to use config/*.json files
    - Create documentation for UI implementation
    - Create documentation to explain core modules communication/workflow

Techincal Specs initial draft (work in progress)
-----------------------------
https://www.lucidchart.com/documents/view/4f5c-1f6c-50baa492-9d74-10150a442276

How to test 3DPI
----------------

It is now possible to test the WebInterface and send a simple GCODE command to printer. There is also an initial support to print data from .gcode files located at /bin/gcode/ .

// clone repo
```bash
$ git clone git://github.com/nneves/3DPrinterInterface.git
$ cd 3DPrinterInterface
```

// update node required packages
```bash
$ npm update
```

// launch demo WebInterface (will run on port 8080, REST API on 8081 and using /dev/null to emulate printer serial port - printer response emulated by timer)
```bash
$ node app.js
```

3d Printers/electronic boards/microcontrollers tested hardware
----------------------
* Currently using an Ultimaker 3d printer

* Also testing with R2C2 electronic board from this project: https://github.com/nneves/R2C2_WebInterface

* Using MBED microcontroller (could also use an Arduino) for a 3d printer emulator (without any logic, just receives USB serialport data and responds back with an 'ok' when it finds and ENTER - no gcode validation nor other logic):
http://mbed.org/users/botdream/code/3dprinter_usbserialport_emulator/

* Also using /dev/null interface for dummy tests.

License
----------------------
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
