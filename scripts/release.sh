#!/bin/bash

node -e "require('fs').writeFileSync('package.json', JSON.stringify({ ...require('./package.json'), version: '${$1}' }, null, 2));"
yarn electron-builder --mac --win
