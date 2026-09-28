/* Fiqh al-Salat — the positions of the prayer, drawn as one jointed pictogram.
   Each pose is a set of joints on a 120 × 100 canvas: ground at y = 92, the figure
   faces the qiblah on the right (mirrored in Arabic). Proportions follow a real body:
   torso 24, upper arm 13, forearm 12, hand 7, thigh 20, shin 20, foot 9 (head r 6.2).
   Poses are written as joint positions but animated through bone angles, so limbs
   keep their length while the figure moves from one position to the next. */
(function () {
  'use strict';

  var W = 120, GROUND = 92, HEAD_R = 6.2, LIMB_R = 2.6;

  // H hip · S shoulder · N head · E elbow · W wrist · F fingertips · K knee · A ankle · B ball of foot · T toes
  var STANDING_LEGS = { K: [45, 67.5], A: [45, 87], B: [53, 89.5], T: [56, 89.5] };
  var KNEELING_LEGS = { K: [72, 88.5], A: [53.5, 81], B: [55.5, 89.5], T: [59, 89.5] };
  function pose(base, extra) {
    var o = {}, k;
    for (k in base) o[k] = base[k];
    for (k in extra) o[k] = extra[k];
    return o;
  }

  var POSES = {
    // hands raised to the ears, palms towards the qiblah (drawn just in front of the face)
    takbir: pose(STANDING_LEGS, { H: [45, 47.5], S: [45, 23.5], N: [45.6, 13.5], E: [53.5, 33], W: [54.5, 21.5], F: [54.8, 14.3] }),
    // right hand over left on the body, gaze lowered to the place of prostration
    qiyam: pose(STANDING_LEGS, { H: [45, 47.5], S: [45, 23.5], N: [46.2, 13.6], E: [43.6, 37], W: [50.5, 39.2], F: [53.6, 39.4] }),
    // back level, head in line with it, hands grasping the knees
    ruku: pose(STANDING_LEGS, { K: [44, 67.5], H: [41.5, 47.5], S: [65.5, 47.5], N: [75.4, 48.2], E: [55.4, 55.7], W: [46.8, 62.8], F: [45.8, 69.6] }),
    // upright again, arms at the sides
    itidal: pose(STANDING_LEGS, { H: [45, 47.5], S: [45, 23.5], N: [45.5, 13.5], E: [46.2, 37], W: [48.6, 48.8], F: [49.6, 55.6] }),
    // the way down: knees reach the ground first (used only in the animation)
    kneel: pose(KNEELING_LEGS, { H: [70.5, 68.5], S: [73, 44.6], N: [74.2, 34.7], E: [74.5, 58.4], W: [77, 70], F: [78, 76.8] }),
    // seven bones on the ground: forehead & nose, palms, knees, toes — elbows raised, hips high
    sujud: pose(KNEELING_LEGS, { H: [70.5, 68.5], S: [93, 76.5], N: [96.8, 85], E: [88.3, 82.2], W: [92.2, 89.5], F: [99.2, 89.5] }),
    // iftirāsh: sitting on the left foot, right foot upright with its toes bent towards the qiblah
    jalsa: { K: [72, 88.5], A: [53, 81.5], B: [54.8, 89.5], T: [58.3, 89.5], H: [54.5, 78], S: [55.6, 54], N: [56.4, 44.2], E: [57.6, 67.5], W: [64, 79.3], F: [70.4, 83.2] }
  };
  POSES.tashahhud = pose(POSES.jalsa, { F: [68.6, 82.3], finger: 1 });
  POSES.salam = pose(POSES.jalsa, { turn: 1 });

  var PARENT = { S: 'H', N: 'S', E: 'S', W: 'E', F: 'W', K: 'H', A: 'K', B: 'A', T: 'B' };
  var ORDER = ['S', 'N', 'E', 'W', 'F', 'K', 'A', 'B', 'T'];

  function toBones(p) {
    var b = { H: p.H.slice(), finger: p.finger || 0, turn: p.turn || 0, bones: {} };
    ORDER.forEach(function (k) {
      var a = p[PARENT[k]], c = p[k];
      b.bones[k] = [Math.atan2(c[1] - a[1], c[0] - a[0]), Math.hypot(c[0] - a[0], c[1] - a[1])];
    });
    return b;
  }
  function toPoints(b) {
    var p = { H: b.H.slice(), finger: b.finger, turn: b.turn };
    ORDER.forEach(function (k) {
      var a = p[PARENT[k]], bone = b.bones[k];
      p[k] = [a[0] + Math.cos(bone[0]) * bone[1], a[1] + Math.sin(bone[0]) * bone[1]];
    });
    // nothing sinks into the ground while moving between positions
    ORDER.forEach(function (k) { if (k !== 'N') p[k][1] = Math.min(p[k][1], GROUND - LIMB_R); });
    return p;
  }
  var BONES = {};
  Object.keys(POSES).forEach(function (k) { BONES[k] = toBones(POSES[k]); });

  function lerp(a, b, t) { return a + (b - a) * t; }
  function lerpAngle(a, b, t) {
    var d = b - a;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return a + d * t;
  }
  function blend(a, b, t) {
    var o = { H: [lerp(a.H[0], b.H[0], t), lerp(a.H[1], b.H[1], t)], finger: lerp(a.finger, b.finger, t), turn: lerp(a.turn, b.turn, t), bones: {} };
    ORDER.forEach(function (k) {
      o.bones[k] = [lerpAngle(a.bones[k][0], b.bones[k][0], t), lerp(a.bones[k][1], b.bones[k][1], t)];
    });
    return o;
  }

  function f(n) { return Math.round(n * 100) / 100; }
  function pt(p, k, dx) { return f(p[k][0] + dx) + ' ' + f(p[k][1]); }
  function path(p, keys, dx) { return 'M' + keys.map(function (k) { return pt(p, k, dx); }).join(' L'); }

  // The thigh gets a paper-coloured outline only when the leg is folded, so a kneeling
  // or sitting leg reads as thigh over shin, while a straight leg stays one clean line.
  function foldAmount(p) {
    var a = Math.atan2(p.H[1] - p.K[1], p.H[0] - p.K[0]), b = Math.atan2(p.A[1] - p.K[1], p.A[0] - p.K[0]);
    var d = Math.abs(a - b); if (d > Math.PI) d = 2 * Math.PI - d;
    return Math.max(0, Math.min(1, (2.1 - d) / 1.1));
  }

  /* Draw a pose. opts: { dx: horizontal shift, rtl: mirror to face left, mat: draw the prayer mat } */
  function draw(p, opts) {
    opts = opts || {};
    var dx = opts.dx || 0;
    var hx = p.S[0] + (p.N[0] - p.S[0]) * 1.1 + dx, hy = Math.min(p.S[1] + (p.N[1] - p.S[1]) * 1.1, GROUND - HEAD_R + 0.2);
    var g = '';
    if (opts.mat !== false) g += '<rect class="pf-mat" x="16" y="' + GROUND + '" width="88" height="3.2" rx="1.6"/>';
    g += '<path class="pf-limb" d="' + path(p, ['K', 'A', 'B', 'T'], dx) + '"/>';
    var fold = foldAmount(p);
    if (fold > 0.02) g += '<path class="pf-halo" style="opacity:' + f(fold) + '" d="' + path(p, ['H', 'K'], dx) + '"/>';
    g += '<path class="pf-limb" d="' + path(p, ['H', 'K'], dx) + '"/>';
    g += '<path class="pf-torso" d="' + path(p, ['H', 'S'], dx) + '"/>';
    g += '<circle class="pf-head" cx="' + f(hx) + '" cy="' + f(hy) + '" r="' + HEAD_R + '"/>';
    g += '<path class="pf-halo" d="' + path(p, ['S', 'E', 'W', 'F'], dx) + '"/>';
    g += '<path class="pf-limb pf-arm" d="' + path(p, ['S', 'E', 'W', 'F'], dx) + '"/>';
    if (p.finger > 0.02) {
      var fx = p.F[0] + dx, fy = p.F[1];
      g += '<path class="pf-finger" style="opacity:' + f(p.finger) + '" d="M' + f(fx) + ' ' + f(fy) + ' l5.8 -2.6"/>';
    }
    if (p.turn > 0.02) {
      g += '<g class="pf-turn" style="opacity:' + f(p.turn) + '">' +
        '<path d="M' + f(hx + 9) + ' ' + f(hy - 6) + ' a 10.5 10.5 0 0 1 0 12"/>' +
        '<path d="M' + f(hx - 9) + ' ' + f(hy - 6) + ' a 10.5 10.5 0 0 0 0 12"/></g>';
    }
    return opts.rtl ? '<g transform="matrix(-1 0 0 1 ' + W + ' 0)">' + g + '</g>' : g;
  }

  function bbox(p) {
    var x0 = Infinity, x1 = -Infinity;
    ['H', 'S', 'N', 'E', 'W', 'F', 'K', 'A', 'B', 'T'].forEach(function (k) { x0 = Math.min(x0, p[k][0]); x1 = Math.max(x1, p[k][0]); });
    return [x0 - 4, x1 + 4];
  }

  /* A single pose, centred on the canvas */
  function still(name, rtl) {
    var p = toPoints(BONES[name]), b = bbox(p);
    return draw(p, { dx: W / 2 - (b[0] + b[1]) / 2, rtl: rtl });
  }

  /* One rakʿah in motion. seq: [{ pose, step, hold, move }] */
  function Player(svg, seq, onStep) {
    var dx = -10.5, i = 0, from = BONES[seq[0].pose], to = from, phase = 'hold', t0 = 0, raf = 0;
    var self = { playing: false, rtl: false };
    function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
    function paint(b) { svg.innerHTML = draw(toPoints(b), { dx: dx, rtl: self.rtl }); }
    function frame(ts) {
      if (!self.playing) return;
      if (!t0) t0 = ts;
      var el = ts - t0, cur = seq[i];
      if (phase === 'move') {
        var d = cur.move || 760, t = Math.min(1, el / d);
        paint(blend(from, to, ease(t)));
        if (t >= 1) { phase = 'hold'; t0 = ts; if (onStep) onStep(cur.step, cur.pose, i); }
      } else if (el >= (cur.hold || 0)) {
        i = (i + 1) % seq.length;
        from = to; to = BONES[seq[i].pose]; phase = 'move'; t0 = ts;
        if (i === 0) { // after the taslīm, fade out and begin again from the takbīr
          from = to; phase = 'hold'; svg.style.opacity = '0';
          setTimeout(function () { paint(to); svg.style.opacity = ''; if (onStep) onStep(seq[0].step, seq[0].pose, 0); }, 320);
        }
      }
      raf = requestAnimationFrame(frame);
    }
    self.play = function () { if (self.playing) return; self.playing = true; t0 = 0; raf = requestAnimationFrame(frame); };
    self.pause = function () { self.playing = false; cancelAnimationFrame(raf); };
    self.show = function (k) { // jump straight to a step
      self.pause();
      for (var j = 0; j < seq.length; j++) if (seq[j].step === k) { i = j; break; }
      from = to = BONES[seq[i].pose]; phase = 'hold'; paint(to);
      if (onStep) onStep(seq[i].step, seq[i].pose, i);
    };
    self.redraw = function () { paint(phase === 'hold' ? to : from); };
    paint(from);
    return self;
  }

  window.PrayerFigure = { POSES: POSES, still: still, Player: Player };
})();
