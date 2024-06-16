#!/bin/bash -e

rm -rf ts-out

tsc

node --test

# Chrome
rm -rf build-chrome
mkdir -p build-chrome

rollup ts-out/background-chrome.js --format es --name 'background' --file build-chrome/background.js
rollup ts-out/content.js --format es --name 'content' --file build-chrome/content.js
cp src/viewer.css build-chrome/viewer.css
cp src/manifest.chrome.json build-chrome/manifest.json
cp license.txt build-chrome/license.txt
cp -r src/_locales build-chrome
cp src/icon*.png build-chrome

rm -f jsonview-chrome.zip
pushd build-chrome
zip -r -q ../jsonview-chrome.zip *
popd


# Firefox
rm -rf build-firefox
mkdir -p build-firefox

rollup ts-out/background-firefox.js --format es --name 'background' --file build-firefox/background.js
rollup ts-out/content.js --format es --name 'content' --file build-firefox/content.js
cp src/viewer.css build-firefox/viewer.css
cp src/manifest.firefox.json build-firefox/manifest.json
cp license.txt build-firefox/license.txt
cp -r src/_locales build-firefox
cp src/icon*.png build-firefox

rm -f jsonview-firefox.zip
pushd build-firefox
zip -r -q ../jsonview-firefox.zip *
popd