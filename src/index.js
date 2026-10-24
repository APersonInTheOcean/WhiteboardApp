const canvas = document.getElementById('board');
const brushSizeElement = document.getElementById('brush-size');
const eraserSizeElement = document.getElementById('eraser-size');

const ctx = canvas.getContext('2d');
const backgroundGrid = document.getElementById('background');
const eraserCursor = document.getElementById('eraser-cursor');
console.log("hello world")



let drawing = false;
let scale =0.5;
let displacement = [0,0];
let erasing = false;
let color = '#ffffff';

class Stroke {
  constructor(point1,point2, color, width,erasing, segment) {
    this.point1 = point1;
    this.point2 = point2;
    this.color = color;
    this.width = width;
    this.erasing = erasing;
    this.segment = segment;
  }
}
let strokes = [];


function updateBackgroundGrid() {
    const rect = canvas.getBoundingClientRect();
    const gap = 50 * scale;
    const radius = 3 * scale;
    const originX = rect.width / 2 + displacement[0];
    const originY = rect.height / 2 + displacement[1];

    backgroundGrid.style.backgroundImage =
        `radial-gradient(circle ${radius}px at 50% 50%, #34343a 98%, transparent 100%)`;
    backgroundGrid.style.backgroundSize = `${gap}px ${gap}px`;
    backgroundGrid.style.backgroundPosition =
        `${originX - gap / 2}px ${originY - gap / 2}px`;
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

     if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
    }

    const transform = [
        window.devicePixelRatio * scale, 0,
        0, window.devicePixelRatio * scale,
        (rect.width / 2 + displacement[0]) * window.devicePixelRatio,
        (rect.height / 2 + displacement[1]) * window.devicePixelRatio
    ];

    ctx.setTransform(1, 0, 0, 1, 0, 0); // reset all rotation translation and scaling incase width or height hasnt changed
    ctx.clearRect(0, 0, canvas.width, canvas.height); 
    ctx.setTransform(...transform);

    updateBackgroundGrid();


    
    let currentGroup = null;
    let currentPoints = [];

    function strokeGroup() {
        if (!currentGroup) return;

        ctx.beginPath();
        ctx.moveTo(currentPoints[0][0], currentPoints[0][1]);

        for (let i = 1; i < currentPoints.length - 1; i++) {
            const midpoint = [
                (currentPoints[i][0] + currentPoints[i + 1][0]) / 2,
                (currentPoints[i][1] + currentPoints[i + 1][1]) / 2
            ];

            ctx.quadraticCurveTo(
                currentPoints[i][0],
                currentPoints[i][1],
                midpoint[0],
                midpoint[1]
            );
        }

        const lastPoint = currentPoints[currentPoints.length - 1];
        ctx.lineTo(lastPoint[0], lastPoint[1]);

        ctx.globalCompositeOperation = currentGroup.erasing
            ? 'destination-out'
            : 'source-over';
        ctx.strokeStyle = currentGroup.color;
        ctx.lineWidth = currentGroup.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    }

    strokes.forEach((stroke) => {
        const startsNewPath =
            !currentGroup ||
            stroke.segment !== currentGroup.segment ||
            stroke.color !== currentGroup.color ||
            stroke.width !== currentGroup.width ||
            stroke.erasing !== currentGroup.erasing;

        if (startsNewPath) {
            strokeGroup();

            currentGroup = {
                segment: stroke.segment,
                color: stroke.color,
                width: stroke.width,
                erasing: stroke.erasing
            };

            currentPoints = [stroke.point1];
        }

        currentPoints.push(stroke.point2);
    });
    strokeGroup();
    ctx.globalCompositeOperation = "source-over"; // turns off the bullshit magic
}
let renderScheduled = false;

function scheduleRenderCanvas() {
    if (renderScheduled) return;

    renderScheduled = true;
    requestAnimationFrame(() => {
        renderScheduled = false;
        renderCanvas();
    });
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
    else {
        canvas.style.cursor = dragging ? "grab":"crosshair";

    }

}
function undo(howMany){

    
    for (var i = 0;i < howMany; i++) {
        stroke = strokes.pop();
        while (stroke.segment == strokes.at(-1)?.segment){
            stroke = strokes.pop()
        }

    }
    renderCanvas();

}

renderCanvas();


let lastPointPos;
let dragging;
let dragPos;
let segment = 0;

window.addEventListener('resize', renderCanvas);


canvas.addEventListener('pointerdown', (e) => {
    if (e.button === 1 || e.button === 2 ) {
        dragging = true;
        dragPos = [e.clientX,e.clientY];
        renderCursor(e);

        return;
    }
    if (e.button === 0) {
        
        const pos = getCanvasPointFromWindowPoint(e.clientX,e.clientY)
        ctx.globalCompositeOperation = erasing ? "destination-out" : "source-over";
        drawing = true;
        
        strokes.push(new Stroke(
            [pos[0], pos[1]],
            [pos[0], pos[1]],
            color,
            ctx.lineWidth = erasing ? eraserSizeElement.value : brushSizeElement.value,
            erasing,
            segment
        ));
        lastPointPos = pos;
        renderCanvas();

        
    }
    renderCursor(e);
    

});

canvas.addEventListener('pointermove', (e) => {
    renderCursor(e);

    if (drawing) {
        const events = e.getCoalescedEvents?.() ?? [e]; // collected individual mouse movements 
        const width = erasing ? eraserSizeElement.value : brushSizeElement.value;

        for (const event of events) {
            const pos = getCanvasPointFromWindowPoint(event.clientX, event.clientY);

            strokes.push(new Stroke(
                lastPointPos,
                pos,
                color,
                width,
                erasing,
                segment
            ));

            lastPointPos = pos;
        }
    }
    else if (dragging) {
        
        displacement[0] +=  e.clientX - dragPos[0]; // sets the displacement from last mouse movement
        displacement[1] +=  e.clientY - dragPos[1];
        dragPos = [e.clientX, e.clientY]; //sets the last movement to be this one since it just moved
    }
    scheduleRenderCanvas();
    
    
    
});
canvas.addEventListener("wheel", (e) => {
  e.preventDefault();

  const rect = canvas.getBoundingClientRect();

  const worldPoint = getCanvasPointFromWindowPoint(e.clientX, e.clientY);

  // Change zoom, then clamp it.
  scale *= e.deltaY < 0 ? 1.1 : 1 / 1.1;
  scale = Math.min(5, Math.max(0.1, scale));

  const cursorX = e.clientX - rect.left - rect.width / 2;
  const cursorY = e.clientY - rect.top - rect.height / 2;

  displacement[0] = cursorX - worldPoint[0] * scale;
  displacement[1] = cursorY - worldPoint[1] * scale;

  renderCanvas();
  renderCursor(e);
}, { passive: false });

canvas.addEventListener('pointerup', () => {
    if (drawing){
       segment++;
    }
    drawing = false;
    dragging = false;
    canvas.style.cursor = dragging ? "grab": erasing ? "none": "crosshair" ;
    
});

canvas.addEventListener('pointerleave', () => {
    if (drawing){
        segment++;
    }
    drawing = false;
    
    eraserCursor.style.display = 'none';


});
let undoing = false; // Prevent undoing multiple times
window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'KeyZ') {
        e.preventDefault(); // Stop the browser's default undo.
        undoing = true;
        undo(1);
    }
});
window.addEventListener('keyup', (e) => {
    if (e.ctrlKey || e.code === 'KeyZ') {
        undoing = false;
        e.preventDefault(); // Prevents the page from scrolling.
    }
});