#!/bin/bash -e

tsc

rm -r -fo ./build
mkdir -p build

yarn rollup ts-out/background.js --format iife --name 'background' --file build/background.js
yarn rollup ts-out/content.js --format iife --name 'background' --file build/content.js
yarn rollup ts-out/viewer.js --format iife --name 'background' --file build/viewer.js
cp src/viewer.css build/viewer.css
cp src/manifest.json build/manifest.json
cp license.txt build/license.txt
cp -r src/_locales build
cp src/icon*.png build

rm -fo ./jsonview.zip
pushd build
Compress-Archive -Path ./* -DestinationPath ../jsonview.zip
popd
