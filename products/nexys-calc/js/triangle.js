// ==========================================
// Triangle mode
// ==========================================
const triState = { points: [[-2.5, -1.5], [2, -1.8], [0.5, 2.3]] };
const VERTEX_LABELS = ['A', 'B', 'C'];

function dist(p, q) { return Math.hypot(p[0] - q[0], p[1] - q[1]); }
function centroid(pts) { return [(pts[0][0] + pts[1][0] + pts[2][0]) / 3, (pts[0][1] + pts[1][1] + pts[2][1]) / 3]; }

function hitTestVertex(sx, sy) {
    for (let i = 0; i < 3; i++) {
        const [vx, vy] = worldToScreen(...triState.points[i]);
        if (Math.hypot(sx - vx, sy - vy) < 14) return i;
    }
    return -1;
}

function resetTriangle() {
    triState.points = [[-2.5, -1.5], [2, -1.8], [0.5, 2.3]];
    if (typeof render === 'function') render();
    updateTriangleStats();
}

function renderTriangle(rect) {
    const pts = triState.points;
    const screenPts = pts.map(p => worldToScreen(...p));
    const cg = centroid(pts);
    const cgScreen = worldToScreen(...cg);

    ctx.save();
    ctx.fillStyle = 'rgba(124, 58, 237, 0.08)';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(...screenPts[0]);
    ctx.lineTo(...screenPts[1]);
    ctx.lineTo(...screenPts[2]);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 12px Inter';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    screenPts.forEach((p, i) => {
        const [sx, sy] = p;
        const [cx, cy] = cgScreen;
        const dx = sx - cx, dy = sy - cy;
        const len = Math.hypot(dx, dy);
        const nx = dx / len, ny = dy / len;
        const lx = sx + nx * 20, ly = sy + ny * 20;
        
        ctx.fillStyle = '#64748b';
        ctx.fillText(VERTEX_LABELS[i], lx, ly);

        ctx.beginPath();
        ctx.arc(sx, sy, 6, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = i === dragVertexIdx ? '#f43f5e' : '#7c3aed';
        ctx.stroke();
    });

    const sideCenters = [
        [(screenPts[1][0] + screenPts[2][0]) / 2, (screenPts[1][1] + screenPts[2][1]) / 2],
        [(screenPts[2][0] + screenPts[0][0]) / 2, (screenPts[2][1] + screenPts[0][1]) / 2],
        [(screenPts[0][0] + screenPts[1][0]) / 2, (screenPts[0][1] + screenPts[1][1]) / 2]
    ];
    const sideLabels = ['a', 'b', 'c'];
    ctx.font = 'italic 11px Inter';
    ctx.fillStyle = '#94a3b8';
    sideCenters.forEach((p, i) => {
        const [sx, sy] = p;
        const [cx, cy] = cgScreen;
        const dx = sx - cx, dy = sy - cy;
        const len = Math.hypot(dx, dy);
        const nx = dx / len, ny = dy / len;
        ctx.fillText(sideLabels[i], sx + nx * 14, sy + ny * 14);
    });

    ctx.restore();
}

function updateTriangleStats() {
    const pts = triState.points;
    const a = dist(pts[1], pts[2]), b = dist(pts[2], pts[0]), c = dist(pts[0], pts[1]);
    
    const sA = document.getElementById('sideA'), sB = document.getElementById('sideB'), sC = document.getElementById('sideC');
    if (!sA) return;
    
    sA.textContent = a.toFixed(2);
    sB.textContent = b.toFixed(2);
    sC.textContent = c.toFixed(2);

    const calcAng = (s1, s2, opp) => {
        let val = (s1*s1 + s2*s2 - opp*opp) / (2 * s1 * s2);
        val = Math.max(-1, Math.min(1, val));
        return Math.acos(val) * (180 / Math.PI);
    };

    let angA = 0, angB = 0, angC = 0;
    const warn = document.getElementById('triWarning');
    const areaVal = Math.abs((pts[0][0]*(pts[1][1]-pts[2][1]) + pts[1][0]*(pts[2][1]-pts[0][1]) + pts[2][0]*(pts[0][1]-pts[1][1])) / 2);
    
    if (areaVal < 0.001) {
        warn.classList.remove('hidden');
    } else {
        warn.classList.add('hidden');
        angA = calcAng(b, c, a);
        angB = calcAng(a, c, b);
        angC = calcAng(a, b, c);
    }

    document.getElementById('angA').textContent = angA.toFixed(1) + '°';
    document.getElementById('angB').textContent = angB.toFixed(1) + '°';
    document.getElementById('angC').textContent = angC.toFixed(1) + '°';
    document.getElementById('perim').textContent = (a + b + c).toFixed(2);
    document.getElementById('area').textContent = areaVal.toFixed(2);

    const badgeSide = document.getElementById('badgeSide');
    const badgeAngle = document.getElementById('badgeAngle');
    const eq = (x, y) => Math.abs(x - y) < 0.01;

    let sideType = 'Scalene', sideClass = '';
    if (eq(a, b) && eq(b, c)) { sideType = 'Equilateral'; sideClass = 'bg-violet-500/20 text-violet-300'; }
    else if (eq(a, b) || eq(b, c) || eq(a, c)) { sideType = 'Isosceles'; sideClass = 'bg-sky-500/20 text-sky-300'; }
    else { sideClass = 'bg-slate-700 text-slate-300'; }

    const maxAngle = Math.max(angA, angB, angC);
    let angleType = 'Acute', angleClass = 'bg-emerald-500/20 text-emerald-300';
    if (Math.abs(maxAngle - 90) < 1.5) { angleType = 'Right'; angleClass = 'bg-amber-500/20 text-amber-300'; }
    else if (maxAngle > 90) { angleType = 'Obtuse'; angleClass = 'bg-rose-500/20 text-rose-300'; }

    badgeSide.textContent = sideType;
    badgeSide.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold ' + sideClass;
    badgeAngle.textContent = angleType;
    badgeAngle.className = 'px-2.5 py-1 rounded-full text-[11px] font-bold ' + angleClass;
}
