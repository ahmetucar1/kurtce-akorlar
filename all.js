// all.js — tüm şarkılar sayfası
let SONGS = [];

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

function render(){
  const qv = norm($("#q")?.value || "");
  const list = $("#list");
  const count = $("#count");
  if(!list) return;

  let items = SONGS;
  if(qv){
    items = SONGS.filter(s => norm(`${s.song} ${s.artist}`).includes(qv));
  }

  if(count) count.textContent = items.length.toString();

  if(!items.length){
    list.innerHTML = `<div class="empty">Sonuç yok.</div>`;
    return;
  }

  list.innerHTML = items.map(s => `
    <div class="item">
      <div class="item__left">
        <div class="item__title">${escapeHtml(s.song)}</div>
        <div class="item__sub">${escapeHtml(s.artist)} </div>
      </div>
      <div class="badges">
        <a class="open" href="${openLink(s)}">Aç</a>
      </div>
    </div>
  `).join("");
}

async function init(){
  const res = await fetch("assets/songs.json", { cache: "no-store" });
  SONGS = await res.json();
  render();

  $("#q")?.addEventListener("input", render);
  $("#clear")?.addEventListener("click", () => { $("#q").value=""; $("#q").focus(); render(); });
}

init().catch(err => console.error(err));
