G28 ; home all axes
G90 ; use absolute coordinates
G21 ; set units to millimeters
G92 E0 ; reset extrusion distance
M82 ; use absolute distances for extrusion
G1 Z0.000 F7800.000
G1 X0 Y0 F8000
G1 X200 Y0 F400
G1 X200 Y200 F400
G1 X0 Y200 F400
G1 X0 Y0 F400
G1 X0 Y100 F400
G1 X200 Y100 F400
G1 X200 Y200 F400
G1 X0 Y200 F400
G1 X0 Y0 F400
G1 X200 Y0 F400
G1 X0 Y0 F400