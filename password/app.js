const genBtn     = document.getElementById('genBtn');
const results    = document.getElementById('results');
const customLen  = document.getElementById('customLen');

const LOWER_FULL   = 'abcdefghijklmnopqrstuvwxyz';
const UPPER_FULL   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS_FULL  = '0123456789';
const LOWER_SAFE   = 'abcdefghijkmnopqrstuvwxyz';
const UPPER_SAFE   = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGITS_SAFE  = '23456789';
const SYMBOLS      = '!@#$%^&*-_=+?';
const LOOKALIKES   = /[0O1lI]/g;

document.querySelectorAll('input[name="length"]').forEach(r => {
  r.addEventListener('change', () => {
    customLen.style.display = r.value === 'custom' ? 'block' : 'none';
  });
});

function randInt(max) {
  const limit = 256 - (256 % max);
  let v;
  do { v = crypto.getRandomValues(new Uint8Array(1))[0]; } while (v >= limit);
  return v % max;
}

function buildPool(noLook) {
  const pool = [];
  if (document.getElementById('opt-lower').checked)
    pool.push(...(noLook ? LOWER_SAFE : LOWER_FULL));
  if (document.getElementById('opt-upper').checked)
    pool.push(...(noLook ? UPPER_SAFE : UPPER_FULL));
  if (document.getElementById('opt-digits').checked)
    pool.push(...(noLook ? DIGITS_SAFE : DIGITS_FULL));
  if (document.getElementById('opt-symbols').checked)
    pool.push(...SYMBOLS);
  return pool;
}

function guaranteedChars(noLook) {
  const g = [];
  const push = (pool) => g.push(pool[randInt(pool.length)]);
  if (document.getElementById('opt-lower').checked)   { const p = [...(noLook ? LOWER_SAFE : LOWER_FULL)];   push(p); push(p); }
  if (document.getElementById('opt-upper').checked)   { const p = [...(noLook ? UPPER_SAFE : UPPER_FULL)];   push(p); push(p); }
  if (document.getElementById('opt-digits').checked)  { const p = [...(noLook ? DIGITS_SAFE : DIGITS_FULL)]; push(p); push(p); }
  if (document.getElementById('opt-symbols').checked) { const p = [...SYMBOLS];                              push(p); push(p); }
  return g;
}

function generate() {
  const noLook = document.getElementById('opt-nolook').checked;
  const pool   = buildPool(noLook);

  if (!pool.length) return null;

  const lenVal = document.querySelector('input[name="length"]:checked').value;
  const len    = Math.max(8, Math.min(256,
    lenVal === 'custom' ? parseInt(customLen.value) || 24 : parseInt(lenVal)
  ));

  const guaranteed = guaranteedChars(noLook);
  const rest = Array.from({ length: Math.max(0, len - guaranteed.length) },
    () => pool[randInt(pool.length)]
  );

  const chars = [...guaranteed, ...rest];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}

function entropy(pw, poolSize) {
  return Math.floor(pw.length * Math.log2(poolSize));
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

function render(pw) {
  results.innerHTML = '';

  if (!pw) {
    const row = document.createElement('div');
    row.className = 'computing-row';
    row.innerHTML = '<span class="error-text">Select at least one character set.</span>';
    results.appendChild(row);
    return;
  }

  const noLook  = document.getElementById('opt-nolook').checked;
  const pool    = buildPool(noLook);
  const bits    = entropy(pw, pool.length);

  const row = document.createElement('div');
  row.className = 'result-row';
  row.style.gridTemplateColumns = '1fr auto';

  const code = document.createElement('code');
  code.className = 'hash-value';
  code.style.cssText = 'word-break:break-all; letter-spacing:0.04em;';
  code.textContent = pw;

  row.appendChild(code);
  row.appendChild(copyBtn(pw));
  results.appendChild(row);

  const meta = document.createElement('div');
  meta.style.cssText = 'padding:10px 18px 0; font-family:var(--font-ui); font-size:var(--fs-xs); color:var(--muted); display:flex; gap:16px;';
  meta.innerHTML = `<span>${pw.length} chars</span><span>${bits} bits entropy</span>`;
  results.appendChild(meta);
}

genBtn.addEventListener('click', () => render(generate()));