// all.js — tüm şarkılar sayfası
let SONGS = [];
let artistSample = [];
let selectedArtist = "";
let sortMode = "normal"; // 'normal' | 'az'

function makeId(s){ return `${s.pdf}|${s.page_original}`; }
function openLink(s){ return `song.html?id=${encodeURIComponent(makeId(s))}`; }

function escapeHtml(str){
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
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
      if($("#q")) $("#q").value = ""; // aramayı temizle
      renderArtistSuggestions();
      render();
    });
  });
}

function bindSort(){
  const buttons = Array.from(document.querySelectorAll(".seg__btn[data-sort]"));
  if(!buttons.length) return;

  function setActive(){
    for(const b of buttons){
      const on = (b.getAttribute("data-sort") === sortMode);
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    }
  }

  buttons.forEach(b => {
    b.addEventListener("click", () => {
      sortMode = b.getAttribute("data-sort") || "normal";
      setActive();
      render();
    });
  });

  setActive();
}

function render(){
  const qv = norm($("#q")?.value || "");
  const list = $("#list");
  if(!list) return;

  let items = SONGS;
  if(qv){
    items = SONGS.filter(s => norm(`${s.song} ${s.artist}`).includes(qv));
  }else if(selectedArtist){
    items = SONGS.filter(s => norm(s.artist) === norm(selectedArtist));
  }

  if(sortMode === "az"){
    items = [...items].sort((a,b) => norm(a.song).localeCompare(norm(b.song)));
  }

  const countEl = $("#count");
  if(countEl) countEl.textContent = items.length.toString();

  if(!items.length){
    list.innerHTML = `<div class="empty">Tınne</div>`;
    return;
  }

  list.innerHTML = items.map(s => `
    <div class="item">
      <div class="item__left">
        <div class="item__title">${escapeHtml(s.song)}</div>
        <div class="item__sub">${escapeHtml(s.artist)} </div>
      </div>
      <div class="badges">
        <a class="open" href="${openLink(s)}">Veke</a>
      </div>
    </div>
  `).join("");
}

async function init(){
  const res = await fetch("assets/songs.json", { cache: "no-store" });
  SONGS = await res.json();
  artistSample = pickRandom(uniqueArtists(), 6);
  renderArtistSuggestions();
  bindSort();
  render();

  $("#q")?.addEventListener("input", () => {
    selectedArtist = "";
    renderArtistSuggestions();
    render();
  });

  $("#clear")?.addEventListener("click", () => {
    $("#q").value="";
    selectedArtist = "";
    $("#q").focus();
    renderArtistSuggestions();
    render();
  });

  $("#artistsShuffle")?.addEventListener("click", () => {
    artistSample = pickRandom(uniqueArtists(), 6);
    renderArtistSuggestions();
  });
}

init().catch(err => console.error(err));
