FROM mhart/alpine-node
MAINTAINER Denis Carriere <carriere.denis@gmail.com>

# Create app directory
RUN mkdir -p /app
WORKDIR /app

# Install app dependencies
COPY package.json /app/
RUN npm install

# Install typings
COPY typings.json /app/
RUN npm run typings

# Bundle app source
COPY . /app

# Start App
EXPOSE 5000
CMD ["npm", "start"]