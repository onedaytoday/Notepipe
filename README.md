# Introduction
Barebones prototype of note livestreaming, does not include most features.

# Requirements
Check requirements.txt for more info

* websockets 10.3
* Python 3.10.6

# How to Run
Run ```build.sh``` to start docker for the application. It will launch the website on the port specified, default port 80.

Before using the OCR functionality, perform the following actions:
* Create a file named 'credentials.json' in the 'OCR' folder.
* Copy the contents of 'sample_credentials.json' (located in the same folder) to 'credentials.json'
* Replace the fields marked "XXXXXX" with the actual values you are provided with. 

# TODO

* Marker properties and erase feature
* Homepage to generate teacher view and student views
* Currently a bug where resizing window erases canvas locally
* Mostly no error handling implemented
* Need debug messages for client and server
* Need unit tests and integeration tests

# Adding a Button or Feature

## Front End
* Add an html button to the html file and assign it a unique id 
    * OR trigger an event some other way
* Attach an event listener to it in the JavaScript file
* Make the function that the event listener will run
    * Create a JSON message to the web socket and send it to it

## Back End
* Add the message type case to the match(switch) in the correct connection in ```ConnectionController.py```
* Process the message: create a new module/function to handle the message in the match case

### Sending a Response To Client
* Create a new response template in ```responses.py```
* Create a response object during the message processing
* Send the message by using: 
    * ```websocket.send(MyResponse.toJson)``` (Thats an object named websocket). This will send a message to a single connection
    * ```websockets.broadcast(connected, MyResponse.Json)``` where connected is a list of websocket objects. This will broadcast to all websockets on the list
        * Note that it is ```websockets.broadcast``` not ```websocket.broadcast```