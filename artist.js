// artist.js — hunermend rûpel
let SONGS = [];
let ARTIST = "";
let BASE = [];

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

function escapeHtml(str){
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getArtistParam(){
  const p = new URLSearchParams(location.search);
  return p.get("name") || "";
}

function sameArtist(song){
  const wanted = norm(ARTIST);
  return artistArr(song.artist).some(a => norm(a) === wanted);
}

function normalSort(a, b){
  // kaynak sırası: önce volume/pdf, sonra sayfa
  const va = String(a.volume || "");
  const vb = String(b.volume || "");
  if(va !== vb) return va.localeCompare(vb);
  const pa = Number(a.page_original) || 0;
  const pb = Number(b.page_original) || 0;
  if(pa !== pb) return pa - pb;
  return String(a.song||"").localeCompare(String(b.song||""));
}

function render(){
  const q = norm($("#q")?.value || "");
  const mode = $("#sort")?.value || "normal";
  const list = $("#list");
  const countEl = $("#count");
  const titleEl = $("#artistName");

  if(titleEl) titleEl.textContent = ARTIST || "Hunermend";

  let items = BASE;
  if(q){
    items = items.filter(s => norm(`${s.song} ${artistText(s.artist)}`).includes(q));
  }

  if(mode === "az"){
    items = [...items].sort((a,b) => String(a.song||"").localeCompare(String(b.song||""), "ku"));
  }else{
    items = [...items].sort(normalSort);
  }

  if(countEl) countEl.textContent = items.length.toString();

  if(!items.length){
    list.innerHTML = `<div class="empty">Tınne</div>`;
    return;
  }

  list.innerHTML = items.map(s => `
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

async function init(){
  ARTIST = getArtistParam();
  const res = await fetch("assets/songs.json", { cache: "no-store" });
  SONGS = await res.json();

  BASE = ARTIST ? SONGS.filter(sameArtist) : SONGS;
  render();

  $("#q")?.addEventListener("input", render);
  $("#sort")?.addEventListener("change", render);
  $("#clear")?.addEventListener("click", () => {
    $("#q").value = "";
    $("#q").focus();
    render();
  });
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
