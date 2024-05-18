import websockets
import logging
import redis
import json
import os

from TTS.TextToSpeech import createAudio
from Models.responses import newPageCreated,NewpagesInserted

#from handwriting.websocket.Models.responses import response
try:
    redisServer = redis.Redis.from_url(url=os.environ.get("REDIS_URL"), db=0)
except ValueError:
    redisServer = redis.Redis(host=os.environ.get("REDIS_URL"), db=0)



from Models.responses import canvasBroadcast, canvasUpdateSuccess, canvasDrawUpdateBroadcast, clearpage
from Models.redisObjects import hostPages, loadHostPagesFromJSON

log = logging.getLogger(__name__)


async def canvasUpdate(websocket, messageJSON, connected, studentKey: str):
    """Save updated canvas to redis"""
    # send image to redis
    log.info("Saving image on key %s, with websocket id %s", studentKey, websocket.id)
    imageURL = messageJSON["imageURL"]
    pageNumber = messageJSON["pageNumber"]

    if redisServer.exists(studentKey):
        log.info("Updating hostPage object for %s", studentKey)
        
        pages: hostPages = loadHostPagesFromJSON(redisServer.get(studentKey))
        pages.updatePage(imageURL, pageNumber)
        redisServer.set(studentKey, pages.toJson())
    else:
        log.info("Created new hostPage object for %s", studentKey)

        pages: hostPages = hostPages([imageURL], studentKey)
        redisServer.set(studentKey, pages.toJson())


    log.info("Set image in redis for studentKey %s", studentKey)

    response = canvasUpdateSuccess()
    response.pageNumber = pageNumber 
    websockets.broadcast(connected, response.toJson())
    #await websocket.send(response.toJson())#send canvas updated "Successfully processed canvas update"


async def canvasDrawUpdate(websocket, messageJSON, connected, studentKey: str):
    """Send draw instructions to students"""
    # send image to redis
    # send updates to students
    log.info("Sending out stroke on key %s, with websocket id %s",
             studentKey, websocket.id)

    broadcast = canvasDrawUpdateBroadcast() #broadcast.type="canvasDrawUpdateBroadcast"
    broadcast.drawData = messageJSON["drawData"]#broadcast.drawData=drawInstruction array from teacher
    broadcast.page= messageJSON["page"]
    broadcast.eraser= messageJSON["requestER"]
    broadcast.srcID = str(websocket.id)
    websockets.broadcast(connected, broadcast.toJson())

    response = canvasUpdateSuccess()
    await websocket.send(response.toJson())#send canvas updated "Successfully processed canvas update"

async def retrieveImage(studentKey,response):
    if redisServer.exists(studentKey):
        pages: hostPages = loadHostPagesFromJSON(redisServer.get(studentKey))
        response.imageURL=pages.getLatestPage()
        response.pageNumber= pages.getLatestPageNumber()

async def fetchPage(studentKey, response, pageNumber):
    if redisServer.exists(studentKey):
        pages: hostPages = loadHostPagesFromJSON(redisServer.get(studentKey))
        response.imageURL=pages.getPage(pageNumber)
    
async def wipestudent(websocket, messageJSON, connected, studentKey: str):
    response = clearpage();
    websockets.broadcast(connected, response.toJson())

async def resett(websocket, messageJSON, connected, studentKey: str):
    response = clearpage();
    websockets.broadcast(connected, response.toJson())

async def imageToText(websocket, studentKey, response, pageNumber):
    if redisServer.exists(studentKey):
        pages: hostPages = loadHostPagesFromJSON(redisServer.get(studentKey))
        response.imageURL = pages.getPage(pageNumber)
    await websocket.send(response.toJson())

async def textToSpeech(websocket, studentKey, response):
    response.convertedAudio = createAudio(response.inputText)
    await websocket.send(response.toJson())

async def fetchImage(studentKey, response, pageNumber):
    if redisServer.exists(studentKey):
        pages: hostPages = loadHostPagesFromJSON(redisServer.get(studentKey))
        response.imageURL=pages.getPage(pageNumber) 

async def canvasNewPage(websocket, messageJSON, connected, studentKey: str):
    log.info("Adding new page on websocket %s", websocket.id)
    response = newPageCreated()
    websockets.broadcast(connected, response.toJson())


async def newPageInsert(websocket, messageJSON, connected, studentKey: str):
    imageURL = messageJSON["imageURL"]
    pageNumber = messageJSON["pageNumber"]
    log.info("Inserted new page on websocket %s", websocket.id)
    
    pages: hostPages = loadHostPagesFromJSON(redisServer.get(studentKey))
    pages.insertnewPage(imageURL, pageNumber)
    redisServer.set(studentKey, pages.toJson())
    
    response = NewpagesInserted(pageNumber)
    websockets.broadcast(connected, response.toJson())     