const canvas = document.getElementById('board');
const brushSizeElement = document.getElementById('brush-size');
const eraserSizeElement = document.getElementById('eraser-size');

const ctx = canvas.getContext('2d');
const backgroundCanvas = document.getElementById('background');
const backgroundCtx = backgroundCanvas.getContext('2d');
const eraserCursor = document.getElementById('eraser-cursor');
console.log("hello world")



let drawing = false;
let scale =0.5;
let displacement = [0,0];
let erasing = false;
let color = '#ffffff';

class Stroke {
  constructor(point1,point2, color, width,erasing) {
    this.point1 = point1;
    this.point2 = point2;
    this.color = color;
    this.width = width;
    this.erasing = erasing;
  }
}
let strokes = [];


function drawBackground() {
    const rect = canvas.getBoundingClientRect();
    const gap = 30;

    const left = (-rect.width / 2 - displacement[0]) / scale;
    const right = (rect.width / 2 - displacement[0]) / scale;
    const top = (-rect.height / 2 - displacement[1]) / scale;
    const bottom = (rect.height / 2 - displacement[1]) / scale;

    const firstX = Math.ceil(left / gap) * gap; // gets the interval of pixels per points then multiplys it back to avoid shitty decimal shenanigans
    const firstY = Math.ceil(top / gap) * gap;
    for (let x = firstX; x <= right; x += gap) {
        for (let y = firstY; y <= bottom; y += gap) {
        backgroundCtx.beginPath();
        backgroundCtx.moveTo(x, y);
        backgroundCtx.lineTo(x, y + 1);
        backgroundCtx.strokeStyle = "#34343a";
        backgroundCtx.lineWidth = 4;
        backgroundCtx.lineCap = "round";
        backgroundCtx.stroke();
        }
    }
}
function getCanvasPointFromWindowPoint(x,y) { // basically a canvas-relative coordinate system converter from window relative
    const rect = canvas.getBoundingClientRect();
    return [
        (x - rect.left - rect.width / 2 - displacement[0]) / scale,
        (y - rect.top - rect.height / 2 - displacement[1]) / scale
    ]; // rect.top is canvas distance from the top of the window and rect.left is the distance of of the canvas from the left side of the window
}
function renderCanvas() {
    const rect = canvas.getBoundingClientRect();
    const pixelWidth = Math.floor(rect.width * window.devicePixelRatio);
    const pixelHeight = Math.floor(rect.height * window.devicePixelRatio);

    backgroundCanvas.width = pixelWidth;
    backgroundCanvas.height = pixelHeight;
    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    const transform = [
        window.devicePixelRatio * scale, 0,
        0, window.devicePixelRatio * scale,
        (rect.width / 2 + displacement[0]) * window.devicePixelRatio,
        (rect.height / 2 + displacement[1]) * window.devicePixelRatio
    ];

    backgroundCtx.setTransform(...transform);
    ctx.setTransform(...transform); // translation
    drawBackground();
    strokes.forEach((stroke) => {
        ctx.globalCompositeOperation = stroke.erasing // bullshit erasing magic, makes the pixels this stroke touches invisible
        ? "destination-out"
        : "source-over";

        ctx.beginPath();
        ctx.moveTo(stroke.point1[0], stroke.point1[1]);
        ctx.lineTo(stroke.point2[0], stroke.point2[1]);
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = "round";
        ctx.stroke();
    });
    ctx.globalCompositeOperation = "source-over"; // turns off the bullshit magic
}
function onMarkerClick(e){
    erasing = false;
    e.currentTarget.classList.add('active');
    document.getElementById('eraserbutton').classList.remove('active');

}

function onEraserClick(e){
    erasing = true;
    e.currentTarget.classList.add('active');
    document.getElementById('markerbutton').classList.remove('active');
}
function setBrushColor(newColor) {
    color = newColor;
}
function toggleColorButtons() {
    document.querySelectorAll('.color').forEach((button) => {
        const isHidden = getComputedStyle(button).display === 'none';

        button.style.display = isHidden ? 'flex' : 'none';
        button.style.visibility = isHidden ? 'visible' : 'hidden';
        button.style.opacity = isHidden ? '1' : '0';
    });
}
function renderCursor(e){
    if (erasing){
        canvas.style.cursor = dragging ? "grab":"none";
        const rect = canvas.getBoundingClientRect();
        const diameter = Number(eraserSizeElement.value) * scale;
        eraserCursor.style.width = `${diameter}px`;
        eraserCursor.style.height = `${diameter}px`;
        eraserCursor.style.left = `${e.clientX - rect.left}px`;
        eraserCursor.style.top = `${e.clientY - rect.top}px`;
        eraserCursor.style.display = 'block';
    }
}

renderCanvas();


let lastPointPos;
let dragging;
let dragPos;

window.addEventListener('resize', renderCanvas);


canvas.addEventListener('pointerdown', (e) => {
    if (erasing){
        renderCursor(e);
    }
    else {
        eraserCursor.style.display = "none";

    }
    if (e.button === 1) {
        dragging = true;
        dragPos = [e.clientX,e.clientY];
        canvas.style.cursor = "grabbing";
        return;
    }
    if (e.button === 0) {
        
        const pos = getCanvasPointFromWindowPoint(e.clientX,e.clientY)
        ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
        drawing = true;
        ctx.beginPath();
        ctx.moveTo(pos[0], pos[1]);
        ctx.lineTo(pos[0] + 1, pos[1]);
        ctx.strokeStyle = color;
        ctx.lineWidth = erasing ? eraserSizeElement.value : brushSizeElement.value;
        ctx.lineCap = 'round';
        ctx.stroke();
        strokes.push(new Stroke(
            [pos[0], pos[1]],
            [pos[0] + 1, pos[1]],
            color,
            brushSizeElement.value,erasing
        ));
        ctx.beginPath();
        ctx.moveTo(pos[0], pos[1]);
        lastPointPos = [pos[0], pos[1]];
    }
    

});

canvas.addEventListener('pointermove', (e) => {
    if (erasing){
        renderCursor(e);
    }
    else {
        eraserCursor.style.display = 'none';
        
    }
    if (drawing) {
        const pos = getCanvasPointFromWindowPoint(e.clientX,e.clientY)
        ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
        ctx.lineTo(pos[0], pos[1]);
        strokes.push(new Stroke(
            lastPointPos,
            [pos[0], pos[1]],
            color,        
            ctx.lineWidth = erasing ? eraserSizeElement.value : brushSizeElement.value,
            erasing
        ));
        lastPointPos = [pos[0], pos[1]];
        

        ctx.strokeStyle = color;
        ctx.lineWidth = erasing ? eraserSizeElement.value : brushSizeElement.value;
        ctx.lineCap = 'round';
        ctx.stroke();
    }
    else if (dragging) {
        
        displacement[0] +=  e.clientX - dragPos[0]; // sets the displacement from last mouse movement
        displacement[1] +=  e.clientY - dragPos[1];
        dragPos = [e.clientX, e.clientY]; //sets the last movement to be this one since it just moved
        renderCanvas();
    }
    
    
    
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();

  const worldPoint = getCanvasPointFromWindowPoint(e.clientX, e.clientY);

  // Change zoom, then clamp it.
  scale *= e.deltaY < 0 ? 1.1 : 1 / 1.1;
  scale = Math.min(5, Math.max(0.2, scale));

  const cursorX = e.clientX - rect.left - rect.width / 2;
  const cursorY = e.clientY - rect.top - rect.height / 2;

  displacement[0] = cursorX - worldPoint[0] * scale;
  displacement[1] = cursorY - worldPoint[1] * scale;

  renderCanvas();
  renderCursor(e);
}, { passive: false });

canvas.addEventListener('pointerup', () => {
    drawing = false;
    dragging = false;
    canvas.style.cursor = dragging ? "grab": erasing ? "none": "crosshair" ;
});

canvas.addEventListener('pointerleave', () => {
    drawing = false;
    eraserCursor.style.display = 'none';

});