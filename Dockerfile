FROM node:8
LABEL maintainer="National Institute of Standards and Technology"

# Create app directory
WORKDIR /usr/src/app

# Install Bower & Grunt
RUN npm install -g bower grunt-cli http-server

# Install app dependencies (npm)
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Install app dependencies (bower)
COPY bower.json ./
COPY .bowerrc ./

RUN bower install --allow-root

# Bundle app source
COPY . .

# Package app
RUN grunt all

# Expose 8080 (http-server default port)
EXPOSE 8080

# Run http-server in silent mode
CMD [ "http-server", "-s" ]