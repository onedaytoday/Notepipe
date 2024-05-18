const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d"); //2d rendering
canvas.style.position = 'absolute';
var drawing = false;
var link;
var teacherLink = "/canvas/teacher.html";

//Based off of TeacherCanvas.js code
window.addEventListener("resize", () => {
    let drawing= false; // when we are pressing down or not

    var canvasMem = document.createElement('canvas');
    var canvasMemCtx = canvasMem.getContext("2d"); 
    canvasMem.width = canvas.width;
    canvasMem.height = canvas.height;
  
    //set brush
    ctx.strokeStyle = 'rgba(166, 213, 255, 1)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;

    canvasMemCtx.drawImage(canvas, 0, 0);

    canvas.height = window.innerHeight; //gets height from window
    canvas.width = window.innerWidth;
    
    //redraw
    ctx.drawImage(canvasMem, 0, 0);
}
)
function startClick(e){
    drawing = true;
    draw(e); //allow drawing dots
}
function endClick(){
    drawing = false; 
    ctx.beginPath(); //so lines don't connect
}
window.addEventListener("load", () => { 
    //Resize canvas
    canvas.height = window.innerHeight; //gets height from window
    canvas.width = window.innerWidth;

    //variables
    drawing = false; // when we are pressing down or not

    //Event listeners 
    canvas.addEventListener("mousedown", startClick);
    canvas.addEventListener("mouseup", endClick);
    canvas.addEventListener("mousemove", draw);
});

window.addEventListener('input', (e) =>{
    console.log('variable: ', e.target.value);
    var key = e.target.value;
    link = "/canvas/student.html?key=" + key;
    console.log('link: ', link)
})

function studentButton(){
    window.addEventListener("click", (e) => {
        //console.log('button', link);
        if (link !== undefined){
            window.open(link);
        }
    })
}

function teacherButton(){
    window.addEventListener("click", (e) => {
        console.log('button', teacherLink);
    })
    window.open(teacherLink);
}

function draw(e){    
    if(!drawing) return; // don't draw if not clicking

    //set brush
    ctx.strokeStyle = 'rgba(166, 213, 255, 1)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 5;
    
    //draw
    ctx.lineTo(e.layerX, e.layerY); //line goes where mouse is 
    ctx.stroke(); //draw
    ctx.beginPath();
    ctx.moveTo(e.layerX, e.layerY);
}
