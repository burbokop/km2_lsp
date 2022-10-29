#!/bin/bash

npm install

cd ./server

node-gyp configure

cd ..

npm run compile

script_path=`realpath ./server/out/server.js`;
pid=`ps -x -o pid,cmd | grep "/usr/bin/node ${script_path} --stdio$" | awk '{print $1;}'`

echo "found running process on pid: ${pid}"
kill -9 ${pid}
echo "Process killed"