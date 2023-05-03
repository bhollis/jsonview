#!/bin/bash -e

tsc

rm -r -fo ./build-chrome
mkdir -p build-chrome

yarn rollup ts-out/background.js --format iife --name 'background' --file build-chrome/background.js
yarn rollup ts-out/content.js --format iife --name 'background' --file build-chrome/content.js
yarn rollup ts-out/viewer.js --format iife --name 'background' --file build-chrome/viewer.js
cp src/viewer.css build-chrome/viewer.css
cp src/manifest.json build-chrome/manifest.json
cp license.txt build-chrome/license.txt
cp -r src/_locales build-chrome
cp src/icon*.png build-chrome

rm -fo ./jsonview.zip
pushd build-chrome
Compress-Archive -Path ./* -DestinationPath ../jsonview.zip
popd


rm -r -fo ./build-firefox
mkdir -p build-firefox

yarn rollup ts-out/background.js --format iife --name 'background' --file build-firefox/background.js
yarn rollup ts-out/content.js --format iife --name 'background' --file build-firefox/content.js
yarn rollup ts-out/viewer.js --format iife --name 'background' --file build-firefox/viewer.js
cp src/viewer.css build-firefox/viewer.css
cp src/manifest.json build-firefox/manifest.json
cp license.txt build-firefox/license.txt
cp -r src/_locales build-firefox
cp src/icon*.png build-firefox

rm -fo ./jsonview.zip
pushd build-firefox
Compress-Archive -Path ./* -DestinationPath ../jsonview.zip
popd
