#!/bin/bash

sqlite3 /var/www/server/app.sqlite < /db.sql

cd /var/www/server

npm init -y
npm install fastify typescript @types/node sqlite3 sqlite 

make re

node js/server.js

