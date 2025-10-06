#!/bin/bash

sqlite3 /var/lib/sqlite/app.db < /db.sql

php-fpm83 --nodaemonize