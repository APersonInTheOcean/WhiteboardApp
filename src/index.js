const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
console.log("hello world")

let drawing = false;

function drawBackground(){
    const rect = canvas.getBoundingClientRect();

    const gap = 30;

    for (let x = 10; x<= rect.width; x += gap){
        for (let y = 10; y <= rect.height; y += gap) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + 1);
            ctx.strokeStyle = '#34343a';
            ctx.lineWidth = 4;
            ctx.lineCap = 'round';
            ctx.stroke();
        }
    }
    
    
}
function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
  
    canvas.width = Math.floor(rect.width * window.devicePixelRatio);
    canvas.height = Math.floor(rect.height * window.devicePixelRatio);
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    drawBackground();
}


resizeCanvas();

window.addEventListener('resize', resizeCanvas);

canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();

    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineTo(e.clientX - rect.left + 1, e.clientY - rect.top);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);

});

canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    
    if (!drawing) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.stroke();
});

canvas.addEventListener('pointerup', () => {
    drawing = false;
});

canvas.addEventListener('pointerleave', () => {
    drawing = false;
});