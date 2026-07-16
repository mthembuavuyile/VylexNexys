// ==========================================
// Sequence Solver Logic
// ==========================================
let seqState = null;

function renderSequence(rect) {
    if (!seqState) return;
    
    ctx.save();
    
    // Draw trendline
    ctx.strokeStyle = '#f43f5e'; // rose-500
    ctx.lineWidth = 2;
    ctx.beginPath();
    let drawing = false;
    for (let sx = 0; sx <= rect.width; sx += 2) {
        const [wx] = screenToWorld(sx, 0);
        if (wx < 0.5 || wx > seqState.points.length + 4) continue; // Only draw trendline in relevant domain
        
        let wy = NaN;
        if (seqState.type === 'arithmetic') {
            wy = seqState.a + (wx - 1) * seqState.d;
        } else if (seqState.type === 'geometric') {
            wy = seqState.a * Math.pow(seqState.r, wx - 1);
        } else if (seqState.type === 'quadratic') {
            wy = seqState.qa * wx * wx + seqState.qb * wx + seqState.qc;
        }
        
        if (!Number.isFinite(wy)) { drawing = false; continue; }
        const [, sy] = worldToScreen(wx, wy);
        if (!drawing) { ctx.moveTo(sx, sy); drawing = true; }
        else { ctx.lineTo(sx, sy); }
    }
    ctx.stroke();

    // Draw discrete points
    seqState.points.forEach((val, i) => {
        const n = i + 1;
        const [sx, sy] = worldToScreen(n, val);
        
        // Point shadow/glow
        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(244, 63, 94, 0.2)';
        ctx.fill();
        
        // Point core
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#e11d48'; // rose-600
        ctx.stroke();
        
        // Label
        ctx.font = '10px Inter';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText(`T${n}`, sx, sy - 12);
    });
    
    ctx.restore();
}

function initSequenceSolver() {
    const seqInput = document.getElementById('seq-input');
    const seqResultContainer = document.getElementById('seq-result-container');
    const seqAnalysisOutput = document.getElementById('seq-analysis-output');
    if (!seqInput || !seqResultContainer) return;
    
    const EPSILON = 1e-9;

    function formatNumber(num) {
        if (Number.isInteger(num)) return num.toString();
        const rounded = Number(num.toFixed(4));
        return Number.isInteger(rounded) ? rounded.toString() : rounded.toString().replace(/\.?0+$/, '');
    }
    
    function parseSequence(inputStr) { return inputStr.split(/[\s,]+/).filter(s => s.trim() !== '').map(Number).filter(n => !isNaN(n)); }
    function allElementsAlmostEqual(arr) { if (arr.length < 1) return true; return arr.every(val => Math.abs(val - arr[0]) < EPSILON); }

    function fitViewToSequence() {
        if (!seqState) return;
        const pts = seqState.points;
        const n = pts.length;
        const minX = 0;
        const maxX = n + 1;
        const minY = Math.min(0, ...pts);
        const maxY = Math.max(...pts);
        
        const rect = canvas.getBoundingClientRect();
        // Scale to fit Y mostly
        const rangeY = maxY - minY === 0 ? 10 : maxY - minY;
        view.scale = (rect.height * 0.6) / rangeY;
        view.scale = Math.max(10, Math.min(100, view.scale));
        
        view.originX = rect.width / 4;
        view.originY = rect.height / 2 + (maxY + minY) / 2 * view.scale;
        
        if (typeof render === 'function') render();
    }

    document.getElementById('btn-analyze-seq').addEventListener('click', () => {
        const seq = parseSequence(seqInput.value);
        if (seq.length < 3) {
            seqState = null;
            if (typeof render === 'function') render();
            seqResultContainer.classList.remove('hidden');
            seqAnalysisOutput.innerHTML = `<p class="text-rose-500 font-semibold">Please enter at least 3 numbers to identify a pattern.</p>`;
            return;
        }

        let n = seq.length;
        let firstDifferences = [];
        for (let i = 0; i < n - 1; i++) firstDifferences.push(seq[i+1] - seq[i]);

        if (allElementsAlmostEqual(firstDifferences)) {
            const a = seq[0], d = firstDifferences[0];
            const next = [a + n*d, a + (n+1)*d, a + (n+2)*d];
            seqState = { type: 'arithmetic', points: seq, a: a, d: d };
            
            seqAnalysisOutput.innerHTML = `
                <h4 class="text-slate-800 font-bold mb-2">Arithmetic Sequence</h4>
                <p class="text-slate-600 mb-1">First Term (a): <strong>${formatNumber(a)}</strong></p>
                <p class="text-slate-600 mb-3">Common Difference (d): <strong>${formatNumber(d)}</strong></p>
                <div class="bg-slate-100 p-3 rounded-lg font-mono text-sm text-slate-700 mb-3 border border-slate-200">
                    T<sub>n</sub> = ${formatNumber(a)} + (n-1) × ${formatNumber(d)}
                </div>
                <p class="text-slate-600">Next 3 terms: <strong>${next.map(formatNumber).join(', ')}</strong></p>
            `;
            seqResultContainer.classList.remove('hidden');
            fitViewToSequence();
            return;
        }

        let ratios = [];
        let canBeGeometric = true;
        for (let i = 0; i < n - 1; i++) {
            if (Math.abs(seq[i]) < EPSILON) {
                if (Math.abs(seq[i+1]) > EPSILON) { canBeGeometric = false; break; }
                ratios.push(0);
            } else ratios.push(seq[i+1] / seq[i]);
        }
        
        if (canBeGeometric && allElementsAlmostEqual(ratios)) {
            const a = seq[0], r = ratios[0];
            const next = [a * Math.pow(r, n), a * Math.pow(r, n+1), a * Math.pow(r, n+2)];
            seqState = { type: 'geometric', points: seq, a: a, r: r };
            
            seqAnalysisOutput.innerHTML = `
                <h4 class="text-slate-800 font-bold mb-2">Geometric Sequence</h4>
                <p class="text-slate-600 mb-1">First Term (a): <strong>${formatNumber(a)}</strong></p>
                <p class="text-slate-600 mb-3">Common Ratio (r): <strong>${formatNumber(r)}</strong></p>
                <div class="bg-slate-100 p-3 rounded-lg font-mono text-sm text-slate-700 mb-3 border border-slate-200">
                    T<sub>n</sub> = ${formatNumber(a)} × (${formatNumber(r)})<sup>n-1</sup>
                </div>
                <p class="text-slate-600">Next 3 terms: <strong>${next.map(formatNumber).join(', ')}</strong></p>
            `;
            seqResultContainer.classList.remove('hidden');
            fitViewToSequence();
            return;
        }

        if (n >= 3 && firstDifferences.length >= 2) {
            let secondDifferences = [];
            for (let i = 0; i < firstDifferences.length - 1; i++) secondDifferences.push(firstDifferences[i+1] - firstDifferences[i]);
            if (allElementsAlmostEqual(secondDifferences)) {
                if (n < 4) {
                    seqState = null;
                    if (typeof render === 'function') render();
                    seqResultContainer.classList.remove('hidden');
                    seqAnalysisOutput.innerHTML = `<p class="text-amber-500 font-semibold">Potentially quadratic, but need 4 terms for confident analysis.</p>`;
                    return;
                }
                const s_diff = secondDifferences[0];
                const qa = s_diff / 2;
                const qb = firstDifferences[0] - 3 * qa;
                const qc = seq[0] - qa - qb;
                const getNext = (i) => qa*(n+i)*(n+i) + qb*(n+i) + qc;
                const next = [getNext(1), getNext(2), getNext(3)];
                seqState = { type: 'quadratic', points: seq, qa: qa, qb: qb, qc: qc };
                
                seqAnalysisOutput.innerHTML = `
                    <h4 class="text-slate-800 font-bold mb-2">Quadratic Sequence</h4>
                    <p class="text-slate-600 mb-3">Constant Second Difference: <strong>${formatNumber(s_diff)}</strong></p>
                    <div class="bg-slate-100 p-3 rounded-lg font-mono text-sm text-slate-700 mb-3 border border-slate-200">
                        T<sub>n</sub> = ${formatNumber(qa)}n² + ${formatNumber(qb)}n + ${formatNumber(qc)}
                    </div>
                    <p class="text-slate-600">Next 3 terms: <strong>${next.map(formatNumber).join(', ')}</strong></p>
                `;
                seqResultContainer.classList.remove('hidden');
                fitViewToSequence();
                return;
            }
        }
        seqState = null;
        if (typeof render === 'function') render();
        seqResultContainer.classList.remove('hidden');
        seqAnalysisOutput.innerHTML = `<p class="text-rose-500 font-semibold">Could not identify a common arithmetic, geometric, or quadratic pattern.</p>`;
    });

    // Sigma Solver
    const sigmaResultContainer = document.getElementById('sigma-result-container');
    const sigmaResult = document.getElementById('sigma-result');
    document.getElementById('btn-solve-sigma').addEventListener('click', () => {
        const formulaStr = document.getElementById('sigma-expr').value.trim();
        const startK = parseInt(document.getElementById('sigma-start').value);
        const endK = parseInt(document.getElementById('sigma-end').value);

        if (!formulaStr) { sigmaResult.innerHTML = `<span class="text-rose-400">Please enter a formula.</span>`; sigmaResultContainer.classList.remove('hidden'); return; }
        if (isNaN(startK) || isNaN(endK)) { sigmaResult.innerHTML = `<span class="text-rose-400">Start and End must be numbers.</span>`; sigmaResultContainer.classList.remove('hidden'); return; }
        if (startK > endK) { sigmaResult.innerHTML = `<span class="text-rose-400">Start value cannot be greater than End.</span>`; sigmaResultContainer.classList.remove('hidden'); return; }

        try {
            let totalSum = 0;
            const node = math.parse(formulaStr);
            const code = node.compile();
            for (let k = startK; k <= endK; k++) { totalSum += code.evaluate({ k: k }); }
            sigmaResult.innerHTML = `Total Sum = <span class="text-emerald-400 font-bold">${formatNumber(totalSum)}</span>`;
            sigmaResultContainer.classList.remove('hidden');
        } catch (e) {
            sigmaResult.innerHTML = `<span class="text-rose-400">Error: ${e.message}</span>`;
            sigmaResultContainer.classList.remove('hidden');
        }
    });
}
