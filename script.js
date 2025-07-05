// Theme and title bar functionality
let isAlwaysOnTop = false;
let isDarkMode = true; // Default to dark mode

function loadTheme() {
    const savedTheme = localStorage.getItem('calculator-theme');
    if (savedTheme === 'light') {
        isDarkMode = false;
        document.documentElement.setAttribute('data-theme', 'light');
    } else {
        isDarkMode = true;
        document.documentElement.removeAttribute('data-theme');
    }
    updateThemeButton();
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('calculator-theme', 'dark');
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        localStorage.setItem('calculator-theme', 'light');
    }
    updateThemeButton();
}

function updateThemeButton() {
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) {
        if (isDarkMode) {
            themeBtn.textContent = '🌙';
            themeBtn.title = 'Switch to Light Mode';
        } else {
            themeBtn.textContent = '☀️';
            themeBtn.title = 'Switch to Dark Mode';
        }
    }
}

function safeSend(channel, ...args) {
    try {
        if (window.require) {
            const { ipcRenderer } = window.require('electron');
            ipcRenderer.send(channel, ...args);
        }
    } catch (e) {
        // Not running in Electron or require not available
    }
}

function toggleAlwaysOnTop() {
    isAlwaysOnTop = !isAlwaysOnTop;
    const pinBtn = document.getElementById('pin-btn');
    if (pinBtn) {
        if (isAlwaysOnTop) {
            pinBtn.classList.add('active');
            pinBtn.textContent = '📍';
        } else {
            pinBtn.classList.remove('active');
            pinBtn.textContent = '📌';
        }
    }
    safeSend('toggle-always-on-top', isAlwaysOnTop);
}

function minimizeWindow() {
    safeSend('minimize-window');
}

function closeWindow() {
    safeSend('close-window');
}

// Calculator logic
class Calculator {
    constructor() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
    }
    clear() {
        this.currentOperand = '0';
        this.previousOperand = '';
        this.operation = undefined;
        this.shouldResetScreen = false;
    }
    delete() {
        if (this.currentOperand === '0') return;
        this.currentOperand = this.currentOperand.toString().slice(0, -1);
        if (this.currentOperand === '') {
            this.currentOperand = '0';
        }
    }
    appendNumber(number) {
        if (number === '.' && this.currentOperand.includes('.')) return;
        if (this.shouldResetScreen) {
            this.currentOperand = '';
            this.shouldResetScreen = false;
        }
        if (this.currentOperand === '0' && number !== '.') {
            this.currentOperand = number;
        } else {
            this.currentOperand = this.currentOperand.toString() + number;
        }
    }
    chooseOperation(operation) {
        if (this.currentOperand === '') return;
        if (this.previousOperand !== '') {
            this.compute();
        }
        this.operation = operation;
        this.previousOperand = this.currentOperand;
        this.currentOperand = '';
    }
    compute() {
        let computation;
        const prev = parseFloat(this.previousOperand);
        const current = parseFloat(this.currentOperand);
        if (isNaN(prev) || isNaN(current)) return;
        switch (this.operation) {
            case '+': computation = prev + current; break;
            case '-': computation = prev - current; break;
            case '×': computation = prev * current; break;
            case '÷':
                if (current === 0) { alert('Cannot divide by zero!'); return; }
                computation = prev / current; break;
            case '%': computation = prev % current; break;
            default: return;
        }
        this.currentOperand = computation;
        this.operation = undefined;
        this.previousOperand = '';
        this.shouldResetScreen = true;
    }
    getDisplayNumber(number) {
        const stringNumber = number.toString();
        const integerDigits = parseFloat(stringNumber.split('.')[0]);
        const decimalDigits = stringNumber.split('.')[1];
        let integerDisplay;
        if (isNaN(integerDigits)) {
            integerDisplay = '';
        } else {
            integerDisplay = integerDigits.toLocaleString('en', { maximumFractionDigits: 0 });
        }
        if (decimalDigits != null) {
            return `${integerDisplay}.${decimalDigits}`;
        } else {
            return integerDisplay;
        }
    }
    updateDisplay() {
        document.getElementById('current-operand').textContent = this.getDisplayNumber(this.currentOperand);
        if (this.operation != null) {
            document.getElementById('previous-operand').textContent = `${this.getDisplayNumber(this.previousOperand)} ${this.operation}`;
        } else {
            document.getElementById('previous-operand').textContent = '';
        }
    }
}

const calculator = new Calculator();

function appendNumber(number) {
    calculator.appendNumber(number);
    calculator.updateDisplay();
}
function appendOperator(operator) {
    calculator.chooseOperation(operator);
    calculator.updateDisplay();
}
function calculate() {
    calculator.compute();
    calculator.updateDisplay();
}
function clearAll() {
    calculator.clear();
    calculator.updateDisplay();
}
function deleteLast() {
    calculator.delete();
    calculator.updateDisplay();
}
function appendDecimal() {
    calculator.appendNumber('.');
    calculator.updateDisplay();
}

// Pasang event handler setelah DOM siap
window.addEventListener('DOMContentLoaded', function() {
    // Theme
    loadTheme();
    updateThemeButton();
    const themeBtn = document.getElementById('theme-btn');
    if (themeBtn) themeBtn.addEventListener('click', toggleTheme);
    // Pin
    const pinBtn = document.getElementById('pin-btn');
    if (pinBtn) pinBtn.addEventListener('click', toggleAlwaysOnTop);
    // Minimize
    const minBtn = document.querySelector('.minimize-btn');
    if (minBtn) minBtn.addEventListener('click', minimizeWindow);
    // Close
    const closeBtn = document.querySelector('.close-btn');
    if (closeBtn) closeBtn.addEventListener('click', closeWindow);
    // Kalkulator buttons
    document.querySelectorAll('.btn.number').forEach(btn => {
        btn.addEventListener('click', e => appendNumber(btn.textContent.trim()));
    });
    document.querySelectorAll('.btn.operator').forEach(btn => {
        btn.addEventListener('click', e => appendOperator(btn.textContent.trim()));
    });
    const equalsBtn = document.querySelector('.btn.equals');
    if (equalsBtn) equalsBtn.addEventListener('click', calculate);
    const clearBtn = document.querySelector('.btn.clear');
    if (clearBtn) clearBtn.addEventListener('click', clearAll);
    const delBtn = document.querySelector('.btn.operator:nth-child(2)');
    if (delBtn) delBtn.addEventListener('click', deleteLast);
    const dotBtn = document.querySelector('.btn.number:not(.zero):last-of-type');
    if (dotBtn) dotBtn.addEventListener('click', appendDecimal);
    // Keyboard support
    document.addEventListener('keydown', (event) => {
        const key = event.key;
        if (key >= '0' && key <= '9') {
            appendNumber(key);
        } else if (key === '.') {
            appendDecimal();
        } else if (key === '+' || key === '-') {
            appendOperator(key);
        } else if (key === '*') {
            appendOperator('×');
        } else if (key === '/') {
            event.preventDefault();
            appendOperator('÷');
        } else if (key === '%') {
            appendOperator('%');
        } else if (key === 'Enter' || key === '=') {
            event.preventDefault();
            calculate();
        } else if (key === 'Escape') {
            clearAll();
        } else if (key === 'Backspace') {
            deleteLast();
        } else if (key === 'Delete') {
            clearAll();
        }
    });
    // Tampilkan display awal
    calculator.updateDisplay();
}); 