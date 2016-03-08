FROM node:5

ENV APP_ROOT_DIR=/srv/mbac
ENV SERVER_PORT=3000
ENV SERVER_ADDRESS=0.0.0.0

RUN mkdir -p $APP_ROOT_DIR
ADD . $APP_ROOT_DIR
WORKDIR $APP_ROOT_DIR
RUN npm install -g grunt-cli
RUN npm install
# RUN grunt

VOLUME $APP_ROOT_DIR/config
EXPOSE $SERVER_PORT

CMD ["npm", "start"]
