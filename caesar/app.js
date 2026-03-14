const input        = document.getElementById('input');
const runBtn       = document.getElementById('runBtn');
const results      = document.getElementById('results');
const shiftRange   = document.getElementById('shiftRange');
const shiftVal     = document.getElementById('shiftVal');
const shiftSection = document.getElementById('shiftSection');

shiftRange.addEventListener('input', () => {
  shiftVal.textContent = shiftRange.value;
});

document.querySelectorAll('input[name="mode"]').forEach(r => {
  r.addEventListener('change', () => {
    shiftSection.style.display = r.value === 'auto' ? 'none' : 'block';
    results.innerHTML = '';
  });
});

function shiftChar(c, n) {
  if (!/[a-zA-Z]/.test(c)) return c;
  const base = c >= 'a' ? 97 : 65;
  return String.fromCharCode(((c.charCodeAt(0) - base + n + 26) % 26) + base);
}

function applyShift(text, n) {
  return text.split('').map(c => shiftChar(c, n)).join('');
}

function freqScore(text) {
  const freq = 'etaoinshrdlcumwfgypbvkjxqz';
  const counts = {};
  let letters = 0;
  for (const c of text.toLowerCase()) {
    if (/[a-z]/.test(c)) { counts[c] = (counts[c] || 0) + 1; letters++; }
  }
  if (!letters) return 0;
  return Object.entries(counts)
    .reduce((s, [c, n]) => s + (freq.indexOf(c) === -1 ? 0 : (26 - freq.indexOf(c)) * n), 0) / letters;
}

function copyBtn(text) {
  const btn = document.createElement('button');
  btn.className = 'btn-copy';
  btn.textContent = 'Copy';
  btn.addEventListener('click', () => {
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = '✓ Copied';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  });
  return btn;
}

function makeRow(label, text, highlight) {
  const row = document.createElement('div');
  row.className = 'result-row';
  row.style.cssText = `grid-template-columns: 52px 1fr auto;${highlight ? ' border-left: 2px solid var(--accent);' : ''}`;

  const badge = document.createElement('span');
  badge.className = 'algo-badge';
  badge.textContent = label;

  const code = document.createElement('code');
  code.className = 'hash-value';
  code.style.cssText = 'word-break:break-all;';
  code.textContent = text;

  row.appendChild(badge);
  row.appendChild(code);
  row.appendChild(copyBtn(text));
  return row;
}

function render() {
  const text = input.value;
  if (!text.trim()) return;

  results.innerHTML = '';
  const mode = document.querySelector('input[name="mode"]:checked').value;

  if (mode === 'auto') {
    const candidates = Array.from({ length: 25 }, (_, i) => {
      const shift = i + 1;
      const out   = applyShift(text, -shift);
      return { shift, out, score: freqScore(out) };
    }).sort((a, b) => b.score - a.score);

    const best = candidates[0].score;
    candidates.forEach(({ shift, out, score }) => {
      results.appendChild(makeRow(`-${shift}`, out, score === best));
    });
    return;
  }

  const n   = parseInt(shiftRange.value);
  const out = applyShift(text, mode === 'encrypt' ? n : -n);
  results.appendChild(makeRow(
    mode === 'encrypt' ? `+${n}` : `-${n}`,
    out,
    true
  ));
}

runBtn.addEventListener('click', render);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) render();
});