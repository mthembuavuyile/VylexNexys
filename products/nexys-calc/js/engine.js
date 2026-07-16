// ==========================================
// Shared Canvas Engine
// ==========================================
const canvas = document.getElementById('mainCanvas');
const ctx = canvas.getContext('2d');
let dpr = window.devicePixelRatio || 1;
let mode = 'grapher';
const view = { scale: 42, originX: 0, originY: 0, ready: false };

function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!view.ready) {
        view.originX = rect.width / 2;
        view.originY = rect.height / 2;
        view.ready = true;
    }
    render();
}
new ResizeObserver(resizeCanvas).observe(canvas);
window.addEventListener('resize', resizeCanvas);

function worldToScreen(x, y) { return [view.originX + x * view.scale, view.originY - y * view.scale]; }
function screenToWorld(sx, sy) { return [(sx - view.originX) / view.scale, (view.originY - sy) / view.scale]; }

function niceStep(scale) {
    const target = 68;
    const raw = target / scale;
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const norm = raw / mag;
    let step = norm < 1.5 ? 1 : norm < 3.5 ? 2 : norm < 7.5 ? 5 : 10;
    return step * mag;
}
function formatNum(n) {
    if (Math.abs(n) < 1e-9) return '0';
    return parseFloat(n.toPrecision(6)).toString();
}

function drawGrid(w, h) {
    const step = niceStep(view.scale);
    ctx.save();
    ctx.lineWidth = 1;
    ctx.font = '10px JetBrains Mono';

    const [worldLeft] = screenToWorld(0, 0);
    const [worldRight] = screenToWorld(w, 0);
    const [, worldTop] = screenToWorld(0, 0);
    const [, worldBottom] = screenToWorld(0, h);

    ctx.strokeStyle = '#eef1f6';
    const startX = Math.floor(worldLeft / step) * step;
    for (let x = startX; x <= worldRight; x += step) {
        const [sx] = worldToScreen(x, 0);
        ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, h); ctx.stroke();
    }
    const startY = Math.floor(worldBottom / step) * step;
    for (let y = startY; y <= worldTop; y += step) {
        const [, sy] = worldToScreen(0, y);
        ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(w, sy); ctx.stroke();
    }

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, view.originY); ctx.lineTo(w, view.originY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(view.originX, 0); ctx.lineTo(view.originX, h); ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    const labelY = Math.min(Math.max(view.originY + 14, 12), h - 4);
    for (let x = startX; x <= worldRight; x += step) {
        if (Math.abs(x) < step * 0.001) continue;
        const [sx] = worldToScreen(x, 0);
        ctx.fillText(formatNum(x), sx + 3, labelY);
    }
    const labelX = Math.min(Math.max(view.originX + 4, 4), w - 30);
    for (let y = startY; y <= worldTop; y += step) {
        if (Math.abs(y) < step * 0.001) continue;
        const [, sy] = worldToScreen(0, y);
        ctx.fillText(formatNum(y), labelX, sy - 3);
    }
    ctx.restore();
}

function render() {
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawGrid(rect.width, rect.height);
    if (mode === 'grapher' && typeof renderGrapher === 'function') renderGrapher(rect);
    if (mode === 'triangle' && typeof renderTriangle === 'function') renderTriangle(rect);
    if (mode === 'sequence' && typeof renderSequence === 'function') renderSequence(rect);
    if (mode === 'trig' && typeof renderTrig === 'function') renderTrig(rect);
}

// ---- Pan / Zoom / Pointer interaction (shared) ----
let isPanning = false, panStart = null, dragVertexIdx = -1;
let hoverWorld = [0, 0];

canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    if (mode === 'triangle' && typeof hitTestVertex === 'function') {
        const idx = hitTestVertex(sx, sy);
        if (idx !== -1) {
            dragVertexIdx = idx;
            canvas.setPointerCapture(e.pointerId);
            canvas.classList.add('dragging');
            return;
        }
    }
    isPanning = true;
    panStart = { x: e.clientX, y: e.clientY, originX: view.originX, originY: view.originY };
    canvas.setPointerCapture(e.pointerId);
    canvas.classList.add('dragging');
});

canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    hoverWorld = screenToWorld(sx, sy);

    if (dragVertexIdx !== -1 && typeof triState !== 'undefined') {
        let [wx, wy] = screenToWorld(sx, sy);
        if (document.getElementById('snapToggle').checked) {
            wx = Math.round(wx * 2) / 2;
            wy = Math.round(wy * 2) / 2;
        }
        triState.points[dragVertexIdx] = [wx, wy];
        render();
        if (typeof updateTriangleStats === 'function') updateTriangleStats();
        updateCoordReadout();
        return;
    }
    if (isPanning) {
        view.originX = panStart.originX + (e.clientX - panStart.x);
        view.originY = panStart.originY + (e.clientY - panStart.y);
        render();
        updateCoordReadout();
        return;
    }
    if (mode === 'triangle' && typeof hitTestVertex === 'function') {
        canvas.classList.toggle('vertex-hover', hitTestVertex(sx, sy) !== -1);
    }
    updateCoordReadout();
});

window.addEventListener('pointerup', () => {
    isPanning = false;
    dragVertexIdx = -1;
    canvas.classList.remove('dragging');
});

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const [wx, wy] = screenToWorld(sx, sy);
    const factor = Math.pow(1.0015, -e.deltaY);
    view.scale = Math.min(500, Math.max(8, view.scale * factor));
    view.originX = sx - wx * view.scale;
    view.originY = sy + wy * view.scale;
    render();
}, { passive: false });

function zoomBy(factor) {
    const rect = canvas.getBoundingClientRect();
    const cx = rect.width / 2, cy = rect.height / 2;
    const [wx, wy] = screenToWorld(cx, cy);
    view.scale = Math.min(500, Math.max(8, view.scale * factor));
    view.originX = cx - wx * view.scale;
    view.originY = cy + wy * view.scale;
    render();
}
function resetView() {
    const rect = canvas.getBoundingClientRect();
    view.scale = 42;
    view.originX = rect.width / 2;
    view.originY = rect.height / 2;
    render();
}

function updateCoordReadout() {
    const el = document.getElementById('coordReadout');
    if (!el) return;
    let txt = `x = ${hoverWorld[0].toFixed(2)}, y = ${hoverWorld[1].toFixed(2)}`;
    if (mode === 'grapher' && typeof slots !== 'undefined' && slots[0].enabled && slots[0].fn) {
        const yv = slots[0].fn(hoverWorld[0]);
        if (Number.isFinite(yv)) txt += `   ·   f₁(x) = ${yv.toFixed(3)}`;
    }
    el.textContent = txt;
}
