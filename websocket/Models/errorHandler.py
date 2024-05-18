from Models.responses import error


async def sendError(websocket, message):
    """Send an error response with message"""
    event = error()
    event.message = message
    await websocket.send(event.toJson())
