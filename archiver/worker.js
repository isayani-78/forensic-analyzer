import * as tar from "/assets/vendor/tar-stream.mjs";
import { Gzip } from "/assets/vendor/fflate.mjs";

self.onmessage = async e => {
  const files = e.data;
  const total = files.length;

  try {
    const pack = tar.pack();
    const gzip = new Gzip();

    gzip.ondata = (chunk, final) => {
      self.postMessage({ chunk });
      if (final) self.postMessage({ done: true });
    };

    pack.on("data", d => gzip.push(d));
    pack.on("end", () => gzip.push(new Uint8Array(0), true));

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      self.postMessage({
        progress: i,
        currentFile: file.webkitRelativePath
      });

      const buf = new Uint8Array(await file.arrayBuffer());

      pack.entry({
        name: file.webkitRelativePath,
        size: buf.length,
        mode: 0o644
      }, buf);
    }

    self.postMessage({ progress: total, currentFile: "" });

    pack.finalize();

  } catch (err) {
    self.postMessage({ error: err.message });
  }
};