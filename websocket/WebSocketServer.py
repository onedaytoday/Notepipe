#!/usr/bin/env python

import asyncio
import json
import websockets
import logging
import sys
import os

from Controllers.ConnectionController import initializeHost, initializeStudent
from Models.errorHandler import sendError

logging.basicConfig(stream=sys.stdout, level=logging.INFO)

class LoggerAdapter(logging.LoggerAdapter):
    """Add connection ID and client IP address to websockets logs."""
    def process(self, msg, kwargs):
        try:
            websocket = kwargs["extra"]["websocket"]
        except KeyError:
            return msg, kwargs
        
        try:
            xff = websocket.request_headers.get("X-Forwarded-For")
        except AttributeError:
            xff = ""
        return f"{websocket.id} {xff} {msg}", kwargs


async def handler(websocket):
    """Handle initial connections to websocket"""
    while True:
        try:
            message = await websocket.recv()
            messageJSON = json.loads(message)

            match messageJSON["type"]:
                case "initializeHost":
                    await initializeHost(websocket)
                case "initializeStudent":
                    await initializeStudent(websocket, messageJSON["studentKey"], messageJSON["image"], messageJSON["name"])

        except websockets.ConnectionClosedOK:
            break
        except KeyError:
            await sendError(websocket, "Missing required key/value pair")
            return
#   SSL stuff, does not work since we don't have a valid SSL certificate
#   ssl_context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
#   localhost_pem = pathlib.Path(__file__).with_name("localhost.cer")
#   ssl_context.load_cert_chain(localhost_pem)
#   Use this if we ever implement it
#     async with websockets.serve(handler, "", 8001, ssl=ssl_context):


async def main():
    hosts = ["https://notepipe.net", "https://notepipe.io",
             "https://coral-app-55tcu.ondigitalocean.app", "https://notepi.pe", "http://localhost:8080"]
    port = os.environ.get("PORT")
    max_size = 5 * 1048576
    async with websockets.serve(handler, "0.0.0.0", port, subprotocols=["json"], logger=LoggerAdapter(logging.getLogger("websockets.server")), max_size=max_size, origins=hosts):
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())
