

var canvas_colors = document.getElementById("colorsCanvas");
var context_colors = canvas_colors.getContext('2d');
var width_colors = canvas_colors.width;
var height_colors = canvas_colors.height;

var canvas_indicator_colors = document.getElementById("colorsIndicatorCanvas");
var context_indicator_colors = canvas_indicator_colors.getContext('2d');

const gradientH = context_colors.createLinearGradient(0, 0, width_colors, 0);
gradientH.addColorStop(0, "rgb(255, 0, 0)"); // red
gradientH.addColorStop(1 / 6, "rgb(255, 255, 0)"); // yellow
gradientH.addColorStop(2 / 6, "rgb(0, 255, 0)"); // green
gradientH.addColorStop(3 / 6, "rgb(0, 255, 255)");
gradientH.addColorStop(4 / 6, "rgb(0, 0, 255)"); // blue
gradientH.addColorStop(5 / 6, "rgb(255, 0, 255)");
gradientH.addColorStop(1, "rgb(255, 0, 0)"); // red
context_colors.fillStyle = gradientH;
context_colors.fillRect(0, 0, width_colors, height_colors);

const gradientV = context_colors.createLinearGradient(0, 0, 0, height_colors);
gradientV.addColorStop(0, "rgba(255, 255, 255, 1)"); // white
gradientV.addColorStop(0.5, "rgba(255, 255, 255, 0)");
gradientV.addColorStop(0.5, "rgba(0, 0, 0, 0)"); // transparent
gradientV.addColorStop(1, "rgba(0, 0, 0, 1)"); // black
context_colors.fillStyle = gradientV;
context_colors.fillRect(0, 0, width_colors, height_colors);

canvas_indicator_colors.addEventListener('click', event => {
    enableTouch();
    markerWidth = drawWidth;
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const context = canvas_colors.getContext('2d');
    const imgData = context.getImageData(x, y, 1, 1);
    const [r, g, b] = imgData.data;

    context_indicator_colors.clearRect(0, 0, 500, 500);
    context_indicator_colors.fillStyle = "black";
    context_indicator_colors.fillRect(x, y, 5, 5);
    context_indicator_colors.fillStyle = "white";
    context_indicator_colors.fillRect(x + 1, y + 1, 3, 3);

    var colorString = "rgb(" + r + "," + g + "," + b + ")";

    highlightDraw = false;
    color = colorString;
    eraserState = false;
    ctx.globalCompositeOperation = 'source-over';

    return { r, g, b };
});

function showColors() {
    var x = document.getElementById("color-div");
    if (x.style.display === "block") {
        x.style.display = "none";
    } else {
        x.style.display = "block";
    }
};

// shows the HTML slider located in slider-div
function showSlider() {
    var x = document.getElementById("slider-div");
    if (x.style.display === "block") {
        x.style.display = "none";
    } else {
        x.style.display = "block";
    }
};

// Change width of the eraser based on input from a HTML slider
function changeEraserWidth(newWidth) {
    enableTouch();
    eraserWidth = newWidth;
    //markerWidth = eraserWidth;
    //eraserState= false;
    ctx.globalCompositeOperation = 'source-over';
};

var gestureToggleElement = document.getElementById("gestureToggle");

function disableTouch() {
    if (highlightCanvas.style.touchAction == "none") {
        highlightCanvas.style.touchAction = "manipulation";
        allowDraw = false;
        gestureToggleElement.style.backgroundColor = "#FFF"
    } else {
        highlightCanvas.style.touchAction = "none";
        allowDraw = true;
        gestureToggleElement.style.backgroundColor = "#555"
    }
}

function enableTouch() {
    highlightCanvas.style.touchAction = "none";
    allowDraw = true;
    gestureToggleElement.style.backgroundColor = "#555"
}