// app.js — anasayfa
let SONGS = [];
let homeSample = [];
let artistSample = [];
let selectedArtist = "";

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
  const countEl = $("#count");
  if(!listEl) return;

  const q = norm($("#q")?.value || "");
  let items = [];

  if(!q){
    if(selectedArtist){
      const pool = SONGS.filter(s => norm(s.artist) === norm(selectedArtist));
      items = pickRandom(pool, 10);
    }else{
      items = homeSample;
    }
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
        <div class="item__sub">${escapeHtml(s.artist)}</div>
      </div>
      <div class="badges">
        <a class="open" href="${openLink(s)}">Veke</a>
      </div>
    </div>
  `).join("");
}

function uniqueArtists(){
  const seen = new Set();
  const out = [];
  for(const s of SONGS){
    const k = norm(s.artist);
    if(!k || seen.has(k)) continue;
    seen.add(k);
    out.push(s.artist);
  }
  return out;
}

function renderArtistSuggestions(){
  const wrap = $("#artistChips");
  if(!wrap) return;

  if(!artistSample.length) artistSample = pickRandom(uniqueArtists(), 6);

  const chips = [];
  if(selectedArtist){
    chips.push({ label: "Hemû", value: "" });
  }
  for(const a of artistSample){
    chips.push({ label: a, value: a });
  }

  wrap.innerHTML = chips.map(c => {
    const active = selectedArtist && norm(selectedArtist) === norm(c.value);
    return `<button class="chip ${active ? "is-active" : ""}" type="button" data-artist="${escapeHtml(c.value)}">${escapeHtml(c.label)}</button>`;
  }).join(" ");

  wrap.querySelectorAll("button[data-artist]").forEach(btn => {
    btn.addEventListener("click", () => {
      const val = btn.getAttribute("data-artist") || "";
      selectedArtist = val;
      const title = $("#featuredTitle");
      if(title){
        title.textContent = selectedArtist ? `Yên Berçav — ${selectedArtist}` : "Yên Berçav";
      }
      // arama aktifse sanatçı tıklayınca aramayı temizleyelim
      if($("#q")) $("#q").value = "";
      renderArtistSuggestions();
      renderList();
    });
  });
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
  homeSample = pickRandom(SONGS, 10);
  artistSample = pickRandom(uniqueArtists(), 6);
  renderArtistSuggestions();
  renderDiscover();
  renderList();

  $("#q")?.addEventListener("input", renderList);

  $("#clear")?.addEventListener("click", () => {
    $("#q").value = "";
    selectedArtist = "";
    homeSample = pickRandom(SONGS, 10);
    artistSample = pickRandom(uniqueArtists(), 6);
    const title = $("#featuredTitle");
    if(title) title.textContent = "Yên Berçav";
    renderDiscover();
    renderArtistSuggestions();
    renderList();
    $("#q").focus();
  });

  $("#artistsShuffle")?.addEventListener("click", () => {
    artistSample = pickRandom(uniqueArtists(), 6);
    renderArtistSuggestions();
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
