/**
 * JavaScript that runs inside the hidden image-processing page (WebView on iOS/Android,
 * same-origin iframe on web). It is kept as a string because Hermes does not retain
 * function source code.
 *
 * Protocol (JSON messages):
 *   host → page   { id, type, payload }
 *   page → host   { type: 'ready' }
 *                 { id, type: 'progress', value, label }
 *                 { id, ok: true, result } | { id, ok: false, error }
 *
 * Operations:
 *   lib       – register a vendored library (pdf.js, Tesseract, language data)
 *   renderPdf – rasterise PDF pages to PNG
 *   ocr       – recognise words with bounding boxes (Tesseract, on-device)
 *   measure   – sample paper/ink colours and free space around chord boxes
 *   compose   – paint new chord labels into exactly the chord boxes, return PNG
 *
 * IMPORTANT: `compose` only ever writes pixels inside a chord box (+1px anti-alias pad)
 * or into the blank paper area to its right that `measure` verified as empty.
 * Every other pixel of the sheet is copied unchanged.
 */
export const ENGINE_RUNTIME = String.raw`
(function () {
  var libs = {};
  var queue = Promise.resolve();
  var ocrWorker = null;

  function send(msg) {
    var text = JSON.stringify(msg);
    if (window.ReactNativeWebView) window.ReactNativeWebView.postMessage(text);
    else window.parent.postMessage(text, '*');
  }

  function b64ToBytes(b64) {
    var bin = atob(b64);
    var bytes = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  function loadBytes(payload) {
    if (payload.base64) return Promise.resolve(b64ToBytes(payload.base64));
    return fetch(payload.url).then(function (r) {
      if (!r.ok) throw new Error('Asset konnte nicht geladen werden: ' + payload.name);
      return r.arrayBuffer();
    }).then(function (buf) { return new Uint8Array(buf); });
  }

  function loadScript(url) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = function () { reject(new Error('Skript konnte nicht geladen werden')); };
      document.head.appendChild(s);
    });
  }

  function registerLib(payload) {
    return loadBytes(payload).then(function (bytes) {
      var name = payload.name;
      if (name === 'eng-traineddata') {
        libs[name] = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
        return { name: name };
      }
      if (name === 'tesseract-worker') { libs[name] = new TextDecoder().decode(bytes); return { name: name }; }
      var url = URL.createObjectURL(new Blob([bytes], { type: 'text/javascript' }));
      libs[name] = url;
      if (name === 'pdf' || name === 'tesseract') return loadScript(url).then(function () { return { name: name }; });
      return { name: name };
    });
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('Bild konnte nicht geladen werden')); };
      img.src = src;
    });
  }

  function canvasFor(img, scale) {
    var c = document.createElement('canvas');
    c.width = Math.round(img.naturalWidth * (scale || 1));
    c.height = Math.round(img.naturalHeight * (scale || 1));
    var ctx = c.getContext('2d', { willReadFrequently: true });
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { canvas: c, ctx: ctx };
  }

  function toB64(canvas, mime, quality) {
    return canvas.toDataURL(mime || 'image/png', quality).split(',')[1];
  }

  // ---------------------------------------------------------------- PDF
  function renderPdf(id, p) {
    if (!window.pdfjsLib) throw new Error('pdf.js nicht geladen');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = libs['pdf-worker'];
    return window.pdfjsLib.getDocument({ data: b64ToBytes(p.data), isEvalSupported: false }).promise.then(function (doc) {
      var count = Math.min(doc.numPages, p.maxPages || 20);
      var pages = [];
      var chain = Promise.resolve();
      for (var n = 1; n <= count; n++) {
        (function (num) {
          chain = chain.then(function () { return doc.getPage(num); }).then(function (page) {
            var base = page.getViewport({ scale: 1 });
            var scale = (p.targetWidth || 1800) / base.width;
            var vp = page.getViewport({ scale: scale });
            var c = document.createElement('canvas');
            c.width = Math.round(vp.width);
            c.height = Math.round(vp.height);
            var ctx = c.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, c.width, c.height);
            return page.render({ canvasContext: ctx, viewport: vp }).promise.then(function () {
              pages.push({ base64: toB64(c), width: c.width, height: c.height });
              send({ id: id, type: 'progress', value: num / count, label: 'Seite ' + num + ' von ' + count });
              page.cleanup();
            });
          });
        })(n);
      }
      return chain.then(function () {
        var total = doc.numPages;
        doc.destroy();
        return { pageCount: total, pages: pages };
      });
    });
  }

  // ---------------------------------------------------------------- OCR
  function getOcrWorker(id) {
    if (ocrWorker) return Promise.resolve(ocrWorker);
    if (!window.Tesseract) throw new Error('Tesseract nicht geladen');
    // The worker fetches '<langPath>/eng.traineddata.gz'. There is no file server inside the
    // WebView, so the worker's fetch is wrapped to serve the bundled model from a Blob URL.
    var prelude = 'var __csLang=' + JSON.stringify(libs['eng-traineddata']) + ';' +
      'var __csFetch=self.fetch.bind(self);' +
      'self.fetch=function(u,o){if(typeof u==="string"&&u.indexOf("/cs-tessdata/")>=0){return __csFetch(__csLang);}return __csFetch(u,o);};' + String.fromCharCode(10);
    var workerUrl = URL.createObjectURL(new Blob([prelude + libs['tesseract-worker']], { type: 'text/javascript' }));
    return window.Tesseract.createWorker('eng', 1, {
      workerPath: workerUrl,
      langPath: 'https://engine.chordshift.app/cs-tessdata',
      corePath: libs['tesseract-core'] + '#tesseract-core-lstm.wasm.js',
      workerBlobURL: false,
      cacheMethod: 'none',
      gzip: true,
      logger: function (m) {
        if (m && typeof m.progress === 'number') send({ id: id, type: 'progress', value: m.progress, label: m.status });
      }
    }).then(function (w) {
      ocrWorker = w;
      return w;
    });
  }

  function collectWords(res, offX, offY, W, H, out) {
    (res.data.blocks || []).forEach(function (b) {
      (b.paragraphs || []).forEach(function (para) {
        (para.lines || []).forEach(function (line) {
          (line.words || []).forEach(function (w) {
            if (!w.text || !w.text.trim()) return;
            out.push({
              text: w.text.trim(),
              confidence: (w.confidence || 0) / 100,
              box: {
                x: (w.bbox.x0 + offX) / W,
                y: (w.bbox.y0 + offY) / H,
                width: (w.bbox.x1 - w.bbox.x0) / W,
                height: (w.bbox.y1 - w.bbox.y0) / H
              }
            });
          });
        });
      });
    });
  }

  // Horizontal text bands (rows containing ink), used for a second, line-by-line OCR pass
  // that reliably picks up single-letter chords ("G", "C") which sparse mode tends to miss.
  function findBands(d, W, H) {
    var bands = [], start = -1, gap = 0;
    for (var y = 0; y < H; y++) {
      var dark = 0;
      for (var x = 0; x < W; x += 2) if (d[(y * W + x) * 4] < 128) dark++;
      var active = dark >= 2;
      if (active) { if (start < 0) start = y; gap = 0; }
      else if (start >= 0) {
        gap++;
        if (gap > 3) { bands.push({ y: start, h: y - gap - start + 1 }); start = -1; gap = 0; }
      }
    }
    if (start >= 0) bands.push({ y: start, h: H - start });
    return bands.filter(function (b) { return b.h >= 10 && b.h <= 160; });
  }

  function ocr(id, p) {
    return loadImage(p.src).then(function (img) {
      // Normalise resolution: chord labels should be roughly 30–60px tall for Tesseract.
      var scale = Math.max(1, Math.min(2.5, 2200 / img.naturalWidth));
      var prepared = canvasFor(img, scale);
      var W = prepared.canvas.width, H = prepared.canvas.height;
      var data = prepared.ctx.getImageData(0, 0, W, H);
      var d = data.data;
      for (var i = 0; i < d.length; i += 4) {
        var l = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        l = l < 150 ? Math.max(0, l - 40) : Math.min(255, l + 40);
        d[i] = d[i + 1] = d[i + 2] = l;
      }
      // Remove staff lines and other long horizontal rules (rows that are mostly ink).
      for (var y = 0; y < H; y++) {
        var dark = 0;
        for (var x = 0; x < W; x++) if (d[(y * W + x) * 4] < 128) dark++;
        if (dark > W * 0.3) for (var x2 = 0; x2 < W; x2++) { var k = (y * W + x2) * 4; d[k] = d[k + 1] = d[k + 2] = 255; }
      }
      prepared.ctx.putImageData(data, 0, 0);
      var bands = findBands(d, W, H);
      var words = [];

      return getOcrWorker(id).then(function (w) {
        return w.setParameters({ tessedit_pageseg_mode: '11' })
          .then(function () { return w.recognize(prepared.canvas, {}, { blocks: true, text: false }); })
          .then(function (res) {
            collectWords(res, 0, 0, W, H, words);
            return w.setParameters({ tessedit_pageseg_mode: '7' });
          })
          .then(function () {
            var chain = Promise.resolve();
            bands.forEach(function (band, index) {
              chain = chain.then(function () {
                var pad = Math.round(band.h * 0.35);
                var y0 = Math.max(0, band.y - pad), h = Math.min(H - y0, band.h + pad * 2);
                var strip = document.createElement('canvas');
                strip.width = W; strip.height = h;
                strip.getContext('2d').drawImage(prepared.canvas, 0, y0, W, h, 0, 0, W, h);
                return w.recognize(strip, {}, { blocks: true, text: false }).then(function (res) {
                  collectWords(res, 0, y0, W, H, words);
                  send({ id: id, type: 'progress', value: (index + 1) / bands.length, label: 'Zeile ' + (index + 1) + ' von ' + bands.length });
                });
              });
            });
            return chain;
          });
      }).then(function () {
        return { words: words, width: img.naturalWidth, height: img.naturalHeight };
      });
    });
  }

  // ---------------------------------------------------------------- colour analysis
  function hex(r, g, b) {
    return '#' + [r, g, b].map(function (v) { return ('0' + Math.round(v).toString(16)).slice(-2); }).join('');
  }
  function median(arr) {
    if (!arr.length) return 255;
    arr.sort(function (a, b) { return a - b; });
    return arr[Math.floor(arr.length / 2)];
  }
  function px(d, W, x, y) { var i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; }

  function lum(d, W, x, y) { var i = (y * W + x) * 4; return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]; }

  // Grows a user-drawn box until no glyph is cut by its edges, so a roughly drawn box
  // always encloses the complete label. Rows/columns that are mostly ink (staff lines,
  // rules) stop the growth instead of being swallowed.
  function growBox(d, W, H, b) {
    var x0 = Math.max(0, Math.floor(b.x * W)), y0 = Math.max(0, Math.floor(b.y * H));
    var x1 = Math.min(W - 1, Math.ceil((b.x + b.width) * W)), y1 = Math.min(H - 1, Math.ceil((b.y + b.height) * H));
    var maxGrow = Math.max(8, Math.round(Math.max(x1 - x0, y1 - y0) * 0.8));
    function inkInRow(y, a, z) { var n = 0; for (var x = a; x <= z; x++) if (lum(d, W, x, y) < 128) n++; return n; }
    function inkInCol(x, a, z) { var n = 0; for (var y = a; y <= z; y++) if (lum(d, W, x, y) < 128) n++; return n; }
    for (var step = 0; step < maxGrow; step++) {
      var grew = false, n;
      n = inkInRow(y0, x0, x1); if (y0 > 0 && n > 0 && n < (x1 - x0 + 1) * 0.6) { y0--; grew = true; }
      n = inkInRow(y1, x0, x1); if (y1 < H - 1 && n > 0 && n < (x1 - x0 + 1) * 0.6) { y1++; grew = true; }
      n = inkInCol(x0, y0, y1); if (x0 > 0 && n > 0 && n < (y1 - y0 + 1) * 0.9) { x0--; grew = true; }
      n = inkInCol(x1, y0, y1); if (x1 < W - 1 && n > 0 && n < (y1 - y0 + 1) * 0.9) { x1++; grew = true; }
      if (!grew) break;
    }
    return { x: x0 / W, y: y0 / H, width: (x1 - x0 + 1) / W, height: (y1 - y0 + 1) / H };
  }

  function measureOne(d, W, H, b, grow) {
    if (grow) b = growBox(d, W, H, b);
    var bx = Math.max(0, Math.floor(b.x * W)), by = Math.max(0, Math.floor(b.y * H));
    var bw = Math.max(1, Math.min(W - bx, Math.ceil(b.width * W))), bh = Math.max(1, Math.min(H - by, Math.ceil(b.height * H)));
    var rs = [], gs = [], bs = [];
    function sample(x, y) {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      var c = px(d, W, x, y); rs.push(c[0]); gs.push(c[1]); bs.push(c[2]);
    }
    for (var o = 2; o <= 3; o++) {
      for (var x = bx - o; x <= bx + bw + o; x++) { sample(x, by - o); sample(x, by + bh + o); }
      for (var y = by - o; y <= by + bh + o; y++) { sample(bx - o, y); sample(bx + bw + o, y); }
    }
    var paper = [median(rs), median(gs), median(bs)];
    var paperLum = 0.299 * paper[0] + 0.587 * paper[1] + 0.114 * paper[2];

    var ir = 0, ig = 0, ib = 0, n = 0;
    var minX = Infinity, minY = Infinity, maxX = -1, maxY = -1;
    for (var yy = by; yy < by + bh; yy++) for (var xx = bx; xx < bx + bw; xx++) {
      var c = px(d, W, xx, yy);
      if (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2] < paperLum - 80) {
        ir += c[0]; ig += c[1]; ib += c[2]; n++;
        if (xx < minX) minX = xx; if (xx > maxX) maxX = xx;
        if (yy < minY) minY = yy; if (yy > maxY) maxY = yy;
      }
    }
    var ink = n ? [ir / n, ig / n, ib / n] : [0, 0, 0];
    // Tight box around the label's actual ink: the mask never covers more than the chord itself.
    var tight = n > 3 ? { x: minX / W, y: minY / H, width: (maxX - minX + 1) / W, height: (maxY - minY + 1) / H } : null;

    // Blank paper to the right of the box (safe to use for longer chord names).
    function blank(x) {
      for (var y2 = Math.max(0, by - 1); y2 < Math.min(H, by + bh + 1); y2++) {
        var c2 = px(d, W, x, y2);
        if (Math.abs(c2[0] - paper[0]) + Math.abs(c2[1] - paper[1]) + Math.abs(c2[2] - paper[2]) > 90) return false;
      }
      return true;
    }
    var right = tight ? maxX + 1 : bx + bw;
    var left = tight ? minX : bx;
    var free = 0, limit = Math.round(bw * 1.5 + bh);
    for (var fx = right + 1; fx < Math.min(W, right + 1 + limit); fx++) { if (!blank(fx)) break; free++; }
    free = Math.max(0, free - 3); // keep a safety gap to the next element

    return {
      paper: hex(paper[0], paper[1], paper[2]),
      ink: hex(ink[0], ink[1], ink[2]),
      maxWidth: (right - left + free) / W,
      tight: tight
    };
  }

  function measure(p) {
    return loadImage(p.src).then(function (img) {
      var prepared = canvasFor(img, 1);
      var W = prepared.canvas.width, H = prepared.canvas.height;
      var d = prepared.ctx.getImageData(0, 0, W, H).data;
      return { regions: p.boxes.map(function (b) { return measureOne(d, W, H, b, !!p.grow); }) };
    });
  }

  // ---------------------------------------------------------------- compose
  function compose(p) {
    return loadImage(p.src).then(function (img) {
      var prepared = canvasFor(img, 1);
      var c = prepared.canvas, ctx = prepared.ctx;
      var W = c.width, H = c.height;
      p.chords.forEach(function (ch) {
        var bx = ch.box.x * W, by = ch.box.y * H, bw = ch.box.width * W, bh = ch.box.height * H;
        var avail = Math.max(bw, (ch.maxWidth || ch.box.width) * W);
        var family = '"Helvetica Neue", Helvetica, Arial, sans-serif';
        // Boxes are tight glyph boxes: their height is roughly the cap height (~0.72 em).
        var size = bh / 0.72;
        ctx.font = 'bold ' + size + 'px ' + family;
        var w = ctx.measureText(ch.text).width;
        if (w > avail) { size = size * Math.max(0.75, avail / w); ctx.font = 'bold ' + size + 'px ' + family; w = ctx.measureText(ch.text).width; }
        var stretch = w > avail ? avail / w : 1;
        var drawn = w * stretch;

        // Mask: the chord box plus (only if needed) verified-blank paper to its right.
        ctx.fillStyle = ch.paper || '#ffffff';
        ctx.fillRect(bx - 1, by - 1, Math.max(bw, drawn) + 2, bh + 2);

        ctx.save();
        ctx.fillStyle = ch.ink || '#000000';
        ctx.textBaseline = 'alphabetic';
        ctx.translate(bx, by + bh);
        ctx.scale(stretch, 1);
        ctx.fillText(ch.text, 0, 0);
        ctx.restore();
      });
      return { base64: toB64(c, 'image/png'), width: W, height: H };
    });
  }

  var ops = {
    lib: function (id, p) { return registerLib(p); },
    renderPdf: renderPdf,
    ocr: ocr,
    measure: function (id, p) { return measure(p); },
    compose: function (id, p) { return compose(p); },
    ping: function () { return { pong: true }; }
  };

  function handle(raw) {
    var msg;
    try { msg = typeof raw === 'string' ? JSON.parse(raw) : raw; } catch (e) { return; }
    if (!msg || !msg.id || !ops[msg.type]) return;
    queue = queue.then(function () {
      return Promise.resolve().then(function () { return ops[msg.type](msg.id, msg.payload || {}); });
    }).then(function (result) {
      send({ id: msg.id, ok: true, result: result });
    }, function (err) {
      send({ id: msg.id, ok: false, error: (err && err.message) || String(err) });
    });
  }

  window.__chordshiftEngine = { handle: handle };
  window.addEventListener('message', function (e) { handle(e.data); });
  document.addEventListener('message', function (e) { handle(e.data); });
  send({ type: 'ready' });
})();
`;

export function buildEngineHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body><script>${ENGINE_RUNTIME.replace(/<\/script/gi, '<\\/script')}</script></body></html>`;
}
