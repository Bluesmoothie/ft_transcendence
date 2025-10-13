#!/bin/bash

sqlite3 /var/lib/sqlite/app.db < /db.sql

exec php-fpm83 --nodaemonize