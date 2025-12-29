// app.js — anasayfa
let SONGS = [];
let homeSample = [];

function makeId(s){ return `${s.pdf}|${s.page_original}`; }
function openLink(s){ return `song.html?id=${encodeURIComponent(makeId(s))}`; }

function renderStats(){
  const songsN = SONGS.length;
  const artists = new Set(SONGS.map(s => norm(s.artist))).size;
  const elSongs = $("#statSongs");
  const elArtists = $("#statArtists");
  if(elSongs) elSongs.textContent = songsN.toString();
  if(elArtists) elArtists.textContent = artists.toString();
}

function renderList(){
  const listEl = $("#list");
  const count = $("#count");
  if(!listEl) return;

  const q = norm($("#q")?.value || "");
  let items = [];

  if(!q){
    items = homeSample;
  }else{
    items = SONGS.filter(s => norm(`${s.song} ${s.artist}`).includes(q));
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
        <div class="item__sub">${escapeHtml(s.artist)} • Sayfa ${escapeHtml(String(s.page_combined ?? s.page_original ?? ""))}</div>
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
      <div class="pick__sub">${escapeHtml(s.artist)}</div>
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
  if(list) list.innerHTML = `<div class="empty">Veri yüklenemedi (assets/songs.json bulunamadı olabilir).</div>`;
});
