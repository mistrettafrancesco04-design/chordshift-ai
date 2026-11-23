// Synthetic scan scenes, drawn with canvas. Injected into test pages via addScriptTag.
// window.makeFixture(name) -> { canvas, imageData, corners, width, height }
(function () {
  const W = 480;
  const H = 640;

  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function wood(ctx, rand) {
    ctx.fillStyle = '#5a3d26';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      const y = rand() * H;
      ctx.strokeStyle = `rgba(${40 + rand() * 60},${25 + rand() * 30},${10 + rand() * 20},0.5)`;
      ctx.lineWidth = 1 + rand() * 3;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(W / 3, y + rand() * 20 - 10, (2 * W) / 3, y + rand() * 20 - 10, W, y + rand() * 10 - 5);
      ctx.stroke();
    }
  }

  function noise(ctx, rand, amount) {
    const img = ctx.getImageData(0, 0, W, H);
    for (let i = 0; i < img.data.length; i += 4) {
      const n = (rand() - 0.5) * amount;
      img.data[i] += n;
      img.data[i + 1] += n;
      img.data[i + 2] += n;
    }
    ctx.putImageData(img, 0, 0);
  }

  function paper(ctx, corners, { color = '#f7f6f2', marker = true } = {}) {
    ctx.save();
    ctx.beginPath();
    corners.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.clip();
    // Text lines interpolated inside the quad.
    const [tl, tr, br, bl] = corners;
    const lerp = (a, b, t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 3;
    for (let t = 0.12; t < 0.9; t += 0.06) {
      const l = lerp(tl, bl, t);
      const r = lerp(tr, br, t);
      const a = lerp(l, r, 0.1);
      const b = lerp(l, r, 0.6 + 0.3 * ((t * 7) % 1));
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    if (marker) {
      const l = lerp(tl, bl, 0.3);
      const r = lerp(tr, br, 0.3);
      const a = lerp(l, r, 0.1);
      const b = lerp(l, r, 0.7);
      ctx.strokeStyle = 'rgba(230,30,30,0.9)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y + 14);
      ctx.lineTo(b.x, b.y + 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  function shadow(ctx) {
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(0.5, 'rgba(0,0,0,0.05)');
    g.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  const P = (x, y) => ({ x, y });
  const scenes = {
    wood: { corners: [P(70, 110), P(400, 80), P(430, 560), P(50, 530)], bg: 'wood' },
    lightShadow: { corners: [P(60, 70), P(420, 90), P(410, 580), P(80, 570)], bg: 'light', shadow: true },
    empty: { corners: null, bg: 'wood' },
    cutOff: { corners: [P(-40, 100), P(380, 90), P(400, 600), P(-20, 610)], bg: 'wood' },
    receipt: { corners: [P(170, 20), P(320, 30), P(310, 620), P(165, 612)], bg: 'wood', marker: false },
  };

  window.makeFixture = function (name) {
    const s = scenes[name];
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const rand = rng(42);
    if (s.bg === 'wood') wood(ctx, rand);
    else {
      ctx.fillStyle = '#cfcfcf';
      ctx.fillRect(0, 0, W, H);
    }
    if (s.corners) paper(ctx, s.corners, { marker: s.marker !== false });
    if (s.shadow) shadow(ctx);
    noise(ctx, rand, 12);
    return { canvas, imageData: ctx.getImageData(0, 0, W, H), corners: s.corners, width: W, height: H };
  };
  window.fixtureNames = Object.keys(scenes);
})();
