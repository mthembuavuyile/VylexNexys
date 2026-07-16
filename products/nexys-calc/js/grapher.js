// ==========================================
// Math expression engine
// ==========================================
const FUNC_NAMES = ['asin', 'acos', 'atan', 'sin', 'cos', 'tan', 'sqrt', 'log', 'ln', 'abs', 'exp'];
const FUNC_SORTED = [...FUNC_NAMES].sort((a, b) => b.length - a.length);

function tokenize(raw) {
    const s = raw.replace(/\s+/g, '');
    const tokens = [];
    let i = 0;
    while (i < s.length) {
        const c = s[i];
        if (/[0-9.]/.test(c)) {
            let j = i;
            while (j < s.length && /[0-9.]/.test(s[j])) j++;
            tokens.push({ type: 'NUM', value: parseFloat(s.slice(i, j)) });
            i = j; continue;
        }
        if (/[a-zA-Z]/.test(c)) {
            let j = i;
            while (j < s.length && /[a-zA-Z]/.test(s[j])) j++;
            const run = s.slice(i, j);
            let k = 0;
            while (k < run.length) {
                let matched = false;
                for (const fn of FUNC_SORTED) {
                    if (run.startsWith(fn, k)) { tokens.push({ type: 'FUNC', value: fn }); k += fn.length; matched = true; break; }
                }
                if (!matched) {
                    if (run.startsWith('pi', k)) { tokens.push({ type: 'CONST', value: 'pi' }); k += 2; }
                    else if (run[k] === 'e') { tokens.push({ type: 'CONST', value: 'e' }); k += 1; }
                    else if (run[k] === 'x') { tokens.push({ type: 'VAR' }); k += 1; }
                    else { throw new Error('Unknown symbol "' + run[k] + '"'); }
                }
            }
            i = j; continue;
        }
        const map = { '+': 'PLUS', '-': 'MINUS', '*': 'STAR', '/': 'SLASH', '^': 'CARET', '(': 'LPAREN', ')': 'RPAREN', ',': 'COMMA' };
        if (map[c]) { tokens.push({ type: map[c] }); i++; continue; }
        throw new Error('Unexpected character "' + c + '"');
    }
    const out = [];
    for (let idx = 0; idx < tokens.length; idx++) {
        const t = tokens[idx];
        if (idx > 0) {
            const prev = tokens[idx - 1];
            const prevEnds = ['NUM', 'RPAREN', 'VAR', 'CONST'].includes(prev.type);
            const currStarts = ['NUM', 'VAR', 'CONST', 'FUNC', 'LPAREN'].includes(t.type);
            if (prevEnds && currStarts) out.push({ type: 'STAR' });
        }
        out.push(t);
    }
    return out;
}

const FN_MAP = {
    sin: Math.sin, cos: Math.cos, tan: Math.tan,
    asin: Math.asin, acos: Math.acos, atan: Math.atan,
    sqrt: Math.sqrt, abs: Math.abs, exp: Math.exp,
    log: Math.log10, ln: Math.log
};

function compileExpr(str) {
    if (!str.trim()) throw new Error('Empty expression');
    const tokens = tokenize(str);
    let pos = 0;
    const peek = () => tokens[pos];
    const consume = (type) => {
        const t = tokens[pos];
        if (!t || t.type !== type) throw new Error('Syntax error near "' + type + '"');
        pos++; return t;
    };
    function parseExpression() {
        let left = parseTerm();
        while (peek() && (peek().type === 'PLUS' || peek().type === 'MINUS')) {
            const op = consume(peek().type).type;
            const right = parseTerm();
            const l = left;
            left = op === 'PLUS' ? (x => l(x) + right(x)) : (x => l(x) - right(x));
        }
        return left;
    }
    function parseTerm() {
        let left = parseUnary();
        while (peek() && (peek().type === 'STAR' || peek().type === 'SLASH')) {
            const op = consume(peek().type).type;
            const right = parseUnary();
            const l = left;
            left = op === 'STAR' ? (x => l(x) * right(x)) : (x => l(x) / right(x));
        }
        return left;
    }
    function parseUnary() {
        if (peek() && peek().type === 'MINUS') { consume('MINUS'); const v = parseUnary(); return x => -v(x); }
        if (peek() && peek().type === 'PLUS') { consume('PLUS'); return parseUnary(); }
        return parsePower();
    }
    function parsePower() {
        const base = parsePrimary();
        if (peek() && peek().type === 'CARET') {
            consume('CARET');
            const exp = parseUnary();
            return x => Math.pow(base(x), exp(x));
        }
        return base;
    }
    function parsePrimary() {
        const t = peek();
        if (!t) throw new Error('Unexpected end of expression');
        if (t.type === 'NUM') { consume('NUM'); const v = t.value; return () => v; }
        if (t.type === 'VAR') { consume('VAR'); return x => x; }
        if (t.type === 'CONST') { consume('CONST'); const v = t.value === 'pi' ? Math.PI : Math.E; return () => v; }
        if (t.type === 'LPAREN') { consume('LPAREN'); const inner = parseExpression(); consume('RPAREN'); return inner; }
        if (t.type === 'FUNC') {
            const name = t.value; consume('FUNC'); consume('LPAREN');
            const arg = parseExpression(); consume('RPAREN');
            const f = FN_MAP[name];
            return x => f(arg(x));
        }
        throw new Error('Unexpected token');
    }
    const result = parseExpression();
    if (pos < tokens.length) throw new Error('Unexpected trailing input');
    result(1); // sanity check evaluation doesn't throw
    return result;
}

// ==========================================
// Grapher mode
// ==========================================
const slots = [
    { enabled: true, color: '#7c3aed', fn: null },
    { enabled: false, color: '#0ea5e9', fn: null },
    { enabled: false, color: '#10b981', fn: null }
];

function onExprChange(i) {
    const input = document.getElementById('expr' + i);
    const errEl = document.getElementById('error' + i);
    if (!input || !errEl) return;
    try {
        slots[i].fn = compileExpr(input.value);
        errEl.classList.add('hidden');
        errEl.textContent = '';
    } catch (err) {
        slots[i].fn = null;
        errEl.textContent = err.message;
        errEl.classList.remove('hidden');
    }
    if (typeof render === 'function') render();
}
function onSlotToggle(i) {
    slots[i].enabled = document.getElementById('toggle' + i).checked;
    if (typeof render === 'function') render();
}

function renderGrapher(rect) {
    slots.forEach(slot => {
        if (!slot.enabled || !slot.fn) return;
        ctx.save();
        ctx.strokeStyle = slot.color;
        ctx.lineWidth = 2.5;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        let drawing = false;
        let prevSY = null;
        for (let sx = 0; sx <= rect.width; sx += 1) {
            const [wx] = screenToWorld(sx, 0);
            let wy;
            try { wy = slot.fn(wx); } catch (e) { wy = NaN; }
            if (!Number.isFinite(wy)) { drawing = false; continue; }
            const [, sy] = worldToScreen(wx, wy);
            if (prevSY !== null && Math.abs(sy - prevSY) > rect.height * 1.4) { drawing = false; }
            if (!drawing) { ctx.moveTo(sx, sy); drawing = true; }
            else { ctx.lineTo(sx, sy); }
            prevSY = sy;
        }
        ctx.stroke();
        ctx.restore();
    });
}
