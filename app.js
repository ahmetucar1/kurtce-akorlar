// app.js — anasayfa
let SONGS = [];
let homeSample = [];

function makeId(s){ return `${s.pdf}|${s.page_original}`; }
function openLink(s){ return `song.html?id=${encodeURIComponent(makeId(s))}`; }

function artistArr(a){
  if(Array.isArray(a)) return a.filter(Boolean).map(String);
  if(a == null) return [];
  return [String(a)].filter(Boolean);
}
function artistText(a){
  return artistArr(a).join(" ");
}
function artistLinks(a){
  const arr = artistArr(a);
  if(!arr.length) return "—";
  return arr.map(name => {
    const href = `artist.html?name=${encodeURIComponent(name)}`;
    return `<a class="artistLink" href="${href}">${escapeHtml(name)}</a>`;
  }).join(" · ");
}

function renderStats(){
  const songsN = SONGS.length;
  const artists = new Set(SONGS.flatMap(s => artistArr(s.artist)).map(a => norm(a))).size;
  const elSongs = $("#statSongs");
  const elArtists = $("#statArtists");
  if(elSongs) elSongs.textContent = songsN.toString();
  if(elArtists) elArtists.textContent = artists.toString();
}

function renderList(){
  const listEl = $("#list");
  const countEl = $("#count");
  if(!listEl) return;

  const q = norm($("#q")?.value || "");
  let items = [];

  if(!q){
    items = homeSample;
  }else{
    items = SONGS.filter(s => norm(`${s.song} ${artistText(s.artist)}`).includes(q));
    // küçük bir limit: performans + sadelik
    items = items.slice(0, 40);
  }

  if(countEl) countEl.textContent = items.length.toString();

  if(!items.length){
    listEl.innerHTML = `<div class="empty">Tınne</div>`;
    return;
  }

  listEl.innerHTML = items.map(s => `
    <div class="item">
      <div class="item__left">
        <div class="item__title">${escapeHtml(s.song)}</div>
        <div class="item__sub">${artistLinks(s.artist)}</div>
      </div>
      <div class="badges">
        <a class="open" href="${openLink(s)}">Veke</a>
      </div>
    </div>
  `).join("");

  window.__revealList && window.__revealList(listEl);
}

function renderDiscover(){
  const el = $("#discover");
  if(!el) return;
  const picks = pickRandom(SONGS, 10);
  el.innerHTML = picks.map(s => `
    <a class="pick" href="${openLink(s)}">
      <div class="pick__title">${escapeHtml(s.song)}</div>
      <div class="pick__sub">${artistLinks(s.artist)}</div>
    </a>
  `).join("");
}

function escapeHtml(str){
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

async function init(){
  const res = await fetch("assets/songs.json", { cache: "no-store" });
  SONGS = await res.json();

  renderStats();

  // her girişte farklı 10 şarkı
  homeSample = pickRandom(SONGS, 7);
  renderDiscover();
  renderList();

  $("#q")?.addEventListener("input", renderList);

  $("#clear")?.addEventListener("click", () => {
    $("#q").value = "";
    homeSample = pickRandom(SONGS, 10);
    renderDiscover();
    renderList();
    $("#q").focus();
  });

  const sd = $("#shuffleDiscover"); if(sd) sd.setAttribute("data-wiggle","1");
  sd?.addEventListener("click", () => renderDiscover());

  // topbardaki "Rastgele"
  

  // sağdaki küçük rastgele kutusu
  

  $("#scrollTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

init().catch(err => {
  console.error(err);
  const list = $("#list");
  if(list) list.innerHTML = `<div class="empty">Me gu xwar</div>`;
});


// --- Live UI helpers (cursor glow, page transitions, reveals) ---
(function(){
  try{
    const glow = document.createElement("div");
    glow.id = "cursorGlow";
    document.body.appendChild(glow);

    let tx = -9999, ty = -9999, cx = -9999, cy = -9999;
    const ease = 0.18;

    window.addEventListener("pointermove", (e) => {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive:true });

    function tick(){
      cx += (tx - cx) * ease;
      cy += (ty - cy) * ease;
      document.documentElement.style.setProperty("--cgx", cx + "px");
      document.documentElement.style.setProperty("--cgy", cy + "px");
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }catch(e){}

  function ensureFade(){
    let el = document.getElementById("pageFade");
    if(!el){
      el = document.createElement("div");
      el.id = "pageFade";
      document.body.appendChild(el);
    }
    return el;
  }
  const fade = ensureFade();

  document.addEventListener("click", (ev) => {
    const a = ev.target && ev.target.closest ? ev.target.closest("a[href]") : null;
    if(!a) return;
    const href = a.getAttribute("href") || "";
    if(href.startsWith("#") || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
    if(a.target === "_blank" || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;

    ev.preventDefault();
    fade.classList.add("on");
    setTimeout(() => { window.location.href = href; }, 170);
  }, { capture:true });

  window.__revealList = function(container){
    try{
      const root = typeof container === "string" ? document.querySelector(container) : container;
      if(!root) return;
      const items = root.querySelectorAll(".item");
      items.forEach((el, i) => {
        el.classList.remove("reveal");
        el.style.setProperty("--i", i);
        void el.offsetWidth;
        el.classList.add("reveal");
      });
    }catch(e){}
  };

  document.addEventListener("click", (ev) => {
    const b = ev.target && ev.target.closest ? ev.target.closest("[data-wiggle]") : null;
    if(!b) return;
    b.classList.remove("wiggle");
    void b.offsetWidth;
    b.classList.add("wiggle");
  });
})();
