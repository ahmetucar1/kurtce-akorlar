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

  $("#shuffleDiscover")?.addEventListener("click", () => renderDiscover());

  // topbardaki "Rastgele"
  

  // sağdaki küçük rastgele kutusu
  

  $("#scrollTop")?.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

init().catch(err => {
  console.error(err);
  const list = $("#list");
  if(list) list.innerHTML = `<div class="empty">Me gu xwar</div>`;
});

// LIVE_BG_START
(function initLiveBackground(){
  // prevent duplicates (across pages)
  if (document.getElementById("bgNotes")) return;

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

  const notes = ["♪","♫","𝄞","♩","♬","♭","♯"];
  const count = Math.min(18, Math.max(12, Math.floor(window.innerWidth / 90)));

  for (let i = 0; i < count; i++){
    const n = document.createElement("div");
    n.className = "bgNote";
    n.textContent = notes[Math.floor(Math.random()*notes.length)];

    const x = Math.random()*100;              // vw
    const drift = (Math.random()*10 - 5);     // vw
    const dur = 10 + Math.random()*10;        // s
    const delay = -Math.random()*dur;         // start at random phase
    const r = (Math.random()*50 - 25);        // deg
    const size = 14 + Math.random()*16;       // px

    n.style.setProperty("--x", `${x}vw`);
    n.style.setProperty("--drift", `${drift}vw`);
    n.style.setProperty("--dur", `${dur}s`);
    n.style.setProperty("--r", `${r}deg`);
    n.style.animationDelay = `${delay}s`;
    n.style.fontSize = `${size}px`;

    wrap.appendChild(n);
  }
})();
// LIVE_BG_END
