#!/bin/bash

cd /home/abidolet/Documents/ft_transcendence/frontend/srcs
npx tsc --watch &

npx tailwindcss -i css/input.css -o css/output.css --watch &

cd /home/abidolet/Documents/ft_transcendence/backend/srcs
npx tsc --watch &

wait