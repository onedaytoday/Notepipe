#!/bin/sh
networkName=handwriting
socketImage=socketserver
webImage=pythonwebserver

# Change this to something like 8080 or 8081 if port 80 is taken
webPort=8080

export DOCKER_SCAN_SUGGEST=false

echo "\n\nCreating Network"
docker network inspect $networkName >/dev/null 2>&1 || docker network create --driver bridge $networkName

echo "\n\nBuilding Fresh Images"
docker build --no-cache -t $webImage -f ./docker/web.Dockerfile .    
docker build --no-cache -t $socketImage -f ./websocket/Dockerfile ./websocket 

containers=$(docker ps -q)
echo "\n\nCleaning containers"
if [ ! -z "$containers" ]; then
    docker kill $containers
fi

echo "\n\nStarting containers"
docker run --rm -d -it --name "$webImage-container" -p $webPort:7000 --network $networkName $webImage
docker run --rm -d -it --name "$socketImage-container" -p 8001:8001 --network $networkName $socketImage
docker run --rm -d -it --name "redis-container" -p 8002:6379 --network $networkName --rm redis redis-server --save 60 1


echo "\n\nDeleting Dangling Images. Say 'N' if you have dangling images you want to keep. Otherwise say y to remove dangling images."
docker image prune


echo "\n\nBuild Complete, running on localhost:$webPort"





