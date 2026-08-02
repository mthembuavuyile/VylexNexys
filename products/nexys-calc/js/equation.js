// ==========================================
// Equation Solver Logic
// ==========================================
function initEquationSolver() {
    const exprInput = document.getElementById('eq-expression');
    const resultContainer = document.getElementById('eq-result-container');
    const resultBox = document.getElementById('eq-result');
    if (!exprInput || !resultBox) return;

    function displayResult(result, isError = false) {
        resultContainer.classList.remove('hidden');
        resultBox.textContent = result;
        if (isError) {
            resultBox.classList.add('text-rose-400');
            resultBox.classList.remove('text-emerald-400');
        } else {
            resultBox.classList.remove('text-rose-400');
            resultBox.classList.add('text-emerald-400');
        }
    }

    function processExpression(action) {
        const expression = exprInput.value.trim();
        if (!expression) { displayResult('Please enter an expression.', true); return; }
        try {
            let result;
            if (action === 'evaluate') {
                result = math.evaluate(expression);
                if (typeof result === 'function') result = result.toString();
                else if (math.typeOf(result) === 'ResultSet') result = result.entries.join(', ');
                else if (math.typeOf(result) === 'DenseMatrix' || math.typeOf(result) === 'Matrix') result = result.toString();
            } else if (action === 'simplify') {
                result = math.simplify(expression).toString();
            } else if (action === 'derive') {
                result = math.derivative(expression, 'x').toString();
            }
            displayResult(`= ${result}`);
        } catch (error) {
            displayResult(`Error: ${error.message}`, true);
        }
    }

    document.getElementById('btn-evaluate').addEventListener('click', () => processExpression('evaluate'));
    document.getElementById('btn-simplify').addEventListener('click', () => processExpression('simplify'));
    document.getElementById('btn-derive').addEventListener('click', () => processExpression('derive'));
    exprInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') processExpression('evaluate'); });
}

function insertFormula(type) {
    const input = document.getElementById('eq-expression');
    if (!input) return;
    
    let formula = "";
    if (type === 'quadratic') formula = "(-b + sqrt(b^2 - 4*a*c)) / (2*a)";
    else if (type === 'arithmetic') formula = "a + (n - 1) * d";
    else if (type === 'geometric') formula = "a * r^(n - 1)";
    
    input.value = formula;
    input.focus();
}
