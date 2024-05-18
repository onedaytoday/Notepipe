import logging
import secrets
import json
import websockets
from Controllers.CanvasController import canvasUpdate, canvasDrawUpdate, retrieveImage, newPageInsert, imageToText, resett, fetchPage, fetchImage, canvasNewPage, textToSpeech

from Models.responses import initializeHostSuccess, initializeStudentSuccess, imageToTextRequest, textToSpeechRequest, pageFetched, imageFetched
from Models.errorHandler import sendError
from Models.userList import userList
from Models.userList import userObject
from OCR.imageToText import readImage, rearrangeLines, reorderWords
from Models.responses import endHighlightStroke, followHost

log = logging.getLogger(__name__)

# hostKey: studentKey
HOST_KEYS = {str: str}
# studentKey: list of connected websockets
JOINED = {str: list}
# studentKey: userList
USERS = {str: userList}

async def createStudentKey():
    studentKey = secrets.token_urlsafe(16)
    while studentKey in JOINED:
        studentKey = secrets.token_urlsafe(16)
    return studentKey


async def createHostKey():
    hostKey = secrets.token_urlsafe(16)
    while hostKey in HOST_KEYS:
        hostKey = secrets.token_urlsafe(16)
    return hostKey


async def initializeHost(websocket):
    """ Create keys and initialize a room """
    hostKey = await createHostKey()
    studentKey = await createStudentKey()
    log.info("Created keys for websocket %s", websocket.id)

    # associate host key with student key
    # Store list of connections to be broadcasted to
    HOST_KEYS[hostKey] = studentKey
    JOINED[studentKey] = {websocket}
    USERS[studentKey] = userList(studentKey, {websocket.id: userObject(str(websocket.id), "Instructor", True, True)})

    response = initializeHostSuccess()
    response.hostKey = hostKey
    response.studentKey = studentKey
    response.id = str(websocket.id)

    try:
        await websocket.send(response.toJson())
        log.info("Successfully opened connection with host %s", websocket.id)
        await hostConnection(websocket, hostKey, studentKey)
    finally:
        # this will need to be changed to allow a reconnect.
        # this drops connections as soon as host loses connection
        del HOST_KEYS[hostKey]

        # Some kind of way to deal with teacher dropping
        USERS[studentKey].removeUser(websocket.id, JOINED[studentKey])


async def hostConnection(websocket, hostKey, studentKey):
    """Process messages for a host connection, loops until disconnected"""
    users = USERS[studentKey]
    async for message in websocket:
        messageJSON = json.loads(message)
        log.info("Received message from host websocket %s with message type %s", websocket.id, messageJSON["type"])
        match messageJSON["type"]:
            case "canvasUpdate":#image
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])
            case "canvasDrawUpdate":#array
                await canvasDrawUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])
            case "Addnewpage":
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey]) 
                await canvasNewPage(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])        
            case "newPageInsert":
                await newPageInsert(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])     
            case "resetcanvas":
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])         
                await resett(websocket, messageJSON, JOINED[studentKey], HOST_KEYS[hostKey])
            case "updateName":
                users.updateUserName(websocket.id, messageJSON["newName"], JOINED[studentKey])
            case "retrieveUserList":
                await users.fullUserList(websocket)
            case "updateUserPermission":
                users.updateUserPermissions(messageJSON["id"], messageJSON["allowBroadcast"], JOINED[studentKey])
            case "endHighlightStroke":
                websockets.broadcast(JOINED[studentKey], endHighlightStroke(
                    str(websocket.id)).toJson())
            case "followHost":
                response = followHost()
                response.pageNumber= messageJSON["pageNumber"]
                websockets.broadcast(JOINED[studentKey], response.toJson())



async def initializeStudent(websocket, studentKey, image, name):
    """Check for valid key and add connection to host's connections"""
    try:
        connected = JOINED[studentKey]
        users = USERS[studentKey]
    except KeyError:
        await sendError(websocket, "Invalid Key")
        return

    connected.add(websocket)
    # Maybe add some kind of name randomizer
    users.addUser(websocket.id, userObject(str(websocket.id), name, False, False), JOINED[studentKey])


    response = initializeStudentSuccess()
    response.studentKey = studentKey
    response.id = str(websocket.id)
    await retrieveImage(studentKey,response)

    try:
        await websocket.send(response.toJson())
        log.info("Successfully opened connection with student %s", websocket.id)
        await studentConnection(websocket, studentKey)
    finally:
        connected.remove(websocket)
        users.removeUser(websocket.id, JOINED[studentKey])


async def studentConnection(websocket, studentKey):
    """Process messages for a student connection, loops until disconnected"""
    users = USERS[studentKey]
    async for message in websocket:
        messageJSON = json.loads(message)
        log.info("Received message from student websocket %s with message type %s",
                 websocket.id, messageJSON["type"])

        match messageJSON["type"]:
            # Button events
            case "imageToText":
                try:
                    response = imageToTextRequest()
                    response.studentKey = studentKey
                    await imageToText(websocket, studentKey, response,messageJSON["pageNumber"])
                    response.convertedText = rearrangeLines(reorderWords(readImage(response.imageURL)))
                    await websocket.send(response.toJson())
                    log.info("image was retrieved %s", response.imageURL)
                except Exception as e:
                    log.error("Failed to convert image to text")

            case "textToSpeech":
                response = textToSpeechRequest()
                response.studentKey = studentKey
                response.inputText = messageJSON["inputText"]
                await textToSpeech(websocket, studentKey, response)
                await websocket.send(response.toJson())
                log.info("text was converted to speech %s", response.convertedAudio)

            case "fetchPage":
                log.info("Fetching image for page %s", messageJSON["pageNumber"])

                try:
                    response = pageFetched()
                    response.studentKey = studentKey
                    response.pageNumber= messageJSON["pageNumber"]
                    await fetchPage(studentKey, response, messageJSON["pageNumber"])
                    await websocket.send(response.toJson())
                except Exception as e:
                    log.info("Failed to fetch image: %s", e)
                    sendError(websocket, "Failed to fetch image")
                log.info("fetched page and image is "+response.imageURL)
            
            case "fetchImage":
                log.info("Fetching image for page %s", messageJSON["pageNumber"])

                try:
                    response = imageFetched()
                    response.studentKey = studentKey
                    response.pageNumber= messageJSON["pageNumber"]
                    await fetchImage(studentKey, response,messageJSON["pageNumber"])
                    await websocket.send(response.toJson())
                except Exception as e:
                    log.info("Failed to fetch image: %s", e)
                    sendError(websocket, "Failed to fetch image")
                log.info("fetche image is "+response.imageURL)
            case "updateName":
                users.updateUserName(websocket.id, messageJSON["newName"], JOINED[studentKey])
            case "retrieveUserList":
                #get the whole user's list
                await users.fullUserList(websocket)
            case "canvasUpdate":  # image
                await canvasUpdate(websocket, messageJSON, JOINED[studentKey], studentKey)
            case "canvasDrawUpdate":  # array
                await canvasDrawUpdate(websocket, messageJSON, JOINED[studentKey], studentKey)
            case "endHighlightStroke":
                websockets.broadcast(
                    JOINED[studentKey], endHighlightStroke(str(websocket.id)).toJson())


