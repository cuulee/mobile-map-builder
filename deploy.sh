git pull
docker build -t mmb .
docker stop mmb
docker rm mmb
docker run -d -p 5000:5000 --name mmb mmb
