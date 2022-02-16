#!/bin/bash

npm install

cd ./server

node-gyp configure

cd ..

npm run compile


