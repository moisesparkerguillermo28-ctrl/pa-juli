const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const W = 800, H = 450, GY = 360, RED = '#ff3b4e', LOOP = 15;
const FONT = '"Caveat","Segoe Print","Comic Sans MS",cursive';
let t0 = performance.now();
cv.addEventListener('click', () => t0 = performance.now());

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, k) => a + (b - a) * k;
const ease = k => k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
const seg = (t, a, b) => clamp((t - a) / (b - a));
let fr = 0;
const jit = k => { const s = Math.sin(fr * 12.9898 + k * 78.233) * 43758.5453; return (s - Math.floor(s)) * 2 - 1; };

function chalk(w = 3.2) { ctx.strokeStyle = '#fff'; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; }

function wline(x1, y1, x2, y2, amp = 1.3, k = 0) {
  const n = Math.max(2, Math.floor(Math.hypot(x2 - x1, y2 - y1) / 18));
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const p = i / n;
    const x = lerp(x1, x2, p) + jit(k + i) * amp, y = lerp(y1, y2, p) + jit(k + i + 50) * amp;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
}

function heartPath(cx, cy, s, amp = 0) {
  const j = i => jit(i + 200) * amp;
  ctx.beginPath();
  ctx.moveTo(cx, cy - .4 * s);
  ctx.bezierCurveTo(cx + j(1), cy - 1.1 * s, cx - 1.1 * s, cy - 1.1 * s + j(2), cx - 1.1 * s + j(3), cy - .35 * s);
  ctx.bezierCurveTo(cx - 1.1 * s, cy + .3 * s, cx - .4 * s, cy + .6 * s, cx + j(4), cy + s);
  ctx.bezierCurveTo(cx + .4 * s, cy + .6 * s, cx + 1.1 * s, cy + .3 * s, cx + 1.1 * s + j(5), cy - .35 * s);
  ctx.bezierCurveTo(cx + 1.1 * s, cy - 1.1 * s + j(6), cx, cy - 1.1 * s, cx, cy - .4 * s);
  ctx.closePath();
}

function drawHeart(cx, cy, s) {
  const amp = Math.max(.6, s * .015);
  heartPath(cx, cy, s, amp);
  ctx.fillStyle = RED; ctx.fill();
  chalk(Math.max(2.5, s * .03)); ctx.stroke();
  // brillo de tiza
  if (s > 40) {
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx - .62 * s, cy - .55 * s, .28 * s, Math.PI * 1.05, Math.PI * 1.5); ctx.stroke(); ctx.restore();
  }
}

function drawGround(scroll) {
  chalk(3);
  wline(-10, GY, W + 10, GY, 1.6, 300);
  for (let i = 0; i < 9; i++) { // pequeñas marcas en el suelo
    const x = ((i * 110 + 40) % (W + 60)) - 20;
    wline(x, GY + 14, x + 18, GY + 14, .8, 400 + i);
  }
}

// personaje
function charGeom(x, bend, walkP) {
  const bounce = Math.abs(Math.sin(walkP)) * 3 * (1 - bend);
  const hipY = GY - 36 + bend * 16 - bounce;
  const th = bend * .75;
  const c = Math.cos(th), s = Math.sin(th);
  const tw = (px, py) => ({ x: x + px * c - py * s, y: hipY + px * s + py * c });
  return { hipY, th, tw, c, s };
}

function drawChar(x, bend, walkP, hands, moving) {
  const g = charGeom(x, bend, walkP);
  chalk(3.2);
  // piernas
  const sw = moving ? Math.sin(walkP) * 16 : 0;
  const lift = moving ? Math.max(0, Math.cos(walkP)) * 7 : 0;
  const lift2 = moving ? Math.max(0, -Math.cos(walkP)) * 7 : 0;
  const spread = bend * 10;
  wline(x - 6, g.hipY, x - 6 + sw - spread, GY - lift, .8, 10);
  wline(x + 6, g.hipY, x + 6 - sw + spread, GY - lift2, .8, 20);
  // cuerpo tipo frijol
  ctx.beginPath();
  const N = 28;
  for (let i = 0; i <= N; i++) {
    const a = i / N * Math.PI * 2;
    const r = 1 + .07 * Math.sin(a * 2 + .6) + jit(i) * .015;
    const px = Math.cos(a) * 30 * r, py = -44 + Math.sin(a) * 42 * r;
    const p = g.tw(px, py);
    i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y);
  }
  ctx.closePath();
  ctx.fillStyle = '#000'; ctx.fill(); ctx.stroke();
  // cara (mirando a la derecha)
  const e1 = g.tw(-2, -56), e2 = g.tw(18, -56);
  ctx.fillStyle = '#fff';
  [e1, e2].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 3.2, 0, 7); ctx.fill(); });
  ctx.fillStyle = 'rgba(255,59,78,.9)';
  [g.tw(-13, -46), g.tw(29, -46)].forEach(p => { ctx.beginPath(); ctx.arc(p.x, p.y, 6.5, 0, 7); ctx.fill(); });
  // brazos
  chalk(3.2);
  const sh1 = g.tw(24, -40), sh2 = g.tw(-24, -40);
  hands.forEach((h, i) => {
    const sh = i ? sh2 : sh1;
    const mx = (sh.x + h.x) / 2 + (i ? -6 : 6), my = (sh.y + h.y) / 2 + 8;
    ctx.beginPath(); ctx.moveTo(sh.x, sh.y); ctx.quadraticCurveTo(mx + jit(i) * 1.2, my, h.x + jit(i + 3) * .8, h.y);
    ctx.stroke();
  });
  return g;
}

function frame(now) {
  const t = ((now - t0) / 1000) % LOOP;
  fr = Math.floor(now / 125); // ~8 fps para sensación de dibujo a mano
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  drawGround();

  const walkEnd = 5, stopX = 300, hx = 385;
  const x = lerp(-60, stopX, seg(t, 0, walkEnd));
  const moving = t < walkEnd;
  const walkP = moving ? t * 7.5 : 0;
  const bend = t < 6.8 ? ease(seg(t, 5.8, 6.8)) : 1 - ease(seg(t, 6.8, 7.5));
  const g = charGeom(x, bend, walkP);

  const sh1 = g.tw(24, -40), sh2 = g.tw(-24, -40);
  const restH1 = { x: sh1.x + 10 + (moving ? Math.sin(walkP) * 12 : 0), y: sh1.y + 34 };
  const restH2 = { x: sh2.x - 10 - (moving ? Math.sin(walkP) * 12 : 0), y: sh2.y + 34 };
  const groundHand = { x: hx, y: GY - 14 };
  let h1 = { x: lerp(restH1.x, groundHand.x, bend), y: lerp(restH1.y, groundHand.y, bend) };
  let h2 = { x: lerp(restH2.x, groundHand.x - 12, bend), y: lerp(restH2.y, groundHand.y, bend) };

  // corazón
  let hc = { x: hx, y: GY - 16 }, hs = 13;
  if (t >= 6.8 && t < 7.5) { hc = { x: h1.x, y: h1.y - 8 }; }
  const standH1 = { x: x + 24 + 10, y: GY - 36 - 40 + 34 };
  if (t >= 7.5) {
    const e = ease(seg(t, 7.5, 9.3));
    const tx = 540, ty = 190, ts = 140;
    hs = lerp(13, ts, e);
    hc = { x: lerp(standH1.x, tx, e), y: lerp(standH1.y - 8, ty, e) };
    if (t > 11.5) hs *= 1 + Math.sin((t - 11.5) * 5) * .025;
    h1 = { x: hc.x - hs * .85, y: hc.y + hs * .25 };
    h2 = { x: hc.x - hs * .7, y: hc.y + hs * .75 };
  }

  const poss = t < 6.8 ? 'ground' : 'held';
  if (t < 6.8) drawHeart(hc.x, hc.y, hs);
  const gg = drawChar(x, bend, walkP, [h1, h2], moving);
  if (t >= 6.8) drawHeart(hc.x, hc.y, hs);

  // signo de exclamación al ver el corazón
  if (t >= 5.05 && t < 5.9) {
    chalk(3.5);
    wline(x + 40, GY - 150, x + 40, GY - 128, .8, 70);
    ctx.beginPath(); ctx.arc(x + 40 + jit(9) * .6, GY - 116, 1.6, 0, 7); ctx.stroke();
  }

  // texto dentro del corazón
  if (t >= 9.3) {
    const k = seg(t, 9.3, 11);
    const l1 = 'TE QUIERO', l2 = 'MUCHO';
    const total = l1.length + l2.length;
    const n = Math.floor(k * total + (k > 0 ? 1 : 0));
    const fs = hs * .34;
    ctx.save();
    ctx.font = `700 ${fs}px ${FONT}`;
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.translate(hc.x + jit(31) * .9, hc.y - hs * .1 + jit(32) * .9);
    ctx.rotate(-.05 + jit(33) * .008);
    ctx.fillText(l1.slice(0, Math.min(n, l1.length)), 0, -fs * .5);
    if (n > l1.length) ctx.fillText(l2.slice(0, n - l1.length), 0, fs * .6);
    ctx.restore();
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
