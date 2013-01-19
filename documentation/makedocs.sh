#!/bin/

# requires: https://github.com/cbou/markdox
# runscript: sh makedocs.sh

# modules/rest.js
markdox ../modules/rest.js
mv output.md rest.md
open rest.md