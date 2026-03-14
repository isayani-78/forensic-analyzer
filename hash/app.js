// app.js — UI and file handling

const drop          = document.getElementById('drop');
const fileInput     = document.getElementById('file');
const hashBtn       = document.getElementById('hashBtn');
const results       = document.getElementById('results');
const fileInfo      = document.getElementById('fileInfo');
const fileNameEl    = document.getElementById('fileName');
const fileSizeEl    = document.getElementById('fileSize');
const resultsHeader = document.getElementById('resultsHeader');

let currentFile = null;

// ── Drop zone ──────────────────────────────────────
drop.addEventListener('click', () => fileInput.click());

drop.addEventListener('dragover', e => {
  e.preventDefault();
  drop.classList.add('active');
});

drop.addEventListener('dragleave', () => drop.classList.remove('active'));

drop.addEventListener('drop', e => {
  e.preventDefault();
  drop.classList.remove('active');
  setFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', e => setFile(e.target.files[0]));

function setFile(file) {
  if (!file) return;
  currentFile = file;
  fileNameEl.textContent = file.name;
  fileSizeEl.textContent = formatBytes(file.size);
  fileInfo.classList.add('visible');
  hashBtn.disabled = false;
  results.innerHTML = '';
  resultsHeader.classList.remove('visible');
}

// ── Hash button ────────────────────────────────────
hashBtn.addEventListener('click', async () => {
  if (!currentFile) return;

  const selected = [...document.querySelectorAll('input[name="algo"]:checked')]
    .map(cb => cb.value);

  if (selected.length === 0) {
    results.innerHTML = '<div class="computing-row"><span class="error-text">Select at least one algorithm.</span></div>';
    resultsHeader.classList.add('visible');
    return;
  }

  results.innerHTML = `
    <div class="computing-row">
      <span class="spinner"></span>
      Computing ${selected.length} hash${selected.length > 1 ? 'es' : ''}…
    </div>`;
  resultsHeader.classList.add('visible');
  hashBtn.disabled = true;

  const buffer = await currentFile.arrayBuffer();
  const rows = [];

  for (const algo of selected) {
    try {
      const hex = await computeHash(algo, buffer);
      rows.push({ algo, hex, error: null });
    } catch (err) {
      rows.push({ algo, hex: null, error: err.message });
    }
  }

  renderResults(rows);
  hashBtn.disabled = false;
});

// ── Render ─────────────────────────────────────────
function renderResults(rows) {
  results.innerHTML = rows.map(({ algo, hex, error }, i) => `
    <div class="result-row" style="animation-delay:${i * 0.05}s">
      <span class="algo-badge">${algo}</span>
      ${error
        ? `<span class="error-text">${error}</span><span></span>`
        : `<code class="hash-value">${hex}</code>
           <button class="btn-copy" data-hash="${hex}">Copy</button>`
      }
    </div>
  `).join('');

  results.querySelectorAll('.btn-copy').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard.writeText(btn.dataset.hash).then(() => {
        btn.textContent = '✓ Copied';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = 'Copy';
          btn.classList.remove('copied');
        }, 2000);
      });
    });
  });
}

// ── Helpers ────────────────────────────────────────
function formatBytes(bytes) {
  if (bytes < 1024)    return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}