FROM mhart/alpine-node
MAINTAINER Denis Carriere <carriere.denis@gmail.com>

# Setup the locales in the Dockerfile
RUN apt-get update \
    && apt-get install locales -y \
    && locale-gen en_US.UTF-8

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app/
COPY typings.json /app/
RUN npm install

# Bundle app source
COPY . /app
RUN npm run build
WORKDIR /app/dist


