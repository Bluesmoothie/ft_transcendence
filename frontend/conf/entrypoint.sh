cd /var/www/html

npm init -y
npm install -D tailwindcss@3 postcss autoprefixer typescript

npx tailwindcss -i css/input.css -o css/output.css
npx tsc

exec nginx -g "daemon off;"
