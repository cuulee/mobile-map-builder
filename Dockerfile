FROM mhart/alpine-node
MAINTAINER Denis Carriere <carriere.denis@gmail.com>

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app/
COPY typings.json /app/
RUN npm install

# Bundle app source
COPY . /app

# Start App
EXPOSE 5000
ENV DEBUG mmb:*
CMD ["npm", "start"]