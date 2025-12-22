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
  let t = "dark";
  try{ t = localStorage.getItem("theme") || "dark"; }catch(e){}
  applyTheme(t);

  const btn = $("#themeToggle");
  if(btn){
    btn.addEventListener("click", () => {
      const cur = document.documentElement.getAttribute("data-theme") || "dark";
      applyTheme(cur === "dark" ? "light" : "dark");
    });
  }
})();
