// song.js — tek şarkı sayfası
const CROPPED_PAGES = 7; // PDF kırpma sonrası PNG index kayması

// 🔴 YouTube API KEY
const YT_API_KEY = "AIzaSyBugpUSW2MwR6lDMzCHcnB0PoSV8lDEu2Q";

// --------------------
// yardımcılar
function makeId(s){ return `${s.pdf}|${s.page_original}`; }
function openLink(s){ return `song.html?id=${encodeURIComponent(makeId(s))}`; }

function artistArr(a){
  if(Array.isArray(a)) return a.filter(Boolean).map(String);
  if(a == null) return [];
  return [String(a)].filter(Boolean);
}
function artistLinks(a){
  const arr = artistArr(a);
  if(!arr.length) return "—";
  return arr.map(name => {
    const href = `artist.html?name=${encodeURIComponent(name)}`;
    return `<a class="artistLink" href="${href}">${escapeHtml(name)}</a>`;
  }).join(" · ");
}

function imagePageFor(s){ return Number(s.page_original) + CROPPED_PAGES; }
function imagePath(s){
  const folder = (s.pdf === "pdf1.pdf") ? "pages/pdf1" : "pages/pdf2";
  return `${folder}/page-${imagePageFor(s)}.png`;
}

function escapeHtml(str){
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function renderRecList(el, recs){
  el.innerHTML = recs.map(s => `
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

function getIdParam(){
  const p = new URLSearchParams(location.search);
  return p.get("id") || "";
}

function setZoom(img, z){
  const clamped = Math.max(0.6, Math.min(1, z));
  img.dataset.zoom = String(clamped);
  img.style.transform = `scale(${clamped})`;
  const zl = document.querySelector("#zoomLevel");
  if(zl) zl.textContent = `${Math.round(clamped * 100)}%`;
  return clamped;
}

// --------------------
// 🔴 YouTube video yükleyici
function loadYoutubeVideo(song, artist){
  if(!song || !artist) return;

  const card = document.getElementById("youtubeCard");
  const iframe = document.getElementById("youtubeFrame");
  if(!card || !iframe) return;

  const q = encodeURIComponent(`${artist} ${song}`);

  // 1) Arama: birkaç aday videoId topla
  const searchUrl =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet&type=video&maxResults=10&order=relevance&q=${q}&key=${YT_API_KEY}`;

  fetch(searchUrl)
    .then(r => r.json())
    .then(async d => {
      if(d.error){
        // Genelde sebep: API key referrer restriction (localhost izinli değil)
        console.warn("YouTube API error:", d.error);
        return;
      }

      const ids = (d.items || [])
        .map(it => it?.id?.videoId)
        .filter(Boolean);

      if(!ids.length) return;

      // 2) videos.list ile gerçekten embed edilebilir olanı seç
      const listUrl =
        `https://www.googleapis.com/youtube/v3/videos` +
        `?part=status&id=${ids.join(",")}&key=${YT_API_KEY}`;

      const lr = await fetch(listUrl);
      const list = await lr.json();
      if(list.error){
        console.warn("YouTube videos.list error:", list.error);
        return;
      }

      const ok = (list.items || []).find(v =>
        v?.status?.embeddable === true &&
        (v?.status?.privacyStatus === "public" || v?.status?.privacyStatus === "unlisted")
      );

      if(!ok?.id) return;

      iframe.src = `https://www.youtube.com/embed/${ok.id}`;
      card.style.display = "block";
    })
    .catch(err => console.warn("YouTube hata:", err));
}


// --------------------
async function init(){
  const res = await fetch("assets/songs.json", { cache: "no-store" });
  const SONGS = await res.json();

  const id = getIdParam();
  const current = SONGS.find(s => makeId(s) === id) || SONGS[0];

  $("#songName").textContent = current?.song || "—";
  $("#songArtist").innerHTML = artistLinks(current?.artist);

  const img = $("#img");
  img.src = imagePath(current);

  // 🔴 YouTube çağrısı (ilk sanatçıyı baz alır)
  const firstArtist = artistArr(current.artist)[0];
  loadYoutubeVideo(current.song, firstArtist);

  // zoom
  let zoom = 1;
  setZoom(img, zoom);

  $("#zoomIn")?.addEventListener("click", () => { zoom = setZoom(img, zoom + 0.1); });
  $("#zoomOut")?.addEventListener("click", () => { zoom = setZoom(img, zoom - 0.1); });
  $("#zoomFit")?.addEventListener("click", () => { zoom = setZoom(img, 1); });

  // önerilenler: önce aynı hunermend (yoksa rastgele)
  const pool = SONGS.filter(s => makeId(s) !== makeId(current));
  const recEl = $("#recs");
  const renderRecs = () => {
    const curArtists = new Set(artistArr(current.artist).map(a => norm(a)));
    const preferred = pool.filter(s =>
      artistArr(s.artist).some(a => curArtists.has(norm(a)))
    );
    const first = pickRandom(preferred, 6);
    const need = Math.max(0, 6 - first.length);
    const restPool = pool.filter(s => !first.some(x => makeId(x) === makeId(s)));
    const recs = first.concat(pickRandom(restPool, need));
    renderRecList(recEl, recs);
  };

  renderRecs();
  $("#shuffleRec")?.addEventListener("click", renderRecs);
}

init().catch(console.error);
