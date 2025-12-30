// common.js — küçük yardımcılar + tema
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

const norm = (s) => (s || "")
  .toString()
  .toLowerCase()
  .trim()
  .normalize("NFD")
  .replace(/\p{Diacritic}/gu, "")
  .replace(/ı/g, "i");

function pickRandom(arr, n){
  const copy = [...(arr || [])];
  // Fisher–Yates shuffle (in-place)
  for(let i = copy.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, n|0));
}

function applyTheme(t){
  const theme = (t === "light") ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", theme);
  try{ localStorage.setItem("theme", theme); }catch(e){}
}

(function initTheme(){
  let t = "light";
  try{ t = localStorage.getItem("theme") || "light"; }catch(e){}
  applyTheme(t);

  const btn = $("#themeToggle");
  if(btn){
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  }
})();

(function initLiveBackground(){
  // İki kere eklenmesin
  if (document.getElementById("bgNotes")) return;

  // Grain + vignette + notes container
  const grain = document.createElement("div");
  grain.className = "bgGrain";
  document.body.appendChild(grain);

  const vignette = document.createElement("div");
  vignette.className = "bgVignette";
  document.body.appendChild(vignette);

  const wrap = document.createElement("div");
  wrap.className = "bgNotes";
  wrap.id = "bgNotes";
  document.body.appendChild(wrap);

  // --- PRO scene (ud + davul + hareketli tel) ---
  function ensureProScene(){
    if (document.getElementById("bgScene")) return;

    const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const scene = document.createElement("div");
    scene.className = "bgScene";
    scene.id = "bgScene";

    const kilim = document.createElement("div");
    kilim.className = "bgKilim";
    scene.appendChild(kilim);

    const ud = document.createElement("img");
    ud.className = "bgInstrument bgInstrument--ud";
    ud.alt = "";
    ud.decoding = "async";
    ud.src = "ud.png";
    ud.onerror = () => ud.remove();
    scene.appendChild(ud);

    const davul = document.createElement("img");
    davul.className = "bgInstrument bgInstrument--davul";
    davul.alt = "";
    davul.decoding = "async";
    davul.src = "davul.png";
    davul.onerror = () => davul.remove();
    scene.appendChild(davul);

    const canvas = document.createElement("canvas");
    canvas.id = "bgCanvas";
    scene.appendChild(canvas);

    document.body.appendChild(scene);

    if (prefersReduced) return; // erişilebilirlik

    const ctx = canvas.getContext("2d", { alpha: true });

    let w = 0, h = 0, dpr = 1;
    let raf = 0;
    let t = 0;
    let mx = 0.5, my = 0.45;

    const strings = [];
    const dust = [];

    const rand = (a,b) => a + Math.random()*(b-a);

    function resize(){
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
      w = Math.floor(window.innerWidth);
      h = Math.floor(window.innerHeight);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr,0,0,dpr,0,0);

      strings.length = 0;
      const sCount = Math.max(8, Math.min(14, Math.round(w/170)));
      for(let i=0;i<sCount;i++){
        strings.push({
          y: h*0.16 + i*(h*0.055) + rand(-12,12),
          amp: rand(14, 28),
          freq: rand(0.006, 0.012),
          spd: rand(0.7, 1.25),
          ph: rand(0, Math.PI*2),
          a: rand(0.12, 0.22)
        });
      }

      dust.length = 0;
      const pCount = Math.max(50, Math.min(110, Math.round((w*h)/36000)));
      for(let i=0;i<pCount;i++){
        dust.push({ x: rand(0,w), y: rand(0,h), r: rand(0.7, 2.2), vx: rand(-0.08,0.08), vy: rand(0.03,0.18), a: rand(0.05,0.14) });
      }
    }

    function draw(){
      t += 0.016;
      ctx.clearRect(0,0,w,h);

      // soft roj glow
      const gr = ctx.createRadialGradient(w*0.22, h*0.10, 0, w*0.22, h*0.10, Math.min(w,h)*0.60);
      gr.addColorStop(0, "rgba(201,123,32,0.22)");
      gr.addColorStop(1, "rgba(201,123,32,0)");
      ctx.fillStyle = gr;
      ctx.fillRect(0,0,w,h);

      // tel çizgileri
      ctx.lineWidth = 1;
      for(const s of strings){
        const y0 = s.y + (my-0.5)*24;
        ctx.beginPath();
        const steps = 140;
        for(let i=0;i<=steps;i++){
          const x = (i/steps)*w;
          const wave = Math.sin(x*s.freq + (t*s.spd) + s.ph) * s.amp;
          const sway = (mx-0.5)*22;
          const yy = y0 + wave + sway*(i/steps - 0.5);
          if(i===0) ctx.moveTo(x, yy);
          else ctx.lineTo(x, yy);
        }
        ctx.strokeStyle = `rgba(18,21,33,${s.a})`;
        ctx.stroke();
      }

      // toz
      for(const p of dust){
        p.x += p.vx;
        p.y += p.vy;
        if(p.y > h + 24){ p.y = -24; p.x = rand(0,w); }
        if(p.x < -24) p.x = w+24;
        if(p.x > w+24) p.x = -24;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
        ctx.fillStyle = `rgba(18,21,33,${p.a})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    }

    function onMove(e){
      const pt = e.touches ? e.touches[0] : e;
      mx = (pt.clientX || 0) / Math.max(1, w);
      my = (pt.clientY || 0) / Math.max(1, h);
      mx = Math.max(0, Math.min(1, mx));
      my = Math.max(0, Math.min(1, my));
      scene.style.setProperty("--px", (mx-0.5).toFixed(3));
      scene.style.setProperty("--py", (my-0.5).toFixed(3));
    }

    // parallax via css vars
    const style = document.createElement("style");
    style.textContent = `
      #bgScene .bgInstrument--ud{
        transform: translate3d(calc(var(--px,0)*22px), calc(var(--py,0)*16px), 0) rotate(-8deg);
      }
      #bgScene .bgInstrument--davul{
        transform: translate3d(calc(var(--px,0)*-18px), calc(var(--py,0)*-14px), 0) rotate(8deg);
      }
    `;
    document.head.appendChild(style);

    window.addEventListener("resize", resize, { passive:true });
    window.addEventListener("mousemove", onMove, { passive:true });
    window.addEventListener("touchmove", onMove, { passive:true });

    document.addEventListener("visibilitychange", () => {
      if(document.hidden){
        cancelAnimationFrame(raf);
        raf = 0;
      }else if(!raf){
        raf = requestAnimationFrame(draw);
      }
    });

    resize();
    raf = requestAnimationFrame(draw);
  }

  ensureProScene();

  // Nota seti: hem evrensel hem “müzik” hissi
  const notes = ["♪","♫","𝄞","♩","♬","♭","♯"];
  const count = Math.min(18, Math.max(12, Math.floor(window.innerWidth / 90)));

  for (let i=0; i<count; i++){
    const n = document.createElement("div");
    n.className = "bgNote";
    n.textContent = notes[Math.floor(Math.random()*notes.length)];

    // Konum ve davranış
    const x = Math.random()*100;                   // vw
    const drift = (Math.random()*10 - 5);          // vw
    const dur = 10 + Math.random()*10;             // s
    const delay = -Math.random()*dur;              // negatif = hemen farklı fazlarda başlar
    const r = (Math.random()*50 - 25);             // deg
    const size = 14 + Math.random()*16;            // px

    n.style.setProperty("--x", `${x}vw`);
    n.style.setProperty("--drift", `${drift}vw`);
    n.style.setProperty("--dur", `${dur}s`);
    n.style.setProperty("--r", `${r}deg`);
    n.style.animationDelay = `${delay}s`;
    n.style.fontSize = `${size}px`;

    // Renk hissi: temayı bozmadan ufak vurgu
    // (CSS renk vermiyoruz; mevcut text renginin gölgesini kullanıyor)
    wrap.appendChild(n);
  }
})();
