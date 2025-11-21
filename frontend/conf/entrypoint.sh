cd /var/www/html

npm install

npx tailwindcss -i css/game.css -o css/output/game.css
npx tailwindcss -i css/global.css -o css/output/global.css
npx tailwindcss -i css/start.css -o css/output/start.css
npx tailwindcss -i css/login.css -o css/output/login.css
npm run build

exec nginx -g "daemon off;"
