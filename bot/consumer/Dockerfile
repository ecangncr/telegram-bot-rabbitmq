FROM node:19-alpine3.15
WORKDIR /usr/src/
COPY ./package.json .

RUN npm install 

RUN npm install -g nodemon

ENV NODE_PATH=/usr/src/node_modules
 

WORKDIR /usr/src/app
 
 
CMD ["nodemon", "consumer.js"]