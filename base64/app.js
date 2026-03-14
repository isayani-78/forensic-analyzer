const input    = document.getElementById('input');
const runBtn   = document.getElementById('runBtn');
const results  = document.getElementById('results');
const header   = document.getElementById('resultsHeader');

function getMode() {
  return document.querySelector('input[name="mode"]:checked').value;
}

function isUrlSafe() {
  return document.getElementById('opt-url').checked;
}

function shouldWrap() {
  return document.getElementById('opt-wrap').checked;
}

function encode(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  let b64 = btoa(binary);
  if (isUrlSafe()) b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  if (shouldWrap()) b64 = b64.match(/.{1,76}/g).join('\n');
  return b64;
}

function decode(str) {
  let b64 = str.trim();
  if (isUrlSafe()) {
    b64 = b64.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
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

function render(text, isError) {
  results.innerHTML = '';
  header.classList.add('visible');

  if (isError) {
    const row = document.createElement('div');
    row.className = 'computing-row';
    row.innerHTML = `<span class="error-text">${text}</span>`;
    results.appendChild(row);
    return;
  }

  const row = document.createElement('div');
  row.className = 'result-row';
  row.style.gridTemplateColumns = '1fr auto';

  const code = document.createElement('code');
  code.className = 'hash-value';
  code.style.wordBreak = 'break-all';
  code.textContent = text;

  row.appendChild(code);
  row.appendChild(copyBtn(text));
  results.appendChild(row);

  const meta = document.createElement('div');
  meta.style.cssText = 'padding:10px 18px 0; font-family:var(--font-ui); font-size:var(--fs-xs); color:var(--muted);';
  meta.textContent = `${text.replace(/\n/g, '').length} chars`;
  results.appendChild(meta);
}

runBtn.addEventListener('click', () => {
  const val = input.value;
  if (!val.trim()) return;

  const mode = getMode();
  try {
    const out = mode === 'encode' ? encode(val) : decode(val);
    render(out, false);
  } catch (e) {
    render(mode === 'decode' ? 'Invalid Base64 input.' : e.message, true);
  }
});

input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) runBtn.click();
});

document.querySelectorAll('input[name="mode"]').forEach(r => {
  r.addEventListener('change', () => { results.innerHTML = ''; });
});