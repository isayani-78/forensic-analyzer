import { downloadBlob } from "./download.js";

const folderInput   = document.getElementById("folder");
const drop          = document.getElementById("drop");
const folderInfo    = document.getElementById("folderInfo");
const folderName    = document.getElementById("folderName");
const folderCount   = document.getElementById("folderCount");
const outputName    = document.getElementById("outputName");
const archiveBtn    = document.getElementById("archiveBtn");
const treeContainer = document.getElementById("treeContainer");
const treeLabel     = document.getElementById("treeLabel");


const progressSection = document.getElementById("progressSection");
if (progressSection) progressSection.remove();

let currentFiles = [];


drop.addEventListener("click", () => folderInput.click());

drop.addEventListener("dragover", e => {
  e.preventDefault();
  drop.classList.add("active");
});
drop.addEventListener("dragleave", () => drop.classList.remove("active"));
drop.addEventListener("drop", e => {
  e.preventDefault();
  drop.classList.remove("active");
  const items = [...e.dataTransfer.items];
  const entry = items[0]?.webkitGetAsEntry?.();
  if (entry?.isDirectory) {
    readDirectory(entry).then(files => setFiles(files));
  }
});

folderInput.addEventListener("change", e => {
  setFiles([...e.target.files]);
});

async function readDirectory(dirEntry, path = "") {
  return new Promise(resolve => {
    const reader = dirEntry.createReader();
    const files = [];
    function readBatch() {
      reader.readEntries(async entries => {
        if (!entries.length) return resolve(files);
        for (const entry of entries) {
          if (entry.isFile) {
            await new Promise(res => entry.file(f => {
              Object.defineProperty(f, "webkitRelativePath", {
                value: (path ? path + "/" : "") + f.name,
                writable: false
              });
              files.push(f);
              res();
            }));
          } else if (entry.isDirectory) {
            const sub = await readDirectory(entry, (path ? path + "/" : "") + entry.name);
            files.push(...sub);
          }
        }
        readBatch();
      });
    }
    readBatch();
  });
}

function setFiles(files) {
  if (!files.length) return;
  currentFiles = files;

  const rootName = files[0].webkitRelativePath.split("/")[0] || "folder";
  folderName.textContent = rootName;
  folderCount.textContent = `${files.length} file${files.length !== 1 ? "s" : ""}`;
  folderInfo.classList.add("visible");

  outputName.value = rootName;
  archiveBtn.disabled = false;
  setBtnIdle();
  renderTree(files);
}


function setBtnIdle() {
  archiveBtn.disabled = false;
  archiveBtn.className = "btn-generate btn-idle";
  archiveBtn.innerHTML = `<span class="btn-text">Create Archive</span>`;
}

function setBtnWorking(pct, fileName) {
  archiveBtn.disabled = true;
  archiveBtn.className = "btn-generate btn-working";

  const label = fileName
    ? fileName.split("/").pop().slice(0, 32) + (fileName.split("/").pop().length > 32 ? "…" : "")
    : "Compressing…";
  archiveBtn.innerHTML = `
    <span class="btn-progress-track">
      <span class="btn-progress-fill" style="width:${pct}%"></span>
    </span>
    <span class="btn-text btn-text-working">
      <span class="btn-pct">${pct}%</span>
      <span class="btn-file">${label}</span>
    </span>
  `;
}

function setBtnDone(archiveName, size) {
  archiveBtn.disabled = false;
  archiveBtn.className = "btn-generate btn-done";
  archiveBtn.innerHTML = `
    <span class="btn-text">✓ ${archiveName} &nbsp;·&nbsp; ${formatBytes(size)}</span>
  `;

  setTimeout(() => {
    if (currentFiles.length) setBtnIdle();
  }, 3000);
}

function setBtnError(msg) {
  archiveBtn.disabled = false;
  archiveBtn.className = "btn-generate btn-error";
  archiveBtn.innerHTML = `<span class="btn-text">✕ ${msg}</span>`;
  setTimeout(() => {
    if (currentFiles.length) setBtnIdle();
  }, 4000);
}


archiveBtn.addEventListener("click", () => {
  if (!currentFiles.length || archiveBtn.disabled) return;

  setBtnWorking(0, "");

  const worker = new Worker("./worker.js", { type: "module" });
  const chunks = [];
  const total = currentFiles.length;

  worker.postMessage(currentFiles);

  worker.onmessage = e => {
    if (e.data.chunk) {
      chunks.push(e.data.chunk);
    }
    if (e.data.progress !== undefined) {
      const pct = Math.round((e.data.progress / total) * 100);
      setBtnWorking(pct, e.data.currentFile || "");
    }
    if (e.data.done) {
      const name = (outputName.value.trim() || "archive") + ".tar.gz";
      const blob = new Blob(chunks, { type: "application/gzip" });
      downloadBlob(blob, name);
      setBtnDone(name, blob.size);
    }
    if (e.data.error) {
      setBtnError(e.data.error);
    }
  };
});


function renderTree(files) {
  const root = buildTreeData(files);
  const totalSize = files.reduce((s, f) => s + f.size, 0);

  treeLabel.innerHTML = `
    <span class="results-label-left">File Preview</span>
    <span class="results-label-count">${files.length} files · ${formatBytes(totalSize)}</span>
  `;

  treeContainer.innerHTML = "";
  treeContainer.appendChild(renderNode(root, true));
}

function buildTreeData(files) {
  const root = { name: "", children: {}, files: [] };
  for (const file of files) {
    const parts = file.webkitRelativePath.split("/");
    let node = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!node.children[part]) node.children[part] = { name: part, children: {}, files: [] };
      node = node.children[part];
    }
    node.files.push(file);
  }
  return root;
}

function renderNode(node, isRoot = false) {
  if (isRoot) {
    const wrap = document.createElement("div");
    wrap.className = "tree";
    for (const child of Object.values(node.children)) wrap.appendChild(renderDir(child));
    for (const file of node.files) wrap.appendChild(renderFile(file));
    return wrap;
  }
  return renderDir(node);
}

function renderDir(node) {
  const dirEl = document.createElement("div");
  dirEl.className = "tree-dir open";

  const totalFiles = countFiles(node);
  const header = document.createElement("div");
  header.className = "tree-dir-header";
  header.innerHTML = `
    <span class="tree-dir-arrow">▶</span>
    <span class="tree-dir-icon">▤</span>
    <span class="tree-dir-name">${node.name}</span>
    <span class="tree-dir-count">${totalFiles}</span>
  `;
  header.addEventListener("click", () => dirEl.classList.toggle("open"));

  const children = document.createElement("div");
  children.className = "tree-children";
  for (const child of Object.values(node.children)) children.appendChild(renderDir(child));
  for (const file of node.files) children.appendChild(renderFile(file));

  dirEl.appendChild(header);
  dirEl.appendChild(children);
  return dirEl;
}

function renderFile(file) {
  const el = document.createElement("div");
  el.className = "tree-file";
  el.innerHTML = `
    <span class="tree-file-icon">${fileIcon(file.name)}</span>
    <span class="tree-file-name">${file.name}</span>
    <span class="tree-file-size">${formatBytes(file.size)}</span>
  `;
  return el;
}

function countFiles(node) {
  return node.files.length + Object.values(node.children).reduce((s, c) => s + countFiles(c), 0);
}

function fileIcon(name) {
  const ext = name.split(".").pop().toLowerCase();
  const map = {
    js: "◈", ts: "◈", jsx: "◈", tsx: "◈",
    css: "◉", scss: "◉", html: "◎",
    json: "▪", md: "▫", txt: "▫",
    png: "▨", jpg: "▨", jpeg: "▨", gif: "▨", svg: "▨", webp: "▨",
    mp4: "▶", mov: "▶", mp3: "♪",
    zip: "▤", gz: "▤", tar: "▤",
    pdf: "▣", doc: "▣", docx: "▣",
    py: "◈", rb: "◈", go: "◈", rs: "◈",
  };
  return map[ext] || "·";
}


function formatBytes(bytes) {
  if (bytes < 1024)       return bytes + " B";
  if (bytes < 1048576)    return (bytes / 1024).toFixed(1) + " KB";
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(2) + " MB";
  return (bytes / 1073741824).toFixed(2) + " GB";
}