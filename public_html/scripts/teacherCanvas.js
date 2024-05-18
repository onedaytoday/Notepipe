// Connect to websocket

serverURL = getWebSocketServer();

function getWebSocketServer() {
    if (window.location.host === "localhost:8080") {
        return "ws://localhost:8001/";
    } if (window.location.host === "coral-app-55tcu.ondigitalocean.app" || window.location.host === "notepipe.net" || window.location.host === "notepipe.io" || window.location.host === "notepi.pe") {
        return "wss://seahorse-app-hvogi.ondigitalocean.app/notepipe-websocket2";
    }
    else {
        throw new Error(`Unsupported host: ${window.location.host}`);
    }
}


// DO NOT LAUNCH THIS INTO A PROD ENVIRONMENT WITH "rejectUnauthorized: false"
var websocket = new WebSocket(serverURL, "json");
console.log("Connected to Websocket");



// Copied canvas code
// create canvas element and append it to document body
var canvas = document.getElementById("drawingCanvas")
var highlightCanvas = document.getElementById("highlightCanvas");

// some hotfixes... ( ≖_≖)
document.body.style.margin = 0;
canvas.style.position = 'absolute';
highlightCanvas.style.opacity = 0.5;

// get canvas 2D ctx and set him correct size
var ctx = canvas.getContext('2d');
var highlightCtx = highlightCanvas.getContext('2d');

// Make our in-memory canvas stack for undos
var canvasStack = [canvas];
// used to check whether this is the first undo since that would be equal to the current state
var undoHasBeenDone = false;

var highlightDraw = false;

var minCanvasHeight = 1080;
var minCanvasWidth = 2160;

ctx.canvas.width = Math.max(window.innerWidth, minCanvasWidth);
ctx.canvas.height = Math.max(window.innerHeight, minCanvasHeight);
highlightCtx.canvas.width = Math.max(window.innerWidth, minCanvasWidth);
highlightCtx.canvas.height = Math.max(window.innerHeight, minCanvasHeight);

// last known position
var pos = { x: 0, y: 0 };

var sentImage = false;

window.addEventListener('resize', resize);
highlightCanvas.addEventListener('pointermove', move, {capture: true, });

// Release mouse capture when not touching screen
highlightCanvas.addEventListener('pointerup', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if(sentImage == false) {
        sendStroke(e);
        sentImage = true;
        
    }
}, {capture: true, });
highlightCanvas.addEventListener('pointercancel', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if(sentImage == false) {
        sendStroke(e);
        sentImage = true;
    }
}, {capture: true, });
highlightCanvas.addEventListener('pointerenter', (e) => {
    isPointerDown = false;
    lastPoint = undefined;
    if(sentImage == false) {
        sendStroke(e);
        sentImage = true;
    }
}, {capture: true, });

highlightCanvas.style.touchAction = "manipulation";

// Listen for websocket messages and when initialization finished
websocket.addEventListener('message', processMessage);
websocket.addEventListener('open', initializeHost)
window.addEventListener("beforeunload",function(e) {e.returnValue ='Are you sure you want to leave?'});

var pageNumber = 0;
var viewingPageNumber=0; //will keep track of current page being displayed (next/prev function)

//for name change
var newName = '' // what client chooses new username to be
const updateName = document.getElementById('updateName');
updateName.addEventListener('click', editName);
//listen for input for edit name using input box in teacher.html

window.addEventListener('input', (e) =>{
    //console.log('new name: ', e.target.value);
    newName = e.target.value;
}) 


// get html elements
updateMessageElement = document.getElementById("updateStatus");
studentLinkElement = document.getElementById("studentLink");
studentLinkAnchorElement = document.getElementById("studentLinkAnchor");
currentPageNumberElement = document.getElementById('currentPageNumber');
showUserListElement = document.getElementById("showUserList");

var showUserListBool=false;

function triggerUserList(){
    if(showUserListBool){
        clearUserList()
        showUserListBool = false
    } else {
        console.log("user list has been requested ")
        getUserlist()
        showUserListBool = true
    }
    showUserListElement.checked = showUserListBool;
}

function getUserlist(){
    clearUserList()
    const event = {type: "retrieveUserList"};
    websocket.send(JSON.stringify(event))
}

function clearUserList(){
    const container = document.getElementById("userList");
    container.innerHTML="";
    var full= '<div id="Users"></div>'
    container.insertAdjacentHTML("beforeend", full)
    localUserListID=[]
    localUserListName=[]
}

//instructor image saved locally
var localImages=[];
const TemplocalImages= [];
var incomingDrawInstructions = [[]];

//save button
var updateSaveoption=document.getElementById('newpage')
updateSaveoption.addEventListener('click', newpage)

function newpage(){
    localImages[viewingPageNumber] = canvas.toDataURL("image/png", 0.2);
    //for now teacher cannot go to previous page and use save function
    if(pageNumber==viewingPageNumber){
        pageNumber++;
        viewingPageNumber++;
        incomingDrawInstructions.push([]);
        console.log("Adding new page number: ",pageNumber)
        var imageURL = canvas.toDataURL("image/png", 0.2);
        
        var message = {
            type: "Addnewpage",
            pageNumber: pageNumber,
            imageURL,
        }
        websocket.send(JSON.stringify(message));
        //clear the current page
        width = canvas.width;
        height = canvas.height;  
        ctx.clearRect(0, 0, width, height);
        

        /*save the newly created page so student's that 
        join late have current page and not previous page*/
        sendUpdate();
        imageURL = canvas.toDataURL("image/png", 0.2);//updating canvas image
        localImages[localImages.length]=imageURL//it is a new page so it should be at index length
        setCurrentPageText();
    }
    else{
      
        pageNumber++;
        viewingPageNumber++;
        console.log("Adding new page number: ",pageNumber)
        var imageURL = canvas.toDataURL("image/png", 0.2);
 
        width = canvas.width;
        height = canvas.height;  
        ctx.clearRect(0, 0, width, height);

        var message = {
            type: "newPageInsert",
            pageNumber: viewingPageNumber,
            imageURL,
        }  
        websocket.send(JSON.stringify(message));
        sendUpdate();
        setCurrentPageText();
        imageURL = canvas.toDataURL("image/png", 0.2);//updating canvas image
       
        localImages.splice(viewingPageNumber,0,imageURL)
        incomingDrawInstructions.splice(viewingPageNumber, 0, [])
        setCurrentPageText();
    }

}

// resize canvas
function resize() {
    var copyCanvas = document.createElement('canvas');
    var copyCanvasCtx = copyCanvas.getContext("2d"); 
    // creates another canvas to store values to
    copyCanvas.width = canvas.width;
    copyCanvas.height = canvas.height;
    // set the new canvas equal to the prevoius 
    copyCanvasCtx.drawImage(canvas, 0, 0);
    // if the page got smaller then we keep the orignal size and if the page got bigger with increase the canvas size
    ctx.canvas.width = Math.max(window.innerWidth, ctx.canvas.width);
    ctx.canvas.height = Math.max(window.innerHeight, ctx.canvas.height);
    // copy the canvas back by redrawing it
    ctx.drawImage(copyCanvas, 0, 0);
}

function undo(){
    if(canvasStack.length < 1)
        return; 

    if(!undoHasBeenDone){
        if(canvasStack.length == 1)
            return;
        lastCanvas = canvasStack.pop();
    }   
    
    var lastCanvas = canvasStack.pop();

   
    undoHasBeenDone = true;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(lastCanvas, 0,0);

    if(canvasStack.length == 0){
        undoHasBeenDone = false;
        var copyCanvas = document.createElement('canvas');
        var copyCanvasCtx = copyCanvas.getContext('2d');
        copyCanvas.width = canvas.width;
        copyCanvas.height = canvas.height;
        copyCanvasCtx.drawImage(canvas, 0, 0);
        canvasStack.push(copyCanvas);    
    }
}

//var updatereset=document.getElementById('reset')
//updatereset.addEventListener('click', reset)

function reset(){
    console.log("reset page : ",pageNumber)
    var imageURL = canvas.toDataURL("image/png", 0.2);
    
    var message = {
        type: "resetcanvas",
        pageNumber: pageNumber,
        imageURL,
    }
    websocket.send(JSON.stringify(message));
    //clear the current page
    width = canvas.width;
    height = canvas.height;  
    ctx.clearRect(0, 0, width, height);
    imageURL = canvas.toDataURL("image/png", 0.2);//updating canvas image  

    sendUpdate();
}

//default settings for marker
var lastPoint = undefined;
var force = 1;//marker thickness
var color = "red";//marker color
var drawInstructions = [];
var markerWidth = 5;
var eraserWidth = 5;
var drawWidth = 5;
var allowDraw = false;

var isPointerDown = false;

function sendStroke(e){
    sendDrawUpdate();//will send strokes to clients
    sendUpdate();//store canvas image to redis 
}
var eraserState = false;

function sendDrawUpdate(){
    websocket.send(JSON.stringify({//send array containing x,y corrdinate of strokes
        type: 'canvasDrawUpdate',
        drawData: drawInstructions,
        page: viewingPageNumber,
        requestER: eraserState
    }));
    drawInstructions = [];//reset the array for next use
    console.log("Sent Batch Draw Update");
}

function createAndSaveCanvas(){
    var copyCanvas = document.createElement('canvas');
    var copyCanvasCtx = copyCanvas.getContext('2d');
    copyCanvas.width = canvas.width;
    copyCanvas.height = canvas.height;
    copyCanvasCtx.drawImage(canvas, 0, 0);
    canvasStack.push(copyCanvas);
     if(canvasStack.length > 5)
        canvasStack.shift();
    undoHasBeenDone = false;
}

// Send canvas updates, triggered by click end
function sendUpdate() {
    createAndSaveCanvas();
    console.log("Sending canvas")
    var imageURL = canvas.toDataURL("image/png", 0.2);
    var message = {
        type: "canvasUpdate",
        pageNumber: viewingPageNumber,
        imageURL,
    }
    websocket.send(JSON.stringify(message))
}

// Change width of the marker based on input from a HTML slider
function changeWidth(newWidth) {
    enableTouch();
    drawWidth = newWidth;
    ctx.globalCompositeOperation = 'source-over';
};

//Stroke color selection based off HTML button choice
function changeColor(newColor) {
    enableTouch();
    markerWidth = drawWidth;
    highlightDraw = false;
    color = newColor;
    eraserState= false;
    ctx.globalCompositeOperation = 'source-over';
  };


// Eraser
function eraser() {
    enableTouch();
    eraserState = true;
    highlightDraw = false;
    // Erasing by using destination image to be on top of the drawn image in source image
    // ctx.globalCompositeOperation = "destination-out";
    console.log("Image erased: ", pageNumber)
};


function startHighlight() {
    enableTouch();
    highlightDraw = true;
    eraserState = false;
}

var currentlyHighlighting = false;

function draw(data) {
    var currentCtx = ctx;
    if (data.highlightDraw) {
        currentCtx = highlightCtx;
    }
    currentCtx.globalCompositeOperation = data.eraserState ? "destination-out" : "source-over"
    currentCtx.strokeStyle = data.color;//original default stroke color 
    currentCtx.lineWidth = data.force;//stroke width
    currentCtx.lineCap = 'round';
    if (data.highlightDraw) {
        currentCtx.globalCompositeOperation = "multiply"; currentCtx.strokeStyle = "#FF0"; currentCtx.globalAlpha = 1; currentCtx.lineWidth = 40;
    }



    currentCtx.beginPath();
    currentCtx.moveTo(data.lastPoint.x, data.lastPoint.y);//the x,y corrdinate of the last point
    currentCtx.lineTo(data.x, data.y);//add a straight line from last point to current point

    currentCtx.stroke();//outlines the current or given path with the current stroke style
    currentCtx.globalCompositeOperation = "source-over";
}

function move(e) {
    e.preventDefault();
    // equation for determinng force, didn't research much, just used feel. Could use improvements.
    if(e.pointerType === "pen"){
        force = Math.log10(Math.pow(e.pressure * (Math.abs(e.tiltX || 90) / 90) * 0.2 + 0.15, 1.5)) + 1.2 || 1;
        force = Math.min(15 * Math.pow(force || 1, 4) * (markerWidth + 2), markerWidth);
    } else {
        //force = markerWidth;
        if (eraserState === true) {
            force = eraserWidth;
        }
        else {
            force = drawWidth;
        }
    }
    
    if ((e.buttons || isPointerDown) && allowDraw) {
        if (typeof lastPoint == 'undefined') {
            lastPoint = { x: e.offsetX, y: e.offsetY };//this is the inital stroke, we are storing it's x,y coordinate
            return;
        }

        currentlyHighlighting = highlightDraw;;
        


        draw({
            lastPoint,//the x,y coordinate of the last stroke
            x: e.offsetX,//x-coordinate of the mouse pointer relative to the document
            y: e.offsetY,//y-coordinate of the mouse pointer relative to the document
            force: force,
            color: color || 'green',
            eraserState,
            highlightDraw
        });

        drawData = JSON.stringify({
            lastPoint,
            x: e.offsetX,
            y: e.offsetY,
            color: color || 'green',
            force: force,
            eraserState,
            highlightDraw
        });

        drawInstructions.push(drawData);//store drawData in drawInstructions
        if(drawInstructions.length >= 100){//when drawInstruction has 100 entries, send the array
            sendDrawUpdate();
        } else {
            sentImage = false;
        }

        lastPoint = { x: e.offsetX, y: e.offsetY };//update lastPoint to be the stroke we just processed 
    } else {
        if(highlightDraw && currentlyHighlighting){
            // Send a message that draw has ended, should trigger highlight to be drawn onto canvas
            websocket.send(JSON.stringify({
                type: "endHighlightStroke"
            }))
            layerHighlightCanvas(ctx);
            currentlyHighlighting = false;
        }
        lastPoint = undefined;//mouse button has been released, this will trigger sendStroke so reset lastpoint
    }
}

function layerHighlightCanvas(ctx){
    ctx.globalAlpha = 0.5;
    //ctx.globalCompositeOperation = "multiply";
    ctx.drawImage(highlightCanvas, 0, 0);
    ctx.globalAlpha = 1;
    //ctx.globalCompositeOperation = "source-over";
    highlightCtx.clearRect(0, 0, highlightCanvas.width, highlightCanvas.height);
    sendUpdate();
}

// Initialize connection to host
function initializeHost() {
    const event = { type: "initializeHost"};
    websocket.send(JSON.stringify(event))
    sendUpdate();
}

const zipfolder = document.getElementById('zipFolder');
zipfolder.addEventListener('click', zipFolderbutton);

//Download a zip folder
function zipFolderbutton(e) {
    var zip = new JSZip();
    index = 0;   
    function Buffer(url, callback) {
        var ctx = new XMLHttpRequest();
        ctx.open("GET", url);
        ctx.responseType = "arraybuffer";
        ctx.onload = function() {
            if (ctx.status == 200) {
                callback(ctx.response, url)
            }

        };
        ctx.send();
    }

    (function load() {
        if (index < localImages.length) {
            Buffer(localImages[index++], function(buffer, url) {
                zip.file(index+"page.png", buffer); 
                load(); 
            })
        }
        else {                         
            zip.generateAsync({type:"blob"}).then(function(content) {
                saveAs(content, "LectureNote.zip");// save as LectureNote
            });  
        }
    })();
}   

const download = document.getElementById('download');
download.addEventListener('click', downloadbutton);

function downloadbutton(e) {
    console.log(canvas.toDataURL());
    const link = document.createElement('a');
    link.download = 'download.png';
    link.href = canvas.toDataURL();
    link.click();
    link.delete;
};     


//implement previous and next page requests 
var image = new Image();
nextPageElement=document.getElementById('nextPage');
previousPageElement= document.getElementById('previousPage');

nextPageElement.addEventListener('click', function (){
    navigateToPage(viewingPageNumber+1)});
previousPageElement.addEventListener('click', function (){
    navigateToPage(viewingPageNumber-1)});

function navigateToPage(pageWanted){
    localImages[viewingPageNumber] = canvas.toDataURL("image/png", 0.2);
    if(pageWanted>=0 && pageWanted<=pageNumber){
        //clear the current page
        width = canvas.width;
        height = canvas.height;  
        ctx.clearRect(0, 0, width, height);

        image.src=localImages[pageWanted]
        image.onload = function() {//wait for image to load before trying to draw to canvas
            ctx.drawImage(image, 0, 0);

            if (incomingDrawInstructions[pageWanted].length != 0) {
                console.log("draw instructions need to execute");
                incomingDrawInstructions[pageWanted].forEach((currInstructions) => {
                    currInstructions.forEach((stroke) => {
                        draw(stroke, ctx);
                    });
                });

                incomingDrawInstructions[pageWanted] = [];
                layerHighlightCanvas(ctx);
            }
        }
        viewingPageNumber = pageWanted;
        setCurrentPageText();
        const event= {type: "followHost", pageNumber: viewingPageNumber}
        websocket.send(JSON.stringify(event))
    }
        
}

var localUserListID=[]
var localUserListName=[]
var broadcastingList=[]
var absoluteJoinLink = "";
var userListHtmlId= "Users"

var websocketID = "";
// Handle messages sent to client
function processMessage({ data }) {
    const event = JSON.parse(data);
    console.log(event)
    switch(event.__type__){
        case "canvasUpdateSuccess":
            updateMessageElement.textContent="Content Sent";
            break;
        case "initializeHostSuccess": 
            console.log("Successfully initialized host");

            websocketID = event.id;
            link = "student.html?key=" + event.studentKey;
            studentLinkElement.textContent="\tJoin Key: " + event.studentKey;
            studentLinkAnchorElement.href=link;

            absoluteJoinLink = "https://" + window.location.host + "/canvas/" + link;
            generateQRCode(absoluteJoinLink);
            break;
        case "fullUserList":
            newObj = JSON.parse(event.names);
            var tmpContent = "";
            var headerId="";
            for (const [key, value] of Object.entries(newObj)) {
                headerId=value.id+"#"
                if(value.name== "Instructor"){
                    tmpContent= "<h4 id='"+headerId+"'>"+value.name+"</h4> <button id='"+value.id+"' class='activeButton'> Broadcasting</button>"
                }  
                else{
                    if(value.canBroadcast)
                        tmpContent= "<h4 id='"+headerId+"'>"+value.name+"</h4> <button id='"+value.id+"' onclick='canBroadcast(this.id)' class='activeButton'> Broadcasting</button>"
                    else
                        tmpContent= "<h4 id='"+headerId+"'>"+value.name+"</h4> <button id='"+value.id+"' onclick='canBroadcast(this.id)' class='inactiveButton'> Allow Broadcast</button>"
                }
                if(localUserListID.length == 0)
                    document.getElementById("Users").insertAdjacentHTML("afterend", tmpContent);
                else{
                    document.getElementById(localUserListID[localUserListID.length-1]).insertAdjacentHTML("afterend", tmpContent);
                }

                //store into local arrays
                localUserListID.push(value.id)
                localUserListName.push(value.name)
            }
            break
        case "removeUserFromList":
            if(showUserListBool){
                var headerId=event.id+"#"
                document.getElementById(headerId).remove()//delete the name 
                document.getElementById(event.id).remove()//delete the button

                //update local arrays
                found = localUserListID.findIndex(element => element == event.id);
                localUserListID.splice(found,1)
                localUserListName.splice(found, 1)

                if(event.canBroadcast){
                    found =broadcastingList.findIndex(element => element == event.id);
                    broadcastingList.splice(found,1)
                    for(i=0; i<broadcastingList.length; i++){
                        console.log(broadcastingList[i])
                    }
                }
            }
            break
        case "updateUserName":
            if(showUserListBool){
                //delete current user name from user list html
                var headerId=event.id+"#"
                document.getElementById(headerId).remove()//delete the name 
                document.getElementById(event.id).remove()//delete the button

                //delete from user name from local arrays
                found = localUserListID.findIndex(element => element == event.id);
                localUserListID.splice(found,1)
                localUserListName.splice(found, 1)

                //add updated name to local arrays 
                localUserListName.push(event.name)//add name to list
                localUserListName.sort()//sort the list
                found = localUserListName.findIndex(element => element == event.name);//find index of new name
                localUserListID.splice(found, 0, event.id)//insert user id in proper index

                //check if user had broadcasting privilage 
                if(event.canBroadcast)
                    tmpContent= "<h4 id='"+headerId+"'>"+event.name+"</h4> <button id='"+event.id+"' onclick='canBroadcast(this.id)' class='activeButton'> Broadcasting</button>"
                else
                    tmpContent= "<h4 id='"+headerId+"'>"+event.name+"</h4> <button id='"+event.id+"' onclick='canBroadcast(this.id)' class='inactiveButton'> Allow Broadcast</button>"

                //insert alphabetical location
                if(found == 0){//insert at the beginning of the list
                    document.getElementById("Users").insertAdjacentHTML("afterend",tmpContent);
                }
                else{//insert anywhere else 
                    document.getElementById(localUserListID[found-1]).insertAdjacentHTML("afterend",tmpContent);
                }
            }
            break;
        case "newUserJoined":
            if(showUserListBool){
                localUserListName.push(event.name)//add name to list
                localUserListName.sort()//sort the list
                found = localUserListName.findIndex(element => element == event.name);//find index of new user
                localUserListID.splice(found, 0, event.id)//insert user id in proper index

                //create the name and button that needs to be added
                var headerId=event.id+"#"
                tmpContent= "<h4 id='"+headerId+"'>"+event.name+"</h4> <button id='"+event.id+"' onclick='canBroadcast(this.id)' class='inactiveButton'> Allow Broadcast</button>"

                if(found == 0){//insert at the beginning of the list
                    document.getElementById("Users").insertAdjacentHTML("afterend",tmpContent);
                }
                else{//insert anywhere else 
                    document.getElementById(localUserListID[found-1]).insertAdjacentHTML("afterend",tmpContent);
                }
            }
            sendHostViewingPage(viewingPageNumber);
            break;
        case "canvasDrawUpdateBroadcast"://event.__type__= "canvasDrawUpdateBroadcast"
            console.log("Updating Draw Instructions");
            if (event.srcID == websocketID) {
                return;
            }
            if (event.page == viewingPageNumber) {
                if (drawAnimations) {
                    currentDrawInstructions = currentDrawInstructions.concat(event.drawData);
                    currentFrames.push(window.requestAnimationFrame(animateDraw));
                } else {
                    event.drawData.forEach((element) => {//loop through each value
                        element = JSON.parse(element);
                        draw(element, ctx);//just output the stroke 
                    });
                }
            } else {
                parsedInstructions = []
                event.drawData.forEach((element) => {//loop through each value
                    element = JSON.parse(element);
                    parsedInstructions.push(element);
                });

                incomingDrawInstructions[event.page].push(parsedInstructions);
            }
            break;
        case "endHighlightStroke":
            if(event.srcID == websocketID){
                return;
            }
            processHighlight = true;
            break;
    }
}

function sendHostViewingPage(viewingPageNumber){
    const message= {type: "followHost", pageNumber: viewingPageNumber}
    websocket.send(JSON.stringify(message))
}

function grantBroadcastingPrivilege(id){
    grantPermission = { type: "updateUserPermission", id: id, allowBroadcast:true};
    websocket.send(JSON.stringify(grantPermission))
    document.getElementById(id).innerHTML="Broadcasting"
    document.getElementById(id).className = 'activeButton'
}

function removeBroadcastingPrivilege(id){
    removePermission = { type: "updateUserPermission", id: id, allowBroadcast:false};
    websocket.send(JSON.stringify(removePermission))
    document.getElementById(id).innerHTML="Allow Broadcast"    
    document.getElementById(id).className = 'inactiveButton'
}

//var broadcastingStudent=undefined;
function canBroadcast(id){
    found =broadcastingList.findIndex(element => element == id);
    if(found < 0){
        grantBroadcastingPrivilege(id)
        broadcastingList.push(id)
    }
    else{
        removeBroadcastingPrivilege(id)
        broadcastingList.splice(found,1)
    }
    for(i=0; i<broadcastingList.length; i++){
        console.log(broadcastingList[i])
    }
}

document.onkeydown = checkKey;

function checkKey(e) {

    e = e || window.event;

    if (e.keyCode == '38') {
        // up arrow
        markerWidth += 1;
    }
    else if (e.keyCode == '40') {
        // down arrow
        markerWidth -= 1;
    }

}

function generateQRCode(codeContent) {
    const qrcode = new QRCode(document.getElementById('qrcode'), {
        text: codeContent,
        width: 350,
        height: 350,
        colorDark : '#000',
        colorLight : '#fff',
        correctLevel : QRCode.CorrectLevel.H
    });
}

function copyJoinKey() {
    // TO DO get join key text
    navigator.clipboard.writeText(absoluteJoinLink);

    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copied";
}

function copyKeyOutFunc() {
    var tooltip = document.getElementById("myTooltip");
    tooltip.innerHTML = "Copy key to clipboard";
}

function setCurrentPageText() {
    currentPageNumberElement.textContent = (viewingPageNumber + 1).toString() + "/" + (pageNumber + 1).toString();
}
//edit name
function editName(){
    console.log('editName button was clicked and function called');
    const request = {type: "updateName", newName: newName}; 
    websocket.send(JSON.stringify(request))
} 

 //show/hide textbox to input name
 function showEditName(){
    document.getElementById('nameTextBox').className="show";
    document.getElementById('updateName').className="show";
}
function hideEditName(){
    document.getElementById('nameTextBox').className="hide";
    document.getElementById('updateName').className="hide";
}

// QR Overlay
function openQR(){
    document.getElementById("qr-code-overlay").style.display = "flex";
}
function closeQR(){
    document.getElementById("qr-code-overlay").style.display = "none";
}

// Dropdown menu functions
// function showSaveButtonDropdown() {
//     document.getElementById("save-button-dropdown").classList.toggle("show-save-dropdown");
// }

//     // Close dropdown menu if clicked outside
//     window.onclick = function(event) {
//         if (!event.target.matches('.save-button' || '.save-icon')) {
//           var dropdowns = document.getElementsByClassName("header-right-dropdown-content");
//           var i;
//           for (i = 0; i < dropdowns.length; i++) {
//             var openDropdown = dropdowns[i];
//             if (openDropdown.classList.contains('show-save-dropdown')) {
//               openDropdown.classList.remove('show-save-dropdown');
//             }
//           }
//         }
//       } 
    

// function showMenuButtonDropdown() {
//     document.getElementById("menu-button-dropdown").classList.toggle("show-dropdown");
// }

//     window.onclick = function(event) {
//         if (!event.target.matches('.menu-button' || '.menu-icon')) {
//         var dropdowns = document.getElementsByClassName("header-right-dropdown-content");
//         var i;
//         for (i = 0; i < dropdowns.length; i++) {
//             var openDropdown = dropdowns[i];
//             if (openDropdown.classList.contains('show-menu-dropdown')) {
//             openDropdown.classList.remove('show-menu-dropdown');
//             }
//         }
//         }
//     } 

/*
uploadImageFile TODO:
    - Maybe mess with formatting
        - Currently draws the image on the top left corner
    - Alter how the upload file button looks
        - Currently is the default `Choose File` button
*/
function uploadImageFile() {
    var file = document.getElementById("upload").files[0];
    var reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = function (e) {
        var img = new Image();
        img.src = e.target.result;
        img.onload = function () {
            newpage();
           ctx.drawImage(img, 10, 10);
           sendUpdate();
           var imageURL = canvas.toDataURL("image/png", 0.2);
           localImages[viewingPageNumber] = imageURL;
           
        };
    }
} 

var pdf_page;

function renderPages(pdf_file) {
    if (pdf_page <= pdf_file.numPages) {
        var viewport;
        pdf_file.getPage(pdf_page).then(page => {
            viewport = page.getViewport({ scale: canvas.height / page.getViewport({ scale: 1 }).height });
            var pageRender = page.render({
                canvasContext: ctx,
                viewport: viewport
            });
            pageRender.promise.then(async function () {
                sendUpdate();
                var imageURL = canvas.toDataURL("image/png", 0.2);
                localImages[viewingPageNumber] = imageURL;
                if(pdf_page < pdf_file.numPages){
                    newpage();
                }
                pdf_page++;
                renderPages(pdf_file);
            });
        });
    }
}

function uploadPDF(pdf_file) {
    console.log("inside uploadPDF function. number of pages in pdf: " + pdf_file.numPages);
    pdf_page = 1;
    var imageURL = canvas.toDataURL("image/png", 0.2);
    localImages[viewingPageNumber] = imageURL;
    newpage();
    renderPages(pdf_file);
    document.getElementById("upload").value = "";
}





function stringToUUID(str) {
    return "UUID('" + str + "')"
}


var currentDrawInstructions = [];
var currentInstructionIndex = 0;
var currentFrames = [];

var drawAnimations = true;
var processHighlight = false;

function animateDraw() {
    if (currentDrawInstructions.length == 0) {
        if (processHighlight) {
            layerHighlightCanvas(ctx);
            processHighlight = false;
        }
        return;
    }
    if (currentInstructionIndex >= currentDrawInstructions.length) {
        currentInstructionIndex = 0;
        currentDrawInstructions = [];
    } else {
        var element = JSON.parse(currentDrawInstructions[currentInstructionIndex]);
        draw(element, ctx);
        currentInstructionIndex += 1;
    }
    currentFrames.push(window.requestAnimationFrame(animateDraw));
}

function cancelAllAnimationFrames() {
    currentFrames.forEach((frameID) => {
        window.cancelAnimationFrame(frameID);
    });
    currentFrames = [];
}

function finishAnimations() {
    cancelAllAnimationFrames();
    currentDrawInstructions.splice(0, currentInstructionIndex);
    currentDrawInstructions.forEach((element) => {//loop through each value
        element = JSON.parse(element);
        draw(element, ctx);//just output the stroke 
    });
    currentDrawInstructions = [];
    currentInstructionIndex = 0;

    if (processHighlight) {
        layerHighlightCanvas(ctx);
        processHighlight = false;
    }
}