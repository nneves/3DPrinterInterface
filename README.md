3D Printer Interface
--------------------

3D Printer Interface using Node.js!

ChangeLog
---------
Status: Initial structure ideia ... still a long way to go!

* Update1 (06-Nov-2012): 
Initial ./modules/core.js module is now working with writable stream interface, serialport communication support completed and also internal minimal cache/stream data parser engine in place.

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
