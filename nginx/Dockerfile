FROM nginx:stable-alpine

# Remove default site completely
RUN rm -rf /usr/share/nginx/html/*

# Remove default config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy our config
COPY conf.d /etc/nginx/conf.d
