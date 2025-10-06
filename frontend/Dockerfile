FROM alpine:3.20

RUN apk update && apk upgrade
RUN apk add nginx bash openssl

COPY nginx.conf /etc/nginx/nginx.conf
ADD src/ /var/www/html/

COPY ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

CMD ["bash", "/entrypoint.sh"]