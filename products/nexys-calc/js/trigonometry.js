// ==========================================
// Trigonometry Logic
// ==========================================
let trigState = null;

function renderTrig(rect) {
    if (!trigState) return;

    ctx.save();
    if (trigState.mode === 'triangle') {
        // Draw right triangle
        const { mn, np, mp } = trigState;
        // Scale triangle to fit nicely
        const maxSide = Math.max(mn, np);
        const padding = 2; // world units
        const scale = (rect.height * 0.6) / (maxSide + padding);
        view.scale = Math.max(10, Math.min(200, scale));
        view.originX = rect.width / 2 - (mn / 2) * view.scale;
        view.originY = rect.height / 2 + (np / 2) * view.scale;

        const [x0, y0] = worldToScreen(0, 0); // N (right angle)
        const [xM, yM] = worldToScreen(mn, 0); // M (along x-axis)
        const [xP, yP] = worldToScreen(0, np); // P (along y-axis)

        // Draw fill
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(xM, yM);
        ctx.lineTo(xP, yP);
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.1)'; // emerald-500/10
        ctx.fill();

        // Draw edges
        ctx.strokeStyle = '#10b981'; // emerald-500
        ctx.lineWidth = 3;
        ctx.stroke();

        // Right angle square
        const size = 15;
        ctx.beginPath();
        ctx.moveTo(x0 + size, y0);
        ctx.lineTo(x0 + size, y0 - size);
        ctx.lineTo(x0, y0 - size);
        ctx.strokeStyle = '#059669'; // emerald-600
        ctx.lineWidth = 2;
        ctx.stroke();

        // Labels
        ctx.font = 'bold 14px Inter';
        ctx.fillStyle = '#334155';
        ctx.textAlign = 'center';
        
        ctx.fillText('N', x0 - 15, y0 + 15);
        ctx.fillText('M', xM + 15, yM + 15);
        ctx.fillText('P', xP - 15, yP - 15);

        ctx.font = '12px Inter';
        ctx.fillStyle = '#64748b';
        ctx.fillText(`mn = ${mn}`, (x0 + xM)/2, y0 + 15);
        ctx.fillText(`np = ${np}`, x0 - 25, (y0 + yP)/2);
        
        const cgX = (xM + xP)/2, cgY = (yM + yP)/2;
        ctx.fillText(`mp = ${mp}`, cgX + 25, cgY - 10);

    } else if (trigState.mode === 'quadrant') {
        const angle = trigState.angle;
        const rad = angle * Math.PI / 180;
        
        view.scale = Math.min(rect.width, rect.height) * 0.3;
        view.originX = rect.width / 2;
        view.originY = rect.height / 2;

        const [cx, cy] = worldToScreen(0, 0);
        const radius = 1 * view.scale;

        // Draw unit circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)'; // cyan-500/30
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw angle vector
        const endX = cx + Math.cos(rad) * radius;
        const endY = cy - Math.sin(rad) * radius;
        
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(endX, endY);
        ctx.strokeStyle = '#06b6d4'; // cyan-500
        ctx.lineWidth = 3;
        ctx.stroke();

        // Point
        ctx.beginPath();
        ctx.arc(endX, endY, 6, 0, 2 * Math.PI);
        ctx.fillStyle = '#0891b2'; // cyan-600
        ctx.fill();

        // Arc
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.3, 0, -rad, rad > 0);
        ctx.strokeStyle = '#0891b2';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.font = 'bold 12px Inter';
        ctx.fillStyle = '#334155';
        ctx.fillText(`${angle}°`, cx + Math.cos(rad/2) * radius * 0.4, cy - Math.sin(rad/2) * radius * 0.4);
    }
    ctx.restore();
}

function initTrigCalculator() {
    function createFractionHTML(numerator, denominator) {
        return `<div class="inline-block text-center align-middle mx-1"><div class="border-b border-current pb-0.5">${numerator}</div><div>${denominator}</div></div>`;
    }
    function round(value, decimals = 4) { return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals); }

    // Triangle Solver
    const triResultContainer = document.getElementById('tri-result-container');
    const triResult = document.getElementById('tri-result');
    if (!triResult) return;
    
    document.getElementById('btn-solve-tri').addEventListener('click', () => {
        let mn = parseFloat(document.getElementById('trig-side-mn').value);
        let np = parseFloat(document.getElementById('trig-side-np').value);
        let mp = parseFloat(document.getElementById('trig-side-mp').value);
        if (isNaN(mn) || isNaN(np)) {
            if (!isNaN(mn) && !isNaN(np) && isNaN(mp)) { mp = Math.sqrt(mn*mn + np*np); document.getElementById('trig-side-mp').value = round(mp); }
            else { 
                trigState = null; if (typeof render === 'function') render();
                triResultContainer.classList.remove('hidden'); triResult.innerHTML = '<span class="text-rose-500 col-span-2 font-semibold">Please enter valid numbers for at least two sides.</span>'; return; 
            }
        }
        if (mn <= 0 || np <= 0 || mp <= 0) { 
            trigState = null; if (typeof render === 'function') render();
            triResultContainer.classList.remove('hidden'); triResult.innerHTML = '<span class="text-rose-500 col-span-2 font-semibold">All sides must be positive.</span>'; return; 
        }

        trigState = { mode: 'triangle', mn: mn, np: np, mp: mp };
        if (typeof render === 'function') render();

        triResult.innerHTML = `
            <div>
                <h4 class="text-emerald-600 font-bold mb-2">Angle α (at M)</h4>
                <p class="text-slate-600 text-sm mb-1 flex items-center">sin α = ${createFractionHTML(round(np), round(mp))} ≈ ${round(np/mp)}</p>
                <p class="text-slate-600 text-sm mb-1 flex items-center">cos α = ${createFractionHTML(round(mn), round(mp))} ≈ ${round(mn/mp)}</p>
                <p class="text-slate-600 text-sm flex items-center">tan α = ${createFractionHTML(round(np), round(mn))} ≈ ${round(np/mn)}</p>
            </div>
            <div>
                <h4 class="text-emerald-600 font-bold mb-2">Angle β (at P)</h4>
                <p class="text-slate-600 text-sm mb-1 flex items-center">sin β = ${createFractionHTML(round(mn), round(mp))} ≈ ${round(mn/mp)}</p>
                <p class="text-slate-600 text-sm mb-1 flex items-center">cos β = ${createFractionHTML(round(np), round(mp))} ≈ ${round(np/mp)}</p>
                <p class="text-slate-600 text-sm flex items-center">tan β = ${createFractionHTML(round(mn), round(np))} ≈ ${round(mn/np)}</p>
            </div>
        `;
        triResultContainer.classList.remove('hidden');
    });

    // Quadrant Analyzer
    const quadResult = document.getElementById('quad-result');
    document.getElementById('btn-check-quad').addEventListener('click', () => {
        let angle = parseFloat(document.getElementById('trig-angle').value);
        if (isNaN(angle)) { 
            trigState = null; if (typeof render === 'function') render();
            quadResult.innerHTML = '<span class="text-rose-400">Enter a valid angle.</span>'; quadResult.classList.remove('hidden'); return; 
        }
        
        trigState = { mode: 'quadrant', angle: angle };
        if (typeof render === 'function') render();

        let norm = angle % 360; if (norm < 0) norm += 360;
        let quad = "On axis";
        if (norm > 0 && norm < 90) quad = "I (All Positive)";
        else if (norm > 90 && norm < 180) quad = "II (Sine Positive)";
        else if (norm > 180 && norm < 270) quad = "III (Tangent Positive)";
        else if (norm > 270 && norm < 360) quad = "IV (Cosine Positive)";
        
        const rad = angle * (Math.PI / 180);
        const tanVal = Math.abs(Math.cos(rad)) < 1e-6 ? "Undefined" : round(Math.tan(rad));
        quadResult.innerHTML = `
            <div class="mb-2"><span class="text-slate-400 text-xs tracking-wider uppercase">Quadrant</span><br><span class="text-cyan-400 font-bold text-base">${quad}</span></div>
            <div class="mb-3"><span class="text-slate-400 text-xs tracking-wider uppercase">Normalized</span><br><span class="text-white">${round(norm, 2)}°</span></div>
            <div class="grid grid-cols-3 gap-2 border-t border-slate-700 pt-3">
                <div><span class="text-slate-400 text-[10px] uppercase">sin</span><br>${round(Math.sin(rad))}</div>
                <div><span class="text-slate-400 text-[10px] uppercase">cos</span><br>${round(Math.cos(rad))}</div>
                <div><span class="text-slate-400 text-[10px] uppercase">tan</span><br>${tanVal}</div>
            </div>
        `;
        quadResult.classList.remove('hidden');
    });

    // Special Angles
    const specialAnglesData = {
        "0": { sin: "0", cos: "1", tan: "0" }, "30": { sin: "1/2", cos: "√3/2", tan: "√3/3" },
        "45": { sin: "√2/2", cos: "√2/2", tan: "1" }, "60": { sin: "√3/2", cos: "1/2", tan: "√3" },
        "90": { sin: "1", cos: "0", tan: "Undefined" }, "180": { sin: "0", cos: "-1", tan: "0" },
        "270": { sin: "-1", cos: "0", tan: "Undefined" }, "360": { sin: "0", cos: "1", tan: "0" }
    };
    const specResult = document.getElementById('special-angle-result');
    document.getElementById('btn-lookup-angle').addEventListener('click', () => {
        const angle = document.getElementById('trig-special-angle').value;
        const data = specialAnglesData[angle];
        specResult.innerHTML = `
            <div class="text-indigo-400 text-xs tracking-wider uppercase mb-3">Values for ${angle}°</div>
            <div class="space-y-2 text-base">
                <div><span class="text-slate-400">sin ${angle}° =</span> ${data.sin}</div>
                <div><span class="text-slate-400">cos ${angle}° =</span> ${data.cos}</div>
                <div><span class="text-slate-400">tan ${angle}° =</span> ${data.tan}</div>
            </div>
        `;
        specResult.classList.remove('hidden');
    });
}
