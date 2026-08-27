import './style.css';

const display = document.querySelector('#display');
const calculation = document.querySelector('#calculation');
const keypad = document.querySelector('.keypad');
const naturalLanguageForm = document.querySelector('#natural-language-form');
const naturalLanguageInput = document.querySelector('#natural-language-input');
const naturalLanguageHelp = document.querySelector('#natural-language-help');

let current = '0';
let previous = null;
let operator = null;
let shouldReplace = false;

const operatorSymbols = { '+': '+', '−': '−', '×': '×', '÷': '÷' };

function formatNumber(value) {
  if (!Number.isFinite(value)) return 'エラー';
  return String(Number(value.toPrecision(12)));
}

function updateDisplay() {
  display.textContent = current;
  calculation.textContent = previous === null ? '\u00a0' : `${previous} ${operatorSymbols[operator]}${shouldReplace ? '' : ` ${current}`}`;
}

function reset() {
  current = '0';
  previous = null;
  operator = null;
  shouldReplace = false;
}

function parseNaturalLanguage(query) {
  const normalizedQuery = query.replaceAll(',', '').replaceAll('％', '%').trim();
  const numbers = normalizedQuery.match(/-?\d+(?:\.\d+)?/g)?.map(Number) ?? [];
  if (numbers.length < 2) return null;

  let result;
  let symbol;
  if (normalizedQuery.includes('%') || normalizedQuery.includes('パーセント')) {
    result = numbers[0] * numbers[1] / 100;
    symbol = '%';
  } else if (/[足加]\s*して|\s*\+|足す|加える/.test(normalizedQuery)) {
    result = numbers[0] + numbers[1];
    symbol = '+';
  } else if (/引いて|引く|減らして|\s*-/.test(normalizedQuery)) {
    result = numbers[0] - numbers[1];
    symbol = '−';
  } else if (/掛け|かけ|乗じ|\s*\*/.test(normalizedQuery)) {
    result = numbers[0] * numbers[1];
    symbol = '×';
  } else if (/割って|割る|\s*\//.test(normalizedQuery)) {
    result = numbers[1] === 0 ? NaN : numbers[0] / numbers[1];
    symbol = '÷';
  } else return null;

  return { result: formatNumber(result), expression: `${numbers[0]} ${symbol} ${numbers[1]}` };
}

function inputNumber(number) {
  if (current === 'エラー' || shouldReplace) {
    current = number;
    shouldReplace = false;
  } else {
    current = current === '0' ? number : `${current}${number}`;
  }
}

function inputDecimal() {
  if (current === 'エラー' || shouldReplace) {
    current = '0.';
    shouldReplace = false;
  } else if (!current.includes('.')) {
    current += '.';
  }
}

function calculate() {
  if (previous === null || operator === null || shouldReplace) return;
  const left = Number(previous);
  const right = Number(current);
  const operations = {
    '+': () => left + right,
    '−': () => left - right,
    '×': () => left * right,
    '÷': () => right === 0 ? NaN : left / right
  };
  current = formatNumber(operations[operator]());
  previous = null;
  operator = null;
  shouldReplace = true;
}

function inputOperator(nextOperator) {
  if (current === 'エラー') return;
  if (previous !== null && !shouldReplace) calculate();
  previous = current;
  operator = nextOperator;
  shouldReplace = true;
}

function executeAction(action) {
  if (action === 'clear') reset();
  if (action === 'sign' && current !== '0' && current !== 'エラー') current = current.startsWith('-') ? current.slice(1) : `-${current}`;
  if (action === 'percent' && current !== 'エラー') current = formatNumber(Number(current) / 100);
  if (action === 'decimal') inputDecimal();
  if (action === 'equals') calculate();
  updateDisplay();
}

keypad.addEventListener('click', (event) => {
  const key = event.target.closest('button');
  if (!key) return;

  if (key.dataset.number) {
    inputNumber(key.dataset.number);
    updateDisplay();
  }
  if (key.dataset.operator) {
    inputOperator(key.dataset.operator);
    updateDisplay();
  }
  if (key.dataset.action) executeAction(key.dataset.action);
});

naturalLanguageForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const query = naturalLanguageInput.value.trim();
  const parsed = parseNaturalLanguage(query);

  if (!parsed) {
    naturalLanguageHelp.textContent = '数字と「足して」「引いて」「掛けて」「割って」を使ってください';
    naturalLanguageHelp.classList.add('natural-language-error');
    return;
  }

  reset();
  current = parsed.result;
  shouldReplace = true;
  updateDisplay();
  calculation.textContent = `${parsed.expression} =`;
  naturalLanguageHelp.textContent = '計算しました。続けて電卓キーも使えます';
  naturalLanguageHelp.classList.remove('natural-language-error');
});

document.addEventListener('keydown', (event) => {
  if (/^\d$/.test(event.key)) inputNumber(event.key);
  else if (event.key === '.') inputDecimal();
  else if (['+', '-', '*', '/'].includes(event.key)) inputOperator({ '+': '+', '-': '−', '*': '×', '/': '÷' }[event.key]);
  else if (event.key === 'Enter' || event.key === '=') executeAction('equals');
  else if (event.key === 'Escape') executeAction('clear');
  else if (event.key === 'Backspace') {
    if (!shouldReplace && current !== 'エラー') current = current.length > 1 ? current.slice(0, -1) : '0';
  } else return;
  updateDisplay();
});

updateDisplay();
