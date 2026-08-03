(function(){
"use strict";

/* ============================================================
   API CONFIGURATION
   ============================================================ */
const API_BASE_URL = 'https://up-backend-uv35.onrender.com';
const API_TOKEN_KEY = 'ultimate_panels_token';
const ADMIN_SESSION_KEY = 'ultimate_panels_admin_token';
const USER_PERSIST_SESSION_KEY = 'ultimate_panels_user_persist_session';
const ADMIN_PERSIST_SESSION_KEY = 'ultimate_panels_admin_persist_session';

// API Helper Functions
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  
  // Add auth token if available
  const token = localStorage.getItem(API_TOKEN_KEY);
  if (token) headers.Authorization = `Bearer ${token}`;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem(API_TOKEN_KEY);
        localStorage.removeItem(LS_KEY);
        return null;
      }
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    return null;
  }
}

// Sync comics from API
async function syncComicsFromAPI() {
  const data = await apiCall('/api/comics?limit=100');
  if (data && Array.isArray(data)) {
    // Transform API response to match local comic format
    state.comics = data.map((c, idx) => ({
      id: c.id,
      title: c.title,
      description: c.description || '',
      cover: c.cover_url || '',
      volume: 0,
      issue: 0,
      pages: (c.pages || []).map((p, i) => ({ src: p.url || p, w: p.width || 800, h: p.height || 1200 })),
      createdAt: new Date(c.created_at).getTime() || Date.now(),
      views: 0
    }));
    return true;
  }
  return false;
}

/* ============================================================
   0. I18N STRINGS
   ============================================================ */
const I18N = {
  en:{
    dir:"ltr", appName:"Ultimate Panels",
    tabHome:"Home", tabComics:"Comics", tabAbout:"About",
    heroTitle:"Welcome back", heroSub:"Your library, always with you.",
    statTotal:"Comics", statRead:"In Progress", statPages:"Pages Read",
    continueTitle:"Continue Reading", latestTitle:"Latest Comics", popularComicsTitle:"Most Popular Comics",
    searchPlaceholder:"Search comics…", emptyText:"No comics found",
    aboutSiteHeading:"📚 Ultimate Panels | Comics Store",
    aboutSiteText:"Welcome to Ultimate Panels.<br><br>🔒 You must be logged into your account to download and read comics. Users without an account cannot download any files.<br><br>🛒 Subscription purchases, comic purchases, and custom comic translation orders are handled exclusively through Telegram.<br><br>📩 Support, Purchases &amp; Orders:<br><a href=\"https://t.me/UP_Supporter\" target=\"_blank\" rel=\"noopener\">@UP_Supporter</a><br><br>📢 Telegram Channel:<br><a href=\"https://t.me/+BVBGfrjCvk5iOTJk\" target=\"_blank\" rel=\"noopener\">https://t.me/+BVBGfrjCvk5iOTJk</a><br><br>💥 Pricing:<br>• Comic chapter (available on the website): 20,000 Tomans per chapter<br>• Custom comic translation: 29,000 Tomans per chapter<br><br>⚡ After payment is confirmed, custom comic files will be delivered as quickly as possible.",
    labelDeveloper:"Developer", labelVersion:"Version", labelLicense:"License",
    adminTrigger:"Ultimate Panels © 2026",
    settingsHeading:"Settings", grpLanguage:"Language", langRowLbl:"Interface Language",
    grpTheme:"Theme", themeRowLbl:"Appearance", accentRowLbl:"Accent Color",
    grpAnim:"Animation", animRowLbl:"Enable Animations",
    grpReader:"Reader", fitRowLbl:"Page Fit", dirRowLbl:"Reading Direction", rememberRowLbl:"Remember Last Page",
    loginError:"Incorrect username or password.",
    loginMaxSessions:"Maximum administrator sessions reached.",
    editorHeadingUpload:"Upload Comic", editorHeadingEdit:"Edit Comic",
    readBtn:"Read", edit:"Edit", del:"Delete",
    volumeShort:"Vol", issueShort:"Iss",
    toastSaved:"Comic saved", toastDeleted:"Comic deleted", toastSignedOut:"Signed out",
    toastFillFields:"Please add a title and at least one page image", toastLoginOk:"Welcome, admin",
    toastUserLoginOk:"Signed in"
  },
  fa:{
    dir:"rtl", appName:"Ultimate Panels",
    tabHome:"خانه", tabComics:"کمیک‌ها", tabAbout:"درباره",
    heroTitle:"خوش آمدید", heroSub:"کتابخانه‌ی شما، همیشه همراه شما.",
    statTotal:"کمیک", statRead:"در حال مطالعه", statPages:"صفحات خوانده‌شده",
    continueTitle:"ادامه مطالعه", latestTitle:"جدیدترین کمیک‌ها", popularComicsTitle:"محبوب‌ترین کمیک‌ها",
    searchPlaceholder:"جستجوی کمیک…", emptyText:"کمیکی یافت نشد",
    aboutSiteHeading:"📚 Ultimate Panels | فروشگاه کمیک",
    aboutSiteText:"به Ultimate Panels خوش اومدید.<br><br>🔒 برای دانلود و مطالعه کمیک‌ها، ورود به حساب کاربری الزامی است. کاربران بدون اکانت امکان دانلود فایل‌ها را ندارند.<br><br>🛒 خرید اشتراک، خرید کمیک و ثبت سفارش ترجمه فقط از طریق تلگرام انجام می‌شود.<br><br>📩 پشتیبانی، خرید و سفارش:<br><a href=\"https://t.me/UP_Supporter\" target=\"_blank\" rel=\"noopener\">@UP_Supporter</a><br><br>📢 کانال تلگرام:<br><a href=\"https://t.me/+BVBGfrjCvk5iOTJk\" target=\"_blank\" rel=\"noopener\">https://t.me/+BVBGfrjCvk5iOTJk</a><br><br>💥 قیمت‌ها:<br>• هر چپتر کمیک (موجود در سایت): 20,000 تومان<br>• کمیک سفارشی (هر چپتر): 29,000 تومان<br><br>⚡ پس از پرداخت، فایل‌ کمیک‌های سفارشی در سریع‌ترین زمان ممکن برای شما ارسال خواهند شد.",
    labelDeveloper:"توسعه‌دهنده", labelVersion:"نسخه", labelLicense:"مجوز",
    adminTrigger:"Ultimate Panels © 2026",
    settingsHeading:"تنظیمات", grpLanguage:"زبان", langRowLbl:"زبان رابط کاربری",
    grpTheme:"ظاهر", themeRowLbl:"حالت نمایش", accentRowLbl:"رنگ اصلی",
    grpAnim:"انیمیشن", animRowLbl:"فعال‌سازی انیمیشن",
    grpReader:"خواننده", fitRowLbl:"اندازه صفحه", dirRowLbl:"جهت مطالعه", rememberRowLbl:"ذخیره آخرین صفحه",
    loginError:"نام کاربری یا رمز عبور اشتباه است.",
    loginMaxSessions:"حداکثر تعداد نشست‌های فعال مدیر پر شده است.",
    editorHeadingUpload:"بارگذاری کمیک", editorHeadingEdit:"ویرایش کمیک",
    readBtn:"مطالعه", edit:"ویرایش", del:"حذف",
    volumeShort:"جلد", issueShort:"شماره",
    toastSaved:"کمیک ذخیره شد", toastDeleted:"کمیک حذف شد", toastSignedOut:"از حساب خارج شدید",
    toastFillFields:"لطفاً عنوان و حداقل یک تصویر صفحه اضافه کنید", toastLoginOk:"خوش آمدید، مدیر",
    toastUserLoginOk:"با موفقیت وارد شدید"
  }
};

/* ============================================================
   1. STATE & STORAGE
   ============================================================ */
const LS_KEY = "ultimate_panels_state_v1";
const DEFAULT_LOGO = "data:image/svg+xml;utf8," + encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7c5cff"/><stop offset="1" stop-color="#ff6fae"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(#g)"/><text x="60" y="72" font-size="42" text-anchor="middle" font-family="-apple-system,sans-serif" fill="white" font-weight="700">UP</text></svg>`
);

/* ---- First-visit language detection ----
   Reads the browser/system language (navigator.languages, falling back to
   navigator.language) and maps it to a supported interface language. Only
   ever consulted when building a brand-new default state (i.e. no saved
   state exists yet) — once a value is saved, loadState() below preserves it
   as-is on every future visit, whether it came from detection or from an
   explicit manual switch, so a manual choice always wins going forward. */
function detectBrowserLang(){
  try{
    const candidates = (Array.isArray(navigator.languages) && navigator.languages.length)
      ? navigator.languages
      : [navigator.language || navigator.userLanguage || "فا"];
    for(const tag of candidates){
      if(typeof tag === "string" && tag.toLowerCase().split("-")[0] === "fa") return "fa";
    }
  }catch(e){ /* navigator unavailable — fall through to default */ }
  return "en";
}

function defaultState(){
  return {
    settings:{
      lang:detectBrowserLang(), theme:"system", accent:"265,85%,60%",
      animations:true, fit:"contain", rtl:false, remember:true
    },
    admin:{ signedIn:false },
    user:{ signedIn:false, username:null },
    guest:{ active:false }, // true once someone chooses "Continue as Guest" on the sign-in screen
    users:[
      {username: "Test-Account" , password: "Just-for-test"}
    ], // accounts created by the admin — { username, password }
    progress:{}, // comicId -> { page, total, updatedAt }
    logo: DEFAULT_LOGO,
    comics: [] // library starts empty — admin uploads populate it
  };
}

let state = loadState();
function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(!raw) return defaultState();
    const parsed = JSON.parse(raw);
    // merge with defaults to survive schema additions
    const d = defaultState();
    return {
      settings:Object.assign(d.settings, parsed.settings||{}),
      admin:Object.assign(d.admin, parsed.admin||{}),
      user:Object.assign(d.user, parsed.user||{}),
      guest:Object.assign(d.guest, parsed.guest||{}),
      users:Array.isArray(parsed.users) ? parsed.users : d.users,
      progress:parsed.progress||{},
      logo:parsed.logo||d.logo,
      comics:(Array.isArray(parsed.comics)&&parsed.comics.length?parsed.comics:d.comics).map(c=>({ views:0, ...c }))
    };
  }catch(e){ return defaultState(); }
}
let saveTimer=null;
function saveState(){
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=>{
    try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }
    catch(e){ toast(state.settings.lang==="fa"?"حافظه ذخیره‌سازی پر است":"Storage limit reached — try smaller images"); }
  }, 120);
}

/* ============================================================
   2. i18n APPLY
   ============================================================ */
function t(key){ return (I18N[state.settings.lang]||I18N.en)[key]; }
function applyI18n(){
  const lang = state.settings.lang;
  document.documentElement.lang = lang;
  document.documentElement.dir = I18N[lang].dir;
  document.title = t("appName");
  const map = {
    headerTitle:"appName", tabHomeLbl:"tabHome", tabComicsLbl:"tabComics", tabAboutLbl:"tabAbout",
    heroTitle:"heroTitle", heroSub:"heroSub", statReadLbl:"statRead", statPagesLbl:"statPages",
    continueTitle:"continueTitle", popularAccordionTitle:"popularComicsTitle", latestAccordionTitle:"latestTitle",
    popularEmptyText:"emptyText", latestEmptyText:"emptyText",
    aboutAppName:"appName", aboutSiteHeading:"aboutSiteHeading",
    labelDeveloper:"labelDeveloper", labelVersion:"labelVersion", labelLicense:"labelLicense",
    adminTrigger:"adminTrigger", settingsHeading:"settingsHeading", grpLanguage:"grpLanguage", langRowLbl:"langRowLbl",
    grpTheme:"grpTheme", themeRowLbl:"themeRowLbl", accentRowLbl:"accentRowLbl", grpAnim:"grpAnim", animRowLbl:"animRowLbl",
    grpReader:"grpReader", fitRowLbl:"fitRowLbl", dirRowLbl:"dirRowLbl", rememberRowLbl:"rememberRowLbl"
  };
  Object.keys(map).forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent = t(map[id]); });
  const aboutSiteTextEl = document.getElementById("aboutSiteText");
  if(aboutSiteTextEl) aboutSiteTextEl.innerHTML = t("aboutSiteText");
  document.getElementById("searchInput").placeholder = t("searchPlaceholder");
  document.getElementById("loadingCaption").textContent = lang==="fa" ? "در حال بارگذاری…" : "Loading…";
  renderAccountSection();
  renderComics();
  renderHome();
}

/* ============================================================
   3. THEME + ACCENT
   ============================================================ */
const ACCENTS = ["265,85%,60%","210,90%,55%","160,70%,42%","28,90%,55%","340,80%,60%","0,75%,55%"];
function applyTheme(){
  const mode = state.settings.theme;
  let effective = mode;
  if(mode==="system"){ effective = window.matchMedia("(prefers-color-scheme: light)").matches ? "light":"dark"; }
  document.documentElement.setAttribute("data-theme", effective);
  document.documentElement.setAttribute("data-anim", state.settings.animations ? "on":"off");
  const [h,s,l] = state.settings.accent.split(",");
  document.documentElement.style.setProperty("--accent-h", h);
  document.documentElement.style.setProperty("--accent-s", s);
  document.documentElement.style.setProperty("--accent-l", l);
}
window.matchMedia("(prefers-color-scheme: light)").addEventListener("change", ()=>{ if(state.settings.theme==="system") applyTheme(); });

/* Extract a dominant-ish color from an image and set as accent */
function extractDominantAccent(imgEl){
  try{
    const c = document.createElement("canvas");
    const size = 40; c.width=size; c.height=size;
    const ctx = c.getContext("2d");
    ctx.drawImage(imgEl,0,0,size,size);
    const data = ctx.getImageData(0,0,size,size).data;
    let r=0,g=0,b=0,n=0;
    for(let i=0;i<data.length;i+=4){
      const alpha = data[i+3]; if(alpha<200) continue;
      r+=data[i]; g+=data[i+1]; b+=data[i+2]; n++;
    }
    if(!n) return;
    r/=n; g/=n; b/=n;
    const [h,s,l] = rgbToHsl(r,g,b);
    state.settings.accent = `${Math.round(h)},${Math.max(45,Math.round(s))}%,${Math.min(68,Math.max(40,Math.round(l)))}%`;
    applyTheme(); renderAccentSwatches(); saveState();
  }catch(e){ /* canvas may be tainted for cross-origin images; ignore */ }
}
function rgbToHsl(r,g,b){
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h,s,l=(max+min)/2;
  if(max===min){ h=s=0; }
  else{
    const d=max-min;
    s = l>0.5 ? d/(2-max-min) : d/(max+min);
    switch(max){
      case r: h=(g-b)/d+(g<b?6:0); break;
      case g: h=(b-r)/d+2; break;
      default: h=(r-g)/d+4;
    }
    h*=60;
  }
  return [h, s*100, l*100];
}

/* ============================================================
   4. NAVIGATION (tabs)
   ============================================================ */
document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=> switchView(btn.dataset.view));
});
function switchView(name){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById("view-"+name).classList.add("active");
  document.querySelectorAll(".tab-btn").forEach(b=>{
    const active = b.dataset.view===name;
    b.classList.toggle("active", active);
    b.setAttribute("aria-current", active ? "page":"false");
  });
  document.getElementById("mainScroll").scrollTop = 0;
}

/* ============================================================
   5. RENDER: HOME
   ============================================================ */
function renderHome(){
  const continueRow = document.getElementById("continueRow");
  continueRow.innerHTML = "";

  // Reading progress ("In Progress" / "Pages Read" stats and the Continue
  // Reading row) is a registered-user-only feature. Guests must not see
  // resume/progress data at all — not just be blocked from clicking into
  // it — since that data may belong to a real account previously signed
  // in on this browser. Gate the whole section on isAuthenticated().
  if(!isAuthenticated()){
    document.getElementById("statRead").textContent = "0";
    document.getElementById("statPages").textContent = "0";
    continueRow.innerHTML = `<div style="color:var(--text-3); font-size:13px; padding:8px 4px;">${GUEST_READ_LOCK_MSG}</div>`;
    return;
  }

  const inProgress = Object.values(state.progress).filter(p=>p.page>0 && p.page < p.total-1);
  document.getElementById("statRead").textContent = inProgress.length;
  const pagesRead = Object.values(state.progress).reduce((a,p)=>a+(p.page+1),0);
  document.getElementById("statPages").textContent = pagesRead;

  const continueList = Object.entries(state.progress)
    .filter(([id,p])=> state.comics.find(c=>c.id===id) && p.page < p.total-1)
    .sort((a,b)=> b[1].updatedAt - a[1].updatedAt).slice(0,10);
  if(!continueList.length){
    continueRow.innerHTML = `<div style="color:var(--text-3); font-size:13px; padding:8px 4px;">—</div>`;
  }
  continueList.forEach(([id,p],i)=>{
    const comic = state.comics.find(c=>c.id===id);
    const pct = Math.round(((p.page+1)/p.total)*100);
    const el = document.createElement("div");
    el.className="continue-card"; el.style.animationDelay=(i*0.04)+"s";
    el.innerHTML = `<img class="continue-cover" loading="lazy" src="${comic.cover}" alt="${escapeHtml(comic.title)}">
      <div class="continue-progress-track"><div class="continue-progress-fill" style="width:${pct}%"></div></div>
      <div class="continue-meta">${escapeHtml(comic.title)}<span>${t("volumeShort")} ${escapeHtml(comic.volume)} · ${pct}%</span></div>`;
    el.addEventListener("click", ()=> openReader(comic.id));
    continueRow.appendChild(el);
  });
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c])); }

/* ============================================================
   6. RENDER: COMICS GRID + SEARCH
   ============================================================ */
let searchQuery = "";
function buildComicCard(c, i){
  const card = document.createElement("div");
  card.className = "glass-card comic-card";
  card.style.animationDelay = Math.min(i*0.035,0.4)+"s";
  const guestMode = !isAuthenticated();
  card.innerHTML = `
    <div class="comic-cover-wrap">
      <img class="comic-cover" loading="lazy" src="${c.cover}" alt="${escapeHtml(c.title)}">
      <span class="comic-badge">${t("issueShort")} ${escapeHtml(c.issue)}</span>
    </div>
    <div class="comic-info">
      <p class="comic-title">${escapeHtml(c.title)}</p>
      <p class="comic-sub">${t("volumeShort")} ${escapeHtml(c.volume)}</p>
      <button class="read-btn" data-id="${c.id}" ${guestMode ? "disabled" : ""} title="${guestMode ? GUEST_READ_LOCK_MSG : ""}">${t("readBtn")}</button>
      ${state.admin.signedIn ? `<div class="admin-card-actions">
        <button class="admin-mini-btn" data-edit="${c.id}">${t("edit")}</button>
        <button class="admin-mini-btn danger" data-del="${c.id}">${t("del")}</button>
      </div>` : ""}
    </div>`;
  const img = card.querySelector("img");
  img.addEventListener("load", ()=> img.classList.add("loaded"));
  card.querySelector(".read-btn").addEventListener("click", ()=> openReader(c.id));
  const editBtn = card.querySelector("[data-edit]");
  if(editBtn) editBtn.addEventListener("click", ()=> openEditor(c.id));
  const delBtn = card.querySelector("[data-del]");
  if(delBtn) delBtn.addEventListener("click", ()=> deleteComic(c.id));
  return card;
}
function fillGrid(gridId, emptyId, list){
  const grid = document.getElementById(gridId);
  const empty = document.getElementById(emptyId);
  grid.innerHTML = "";
  empty.style.display = list.length ? "none":"block";
  list.forEach((c,i)=> grid.appendChild(buildComicCard(c,i)));
}
function renderComics(){
  const q = searchQuery.trim().toLowerCase();
  const filtered = state.comics.filter(c=> c.title.toLowerCase().includes(q));

  // Section 1: Most Popular — highest views first
  const popular = [...filtered].sort((a,b)=> (b.views||0)-(a.views||0));
  fillGrid("popularGrid", "popularEmpty", popular);

  // Section 2: Latest — newest upload first
  const latest = [...filtered].sort((a,b)=> b.createdAt-a.createdAt);
  fillGrid("latestComicsGrid", "latestComicsEmpty", latest);
}

const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", ()=>{ searchQuery = searchInput.value; renderComics(); });
document.getElementById("searchClear").addEventListener("click", ()=>{ searchInput.value=""; searchQuery=""; renderComics(); searchInput.focus(); });

/* Accordion toggles (Comics tab) */
function setupAccordion(toggleId, bodyId){
  const toggle = document.getElementById(toggleId);
  const body = document.getElementById(bodyId);
  toggle.addEventListener("click", ()=>{
    const isOpen = body.classList.toggle("open");
    toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
}
setupAccordion("popularToggle", "popularBody");
setupAccordion("latestComicsToggle", "latestComicsBody");

/* ============================================================
   7. SETTINGS SHEET
   ============================================================ */
const settingsOverlay = document.getElementById("settingsOverlay");
document.getElementById("settingsBtn").addEventListener("click", ()=> openSheet(settingsOverlay));
document.getElementById("settingsClose").addEventListener("click", ()=> closeSheet(settingsOverlay));
settingsOverlay.addEventListener("click", e=>{ if(e.target===settingsOverlay) closeSheet(settingsOverlay); });

function openSheet(ov){ ov.classList.add("open"); }
function closeSheet(ov){ ov.classList.remove("open"); }

// Guests cannot modify settings. Controls are also natively disabled (see
// applyGuestRestrictions), but every handler re-checks here as well —
// defense in depth in case a control is ever reachable without its disabled
// attribute (e.g. keyboard activation edge cases).
function blockIfGuest(){
  if(isAuthenticated()) return false;
  toast(GUEST_LOCK_MSG);
  return true;
}

document.getElementById("langSeg").addEventListener("click", e=>{
  if(blockIfGuest()) return;
  const btn = e.target.closest("button"); if(!btn) return;
  setActiveSeg(e.currentTarget, btn);
  state.settings.lang = btn.dataset.lang; saveState(); applyI18n();
});
document.getElementById("themeSeg").addEventListener("click", e=>{
  if(blockIfGuest()) return;
  const btn = e.target.closest("button"); if(!btn) return;
  setActiveSeg(e.currentTarget, btn);
  state.settings.theme = btn.dataset.theme; saveState(); applyTheme();
});
document.getElementById("fitSeg").addEventListener("click", e=>{
  if(blockIfGuest()) return;
  const btn = e.target.closest("button"); if(!btn) return;
  setActiveSeg(e.currentTarget, btn);
  state.settings.fit = btn.dataset.fit; saveState();
});
document.getElementById("dirSeg").addEventListener("click", e=>{
  if(blockIfGuest()) return;
  const btn = e.target.closest("button"); if(!btn) return;
  setActiveSeg(e.currentTarget, btn);
  state.settings.rtl = btn.dataset.rtl==="1"; saveState();
});
function setActiveSeg(container, btn){ container.querySelectorAll("button").forEach(b=>b.classList.remove("active")); btn.classList.add("active"); }

document.getElementById("animToggle").addEventListener("change", e=>{
  if(blockIfGuest()){ e.target.checked = state.settings.animations; return; }
  state.settings.animations = e.target.checked; saveState(); applyTheme();
});
document.getElementById("rememberToggle").addEventListener("change", e=>{
  if(blockIfGuest()){ e.target.checked = state.settings.remember; return; }
  state.settings.remember = e.target.checked; saveState();
});

function renderAccentSwatches(){
  const wrap = document.getElementById("accentSwatches");
  wrap.innerHTML = "";
  const guestMode = typeof isAuthenticated === "function" ? !isAuthenticated() : false;
  ACCENTS.forEach(a=>{
    const [h,s,l] = a.split(",");
    const sw = document.createElement("button");
    sw.className = "swatch" + (a===state.settings.accent ? " active":"");
    sw.style.background = `hsl(${h} ${s} ${l})`;
    sw.setAttribute("aria-label","Accent color");
    sw.disabled = guestMode;
    if(guestMode) sw.title = GUEST_LOCK_MSG;
    sw.addEventListener("click", ()=>{ if(blockIfGuest()) return; state.settings.accent=a; applyTheme(); saveState(); renderAccentSwatches(); });
    wrap.appendChild(sw);
  });
}

/* ============================================================
   7b. ACCOUNT SECTION (Settings) — status + sign out + admin-only user management
   ============================================================ */
function renderAccountSection(){
  const lbl = document.getElementById("accountStatusLbl");
  const signOutBtn = document.getElementById("accountSignOutBtn");
  const signInBtn = document.getElementById("accountSignInBtn");
  const signedIn = state.admin.signedIn || state.user.signedIn;
  if(state.admin.signedIn) lbl.textContent = "Signed in as Administrator";
  else if(state.user.signedIn) lbl.textContent = "Signed in as " + state.user.username;
  else lbl.textContent = "Browsing as Guest";
  signOutBtn.style.display = signedIn ? "inline-flex" : "none";
  signInBtn.style.display = signedIn ? "none" : "inline-flex";

  const adminGroup = document.getElementById("adminCreateUserGroup");
  adminGroup.style.display = state.admin.signedIn ? "block" : "none";
  if(state.admin.signedIn) renderAdminUserList();

  applyGuestRestrictions();
}
document.getElementById("accountSignOutBtn").addEventListener("click", ()=>{
  if(state.admin.signedIn) signOutAdmin();
  else if(state.user.signedIn) signOutUser();
  closeSheet(settingsOverlay);
  showAuthGate();
});
// Guests only: takes them back to the Sign In screen (no account to sign out of).
document.getElementById("accountSignInBtn").addEventListener("click", ()=>{
  closeSheet(settingsOverlay);
  showAuthGate();
});
function signOutUser(){
  const uname = state.user.username;
  const id = getUserSessionId(false);
  if(uname && id){
    const sessions = readUserSessions();
    if(sessions[uname] && sessions[uname].sessionId===id){ delete sessions[uname]; writeUserSessions(sessions); }
  }
  stopUserHeartbeat();
  localStorage.removeItem(API_TOKEN_KEY);
  localStorage.removeItem('api_user_id');
  localStorage.removeItem(USER_PERSIST_SESSION_KEY);
  sessionStorage.removeItem(USER_SESSION_ID_KEY);
  state.user = { signedIn:false, username:null };
  state.guest.active = false;
  saveState();
  toast(t("toastSignedOut"));
}

/* ---- Guest restrictions ----
   Guests may browse the catalog but cannot read comics, change settings, or
   reach anything authenticated/admin-only. Reading is blocked at its single
   choke point (see openReader()/blockIfGuestRead()); the controls below are
   natively disabled (not just hidden) so a guest gets clear, immediate
   feedback instead of a silent no-op. */
function applyGuestRestrictions(){
  const guestMode = !isAuthenticated();
  const lockedSelectors = ["#langSeg button", "#themeSeg button", "#accentSwatches button", "#fitSeg button", "#dirSeg button"];
  lockedSelectors.forEach(sel=>{
    document.querySelectorAll(sel).forEach(el=>{
      el.disabled = guestMode;
      el.title = guestMode ? GUEST_LOCK_MSG : "";
    });
  });
  ["animToggle","rememberToggle"].forEach(id=>{
    const el = document.getElementById(id);
    if(!el) return;
    el.disabled = guestMode;
    el.title = guestMode ? GUEST_LOCK_MSG : "";
  });
  const notice = document.getElementById("guestSettingsNotice");
  if(notice) notice.style.display = guestMode ? "block" : "none";
}
function renderAdminUserList(){
  const wrap = document.getElementById("adminUserList");
  wrap.innerHTML = "";
  if(!state.users.length){
    wrap.innerHTML = `<div class="row-sub" style="padding:6px 2px;">No user accounts yet.</div>`;
    return;
  }
  state.users.forEach(acc=>{
    const row = document.createElement("div");
    row.className = "settings-row";
    row.style.marginBottom = "0";
    row.innerHTML = `<div class="row-label">${escapeHtml(acc.username)}</div>`;
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "admin-mini-btn danger";
    delBtn.style.flex = "none";
    delBtn.style.padding = "6px 12px";
    delBtn.textContent = "Delete";
    delBtn.setAttribute("aria-label", "Delete user " + acc.username);
    delBtn.addEventListener("click", ()=>{
      const confirmed = confirm(`Delete user "${acc.username}"? This permanently removes the account and cannot be undone.`);
      if(confirmed) deleteUserAccount(acc.username);
    });
    row.appendChild(delBtn);
    wrap.appendChild(row);
  });
}
// Admin-only: permanently removes a normal user account (username, password,
// and any session it holds). Guarded here too, not just by hiding the
// button, so the action can never run unless an administrator is signed in.
function deleteUserAccount(username){
  if(!state.admin.signedIn) return;
  const idx = state.users.findIndex(acc=> acc.username === username);
  if(idx === -1) return;
  state.users.splice(idx, 1);
  saveState();

  // Immediately revoke any active session for this account so it cannot
  // continue to be used, and free its single-session slot for the future.
  const sessions = readUserSessions();
  if(sessions[username]){ delete sessions[username]; writeUserSessions(sessions); }

  // Defensive: if this very browser tab happens to be signed in as the
  // account just deleted, end that session immediately.
  if(state.user.signedIn && state.user.username === username){
    forceUserSessionEnd();
  }

  renderAdminUserList();
  toast("User account deleted");
}
function escapeHtml(s){
  return String(s).replace(/[&<>"']/g, c=> ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}

/* ============================================================
   8. AUTHENTICATION (client-side demo gate only — see caveat)
   ============================================================ */
// NOTE: Because this app has no backend, all credential checks happen
// entirely in the browser and can be read/bypassed via DevTools. This
// gates the UI for normal visitors, not real access control. Replace
// with real server-side auth (e.g. a signed session token issued by a
// backend) before using this for anything that must be genuinely protected.
const ADMIN_CREDENTIALS = { username:"UP_TEAM", password:"UP_TEAM#R9!xV27@Lm$Q4tZ" };

function isAuthenticated(){
  return !!(state.admin.signedIn || state.user.signedIn);
}
// Whether the app content should be reachable at all — either a real signed-in
// account, or someone browsing anonymously via "Continue as Guest".
function canBrowse(){
  return isAuthenticated() || !!state.guest.active;
}
function showAuthGate(){
  document.getElementById("authGate").classList.remove("hidden");
}
function hideAuthGate(){
  document.getElementById("authGate").classList.add("hidden");
}
const GUEST_LOCK_MSG = "Sign in required to change settings.";
const GUEST_READ_LOCK_MSG = "Sign in required to read comics.";
// Guests (including anyone who reaches the app only via "Continue as Guest")
// may never open the reader. This is the single choke point every reader
// entry path funnels through — see openReader() below — so no UI control,
// deep link, or console call can bypass it.
function blockIfGuestRead(){
  if(isAuthenticated()) return false;
  toast(GUEST_READ_LOCK_MSG);
  return true;
}

/* ---- Persistent Session Management ----
   These functions save and restore authenticated sessions to localStorage
   so users stay logged in across page reloads, browser restarts, and new tabs. */

function saveUserPersistentSession(){
  if(state.user.signedIn && state.user.username){
    const sessionData = {
      username: state.user.username,
      savedAt: Date.now()
    };
    try{
      localStorage.setItem(USER_PERSIST_SESSION_KEY, JSON.stringify(sessionData));
    }catch(e){ console.error('Failed to save user session:', e); }
  }
}

function saveAdminPersistentSession(){
  if(state.admin.signedIn){
    const sessionData = {
      token: localStorage.getItem(API_TOKEN_KEY),
      savedAt: Date.now()
    };
    try{
      localStorage.setItem(ADMIN_PERSIST_SESSION_KEY, JSON.stringify(sessionData));
    }catch(e){ console.error('Failed to save admin session:', e); }
  }
}

function restoreUserPersistentSession(){
  try{
    const raw = localStorage.getItem(USER_PERSIST_SESSION_KEY);
    if(!raw) return false;
    const sessionData = JSON.parse(raw);
    const username = sessionData.username;
    
    // Validate that the account still exists
    const accountExists = state.users.some(acc => acc.username === username);
    if(!accountExists){
      localStorage.removeItem(USER_PERSIST_SESSION_KEY);
      return false;
    }
    
    // Restore the session
    const sessionId = getUserSessionId(true);
    const sessions = readUserSessions();
    pruneExpiredUserSessions(sessions);
    sessions[username] = { sessionId, loginAt: Date.now(), lastSeen: Date.now() };
    writeUserSessions(sessions);
    startUserHeartbeat();
    
    state.user = { signedIn: true, username: username };
    state.guest.active = false;
    return true;
  }catch(e){
    console.error('Failed to restore user session:', e);
    localStorage.removeItem(USER_PERSIST_SESSION_KEY);
    return false;
  }
}

function restoreAdminPersistentSession(){
  try{
    const raw = localStorage.getItem(ADMIN_PERSIST_SESSION_KEY);
    if(!raw) return false;
    const sessionData = JSON.parse(raw);
    
    // If there's a stored API token, validate it by checking against credentials
    // (In a real app, validate with backend)
    const sessionId = getAdminSessionId(true);
    const sessions = readAdminSessions();
    pruneExpiredAdminSessions(sessions);
    
    sessions[sessionId] = { loginAt: Date.now(), lastSeen: Date.now() };
    writeAdminSessions(sessions);
    startAdminHeartbeat();
    
    state.admin.signedIn = true;
    state.user = { signedIn: false, username: null };
    state.guest.active = false;
    
    if(sessionData.token){
      localStorage.setItem(API_TOKEN_KEY, sessionData.token);
    }
    return true;
  }catch(e){
    console.error('Failed to restore admin session:', e);
    localStorage.removeItem(ADMIN_PERSIST_SESSION_KEY);
    return false;
  }
}

function clearUserPersistentSession(){
  localStorage.removeItem(USER_PERSIST_SESSION_KEY);
}

function clearAdminPersistentSession(){
  localStorage.removeItem(ADMIN_PERSIST_SESSION_KEY);
}

/* ---- Admin session tracking (client-side simulation) ----
   No backend exists, so "simultaneous sessions" are tracked via localStorage
   (shared across tabs/windows of the SAME browser only — this cannot detect
   sessions from other browsers or devices, since there is no server to
   coordinate them). Each browser tab gets its own session id (sessionStorage,
   survives refresh, does NOT survive opening a new tab) and must send a
   periodic heartbeat to stay counted as active; sessions that stop
   heartbeating are pruned as expired before every count/login check. */
const ADMIN_SESSIONS_KEY = "ultimate_panels_admin_sessions_v1";
const ADMIN_SESSION_ID_KEY = "up_admin_session_id";
const MAX_ADMIN_SESSIONS = 2;
const ADMIN_SESSION_HEARTBEAT_MS = 15000;
const ADMIN_SESSION_TIMEOUT_MS = 40000;
let adminHeartbeatTimer = null;

function getAdminSessionId(create){
  let id = sessionStorage.getItem(ADMIN_SESSION_ID_KEY);
  if(!id && create){
    id = "sess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,10);
    sessionStorage.setItem(ADMIN_SESSION_ID_KEY, id);
  }
  return id;
}
function readAdminSessions(){
  try{ return JSON.parse(localStorage.getItem(ADMIN_SESSIONS_KEY)) || {}; }
  catch(e){ return {}; }
}
function writeAdminSessions(sessions){
  try{ localStorage.setItem(ADMIN_SESSIONS_KEY, JSON.stringify(sessions)); }catch(e){}
}
// Removes any session that has stopped heartbeating; returns true if it changed anything.
function pruneExpiredAdminSessions(sessions){
  const now = Date.now();
  let changed = false;
  Object.keys(sessions).forEach(id=>{
    if(!sessions[id] || (now - sessions[id].lastSeen) > ADMIN_SESSION_TIMEOUT_MS){ delete sessions[id]; changed = true; }
  });
  return changed;
}
function startAdminHeartbeat(){
  stopAdminHeartbeat();
  adminHeartbeatTimer = setInterval(()=>{
    const id = getAdminSessionId(false);
    const sessions = readAdminSessions();
    if(id && sessions[id]){
      sessions[id].lastSeen = Date.now();
      pruneExpiredAdminSessions(sessions);
      writeAdminSessions(sessions);
    } else {
      // our session was pruned elsewhere (expired) — reflect that locally
      forceAdminSessionEnd();
    }
  }, ADMIN_SESSION_HEARTBEAT_MS);
}
function stopAdminHeartbeat(){
  if(adminHeartbeatTimer){ clearInterval(adminHeartbeatTimer); adminHeartbeatTimer = null; }
}
function forceAdminSessionEnd(){
  stopAdminHeartbeat();
  sessionStorage.removeItem(ADMIN_SESSION_ID_KEY);
  state.admin.signedIn = false; 
  state.guest.active = false;
  saveState();
  renderAccountSection(); applyAdminVisibility(); renderComics();
  if(!isAuthenticated()) showAuthGate();
}
// Called on every load: reconcile this tab's admin status with the session registry,
// so a plain page refresh reuses the existing session instead of creating a new one,
// and a tab whose session has expired is correctly shown as signed out.
function syncAdminSessionState(){
  const id = getAdminSessionId(false);
  const sessions = readAdminSessions();
  const pruned = pruneExpiredAdminSessions(sessions);
  if(id && sessions[id]){
    sessions[id].lastSeen = Date.now();
    writeAdminSessions(sessions);
    state.admin.signedIn = true;
    startAdminHeartbeat();
  } else {
    if(pruned) writeAdminSessions(sessions);
    if(id) sessionStorage.removeItem(ADMIN_SESSION_ID_KEY);
    state.admin.signedIn = false;
  }
}
window.addEventListener("pagehide", ()=>{
  // Best-effort cleanup on tab/window close so the slot frees up immediately;
  // the heartbeat timeout is the reliable backstop if this never fires.
  const id = getAdminSessionId(false);
  if(!id) return;
  const sessions = readAdminSessions();
  if(sessions[id]){ delete sessions[id]; writeAdminSessions(sessions); }
});

function signOutAdmin(){
  const id = getAdminSessionId(false);
  if(id){
    const sessions = readAdminSessions();
    delete sessions[id];
    writeAdminSessions(sessions);
    sessionStorage.removeItem(ADMIN_SESSION_ID_KEY);
  }
  stopAdminHeartbeat();
  localStorage.removeItem(API_TOKEN_KEY);
  localStorage.removeItem(ADMIN_SESSION_KEY);
  localStorage.removeItem('api_user_id');
  localStorage.removeItem(ADMIN_PERSIST_SESSION_KEY);
  state.admin.signedIn = false; 
  state.guest.active = false;
  saveState();
  renderAccountSection(); applyAdminVisibility(); renderComics();
  toast(t("toastSignedOut"));
}
function applyAdminVisibility(){
  document.getElementById("adminUploadBar").style.display = state.admin.signedIn ? "block":"none";
}

/* ---- Normal user session tracking (client-side simulation) ----
   Same mechanism and same caveats as the admin session tracking above:
   localStorage-backed, shared only across tabs/windows of the SAME browser,
   with a per-tab session id (sessionStorage) and a heartbeat so a slot is
   reliably freed if a tab is closed without a clean sign-out. Unlike admin
   accounts (which allow MAX_ADMIN_SESSIONS concurrent sessions), each normal
   user account is allowed exactly ONE active session at a time — a second
   login attempt for the same account is rejected while the first is active. */
const USER_SESSIONS_KEY = "ultimate_panels_user_sessions_v1";
const USER_SESSION_ID_KEY = "up_user_session_id";
const USER_SESSION_HEARTBEAT_MS = 15000;
const USER_SESSION_TIMEOUT_MS = 40000;
let userHeartbeatTimer = null;

function getUserSessionId(create){
  let id = sessionStorage.getItem(USER_SESSION_ID_KEY);
  if(!id && create){
    id = "usess_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2,10);
    sessionStorage.setItem(USER_SESSION_ID_KEY, id);
  }
  return id;
}
function readUserSessions(){
  try{ return JSON.parse(localStorage.getItem(USER_SESSIONS_KEY)) || {}; }
  catch(e){ return {}; }
}
function writeUserSessions(sessions){
  try{ localStorage.setItem(USER_SESSIONS_KEY, JSON.stringify(sessions)); }catch(e){}
}
// Sessions are keyed by username (max one entry per account). Removes any
// session that has stopped heartbeating; returns true if it changed anything.
function pruneExpiredUserSessions(sessions){
  const now = Date.now();
  let changed = false;
  Object.keys(sessions).forEach(uname=>{
    const s = sessions[uname];
    if(!s || (now - s.lastSeen) > USER_SESSION_TIMEOUT_MS){ delete sessions[uname]; changed = true; }
  });
  return changed;
}
function startUserHeartbeat(){
  stopUserHeartbeat();
  userHeartbeatTimer = setInterval(()=>{
    const uname = state.user.username;
    const id = getUserSessionId(false);
    if(!uname || !id){ stopUserHeartbeat(); return; }
    const sessions = readUserSessions();
    if(sessions[uname] && sessions[uname].sessionId===id){
      sessions[uname].lastSeen = Date.now();
      pruneExpiredUserSessions(sessions);
      writeUserSessions(sessions);
    } else {
      // our session was pruned/replaced elsewhere (expired, or the account
      // was deleted by an admin) — reflect that locally right away
      forceUserSessionEnd();
    }
  }, USER_SESSION_HEARTBEAT_MS);
}
function stopUserHeartbeat(){
  if(userHeartbeatTimer){ clearInterval(userHeartbeatTimer); userHeartbeatTimer = null; }
}
function forceUserSessionEnd(){
  stopUserHeartbeat();
  sessionStorage.removeItem(USER_SESSION_ID_KEY);
  state.user = { signedIn:false, username:null }; 
  state.guest.active = false;
  saveState();
  renderAccountSection(); applyAdminVisibility(); renderComics();
  if(!canBrowse()) showAuthGate();
}
// Called on every load: reconcile this tab's user session with the registry,
// so a plain page refresh reuses the existing session instead of creating a
// new one, and a tab whose session has expired (or whose account was
// deleted) is correctly shown as signed out.
function syncUserSessionState(){
  if(!state.user.signedIn || !state.user.username) return;
  const uname = state.user.username;
  const id = getUserSessionId(false);
  const sessions = readUserSessions();
  const pruned = pruneExpiredUserSessions(sessions);
  if(id && sessions[uname] && sessions[uname].sessionId===id){
    sessions[uname].lastSeen = Date.now();
    writeUserSessions(sessions);
    startUserHeartbeat();
  } else {
    if(pruned) writeUserSessions(sessions);
    if(id) sessionStorage.removeItem(USER_SESSION_ID_KEY);
    state.user = { signedIn:false, username:null };
  }
  saveState();
}
window.addEventListener("pagehide", ()=>{
  // Best-effort cleanup on tab/window close so the account's single slot
  // frees up immediately; the heartbeat timeout is the reliable backstop.
  const uname = state.user.username;
  const id = getUserSessionId(false);
  if(!uname || !id) return;
  const sessions = readUserSessions();
  if(sessions[uname] && sessions[uname].sessionId===id){ delete sessions[uname]; writeUserSessions(sessions); }
});
// Fires in OTHER tabs of this browser whenever the session registry changes
// (e.g. an administrator deletes this account, or its session is taken over
// after expiring). Lets a signed-in tab lose access immediately instead of
// waiting for the next heartbeat tick.
window.addEventListener("storage", e=>{
  if(e.key !== USER_SESSIONS_KEY) return;
  if(!state.user.signedIn || !state.user.username) return;
  const uname = state.user.username;
  const id = getUserSessionId(false);
  const sessions = readUserSessions();
  if(!sessions[uname] || sessions[uname].sessionId !== id){
    forceUserSessionEnd();
  }
});

/* ---- Sign In (auth gate) ----
   Single form: account type is detected automatically from the credentials
   entered — no separate Admin option is shown or needs to be chosen. */
document.getElementById("gateUserSubmit").addEventListener("click", attemptLogin);
document.getElementById("gateUserPassword").addEventListener("keydown", e=>{ if(e.key==="Enter") attemptLogin(); });

async function attemptLogin(){
  const u = document.getElementById("gateUserUsername").value.trim();
  const p = document.getElementById("gateUserPassword").value;
  const err = document.getElementById("gateUserError");
  if(!u || !p){
    err.textContent = "Please enter both username and password.";
    err.style.display = "block";
    return;
  }

  // Try API login first for both admin and regular users
  const apiResult = await apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: u, password: p })
  });

  if (apiResult && apiResult.access_token) {
    // API login successful — treat as admin login
    localStorage.setItem(API_TOKEN_KEY, apiResult.access_token);
    localStorage.setItem('api_user_id', apiResult.user_id);
    
    const id = getAdminSessionId(true);
    const sessions = readAdminSessions();
    pruneExpiredAdminSessions(sessions);
    const alreadyActive = !!sessions[id];
    const otherActiveCount = Object.keys(sessions).filter(sid=> sid!==id).length;
    if(!alreadyActive && otherActiveCount >= MAX_ADMIN_SESSIONS){
      writeAdminSessions(sessions);
      err.textContent = "Maximum administrator sessions reached.";
      err.style.display = "block";
      return;
    }
    sessions[id] = { loginAt: sessions[id] ? sessions[id].loginAt : Date.now(), lastSeen: Date.now() };
    writeAdminSessions(sessions);
    startAdminHeartbeat();
    
    state.admin.signedIn = true;
    state.user = { signedIn:false, username:null };
    state.guest.active = false;
    saveAdminPersistentSession();
    saveState();
    err.style.display = "none";
    document.getElementById("gateUserUsername").value = ""; document.getElementById("gateUserPassword").value = "";
    hideAuthGate();
    renderAccountSection(); applyAdminVisibility(); renderComics();
    toast(t("toastLoginOk"));
    return;
  }

  // Fallback to local authentication
  // Administrator credentials take priority — matched first so the same
  // form can sign a person in as admin or as a normal user automatically.
  if(u===ADMIN_CREDENTIALS.username && p===ADMIN_CREDENTIALS.password){
    const id = getAdminSessionId(true);
    const sessions = readAdminSessions();
    pruneExpiredAdminSessions(sessions);
    const alreadyActive = !!sessions[id];
    const otherActiveCount = Object.keys(sessions).filter(sid=> sid!==id).length;
    if(!alreadyActive && otherActiveCount >= MAX_ADMIN_SESSIONS){
      writeAdminSessions(sessions);
      err.textContent = "Maximum administrator sessions reached.";
      err.style.display = "block";
      return;
    }
    sessions[id] = { loginAt: sessions[id] ? sessions[id].loginAt : Date.now(), lastSeen: Date.now() };
    writeAdminSessions(sessions);
    startAdminHeartbeat();
    state.admin.signedIn = true;
    state.user = { signedIn:false, username:null };
    state.guest.active = false;
    saveAdminPersistentSession();
    saveState();
    err.style.display = "none";
    document.getElementById("gateUserUsername").value = ""; document.getElementById("gateUserPassword").value = "";
    hideAuthGate();
    renderAccountSection(); applyAdminVisibility(); renderComics();
    toast(t("toastLoginOk"));
    return;
  }

  // Otherwise, check normal user accounts.
  const match = state.users.find(acc=> acc.username.toLowerCase()===u.toLowerCase() && acc.password===p);
  if(match){
    // Only one active session is allowed per normal user account. Reject
    // this login if a different tab/device already holds the slot.
    const sessions = readUserSessions();
    pruneExpiredUserSessions(sessions);
    const existing = sessions[match.username];
    const myId = getUserSessionId(false);
    if(existing && existing.sessionId !== myId){
      writeUserSessions(sessions);
      err.textContent = "This account is already signed in on another device.";
      err.style.display = "block";
      return;
    }
    const sessionId = getUserSessionId(true);
    sessions[match.username] = { sessionId, loginAt: existing ? existing.loginAt : Date.now(), lastSeen: Date.now() };
    writeUserSessions(sessions);
    startUserHeartbeat();

    state.user = { signedIn:true, username:match.username };
    state.admin.signedIn = false;
    state.guest.active = false;
    saveUserPersistentSession();
    saveState();
    err.style.display = "none";
    document.getElementById("gateUserUsername").value = ""; document.getElementById("gateUserPassword").value = "";
    hideAuthGate();
    renderAccountSection();
    toast(t("toastUserLoginOk"));
    return;
  }

  err.textContent = "Invalid username or password.";
  err.style.display = "block";
}

/* ---- Continue as Guest (auth gate) ----
   Lets someone browse the catalog without an account. Guests cannot read
   comics, upload, edit/delete, change settings, or use admin tools. */
document.getElementById("guestContinueBtn").addEventListener("click", ()=>{
  state.guest.active = true;
  state.admin.signedIn = false;
  state.user = { signedIn:false, username:null };
  saveState();
  document.getElementById("gateUserError").style.display = "none";
  hideAuthGate();
  renderAccountSection(); applyAdminVisibility(); renderComics();
});

/* ---- Admin: create user accounts (Settings, admin-only) ---- */
// Accounts are persisted in state.users via saveState() (localStorage) —
// they survive page refresh and can be signed into from the Sign In form.
document.getElementById("createUserBtn").addEventListener("click", ()=>{
  if(!state.admin.signedIn) return;
  const uInput = document.getElementById("newUserUsername");
  const pInput = document.getElementById("newUserPassword");
  const err = document.getElementById("newUserError");
  const u = uInput.value.trim();
  const p = pInput.value;
  if(!u || !p){
    err.textContent = "Please enter both a username and a password.";
    err.style.display = "block";
    return;
  }
  const duplicate = state.users.some(acc=> acc.username.toLowerCase()===u.toLowerCase());
  if(duplicate){
    err.textContent = "That username already exists. Choose a different one.";
    err.style.display = "block";
    return;
  }
  state.users.push({ username:u, password:p });
  saveState();
  err.style.display = "none";
  uInput.value = ""; pInput.value = "";
  renderAdminUserList();
  toast("User account created");
});

/* ============================================================
   9. COMIC UPLOAD / EDIT / DELETE (admin-only)
   ============================================================ */
const editorOverlay = document.getElementById("editorOverlay");
let editingId = null;
let pendingCover = null, pendingPages = null;

document.getElementById("openUploadBtn").addEventListener("click", ()=> openEditor(null));
document.getElementById("editorClose").addEventListener("click", ()=> closeSheet(editorOverlay));
editorOverlay.addEventListener("click", e=>{ if(e.target===editorOverlay) closeSheet(editorOverlay); });

function openEditor(id){
  if(!state.admin.signedIn) return;
  editingId = id;
  pendingCover = null; pendingPages = null;
  const heading = document.getElementById("editorHeading");
  if(id){
    const c = state.comics.find(x=>x.id===id);
    heading.textContent = t("editorHeadingEdit");
    document.getElementById("editTitle").value = c.title;
    document.getElementById("editVolume").value = c.volume;
    document.getElementById("editIssue").value = c.issue;
  } else {
    heading.textContent = t("editorHeadingUpload");
    document.getElementById("editTitle").value = "";
    document.getElementById("editVolume").value = "";
    document.getElementById("editIssue").value = "";
  }
  document.getElementById("editCoverInput").value = "";
  document.getElementById("editPagesInput").value = "";
  openSheet(editorOverlay);
}

document.getElementById("editCoverInput").addEventListener("change", async e=>{
  const f = e.target.files[0]; if(!f) return;
  pendingCover = await fileToDataURL(f, 700);
});
document.getElementById("editPagesInput").addEventListener("change", async e=>{
  const files = Array.from(e.target.files); if(!files.length) return;
  pendingPages = await Promise.all(files.map(f=> fileToDataURL(f, 1600)));
});

function fileToDataURL(file, maxDim){
  return new Promise((resolve,reject)=>{
    const reader = new FileReader();
    reader.onload = ()=>{
      const img = new Image();
      img.onload = ()=>{
        let {width,height} = img;
        if(width>maxDim || height>maxDim){
          const ratio = Math.min(maxDim/width, maxDim/height);
          width*=ratio; height*=ratio;
        }
        const canvas = document.createElement("canvas");
        canvas.width=width; canvas.height=height;
        canvas.getContext("2d").drawImage(img,0,0,width,height);
        resolve(canvas.toDataURL("image/jpeg", 0.82));
      };
      img.onerror = reject;
      img.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("editorSave").addEventListener("click", async ()=>{
  const title = document.getElementById("editTitle").value.trim();
  const volume = document.getElementById("editVolume").value.trim() || "1";
  const issue = document.getElementById("editIssue").value.trim() || "1";

  if(editingId){
    const c = state.comics.find(x=>x.id===editingId);
    if(!title){ toast(t("toastFillFields")); return; }
    
    // Update via API if available
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (token) {
      const updateData = {
        id: editingId,
        title, volume, issue,
        cover_url: pendingCover || c.cover,
        pages: pendingPages ? pendingPages.map((p, i) => ({ number: i + 1, url: p })) : c.pages
      };
      await apiCall(`/api/admin/comics/${editingId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      });
    }
    
    c.title=title; c.volume=volume; c.issue=issue;
    if(pendingCover) c.cover = pendingCover;
    if(pendingPages && pendingPages.length) c.pages = pendingPages;
  } else {
    if(!title || !pendingPages || !pendingPages.length){ toast(t("toastFillFields")); return; }
    const id = "c_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);
    const newComic = {
      id, title, volume, issue,
      cover: pendingCover || pendingPages[0],
      pages: pendingPages,
      createdAt: Date.now(),
      views: 0
    };
    
    // Create via API if available
    const token = localStorage.getItem(API_TOKEN_KEY);
    if (token) {
      await apiCall('/api/admin/comics', {
        method: 'POST',
        body: JSON.stringify({
          id,
          title,
          description: '',
          cover_url: newComic.cover,
          pages: pendingPages.map((p, i) => ({ number: i + 1, url: p })),
          author: 'Admin',
          genres: []
        })
      });
    }
    
    state.comics.unshift(newComic);
  }
  saveState();
  closeSheet(editorOverlay);
  renderComics(); renderHome();
  toast(t("toastSaved"));
});

async function deleteComic(id){
  if(!state.admin.signedIn) return;
  
  // Delete via API if available
  const token = localStorage.getItem(API_TOKEN_KEY);
  if (token) {
    await apiCall(`/api/admin/comics/${id}`, {
      method: 'DELETE'
    });
  }
  
  state.comics = state.comics.filter(c=>c.id!==id);
  delete state.progress[id];
  saveState(); renderComics(); renderHome();
  toast(t("toastDeleted"));
}

/* ============================================================
   10. TOAST
   ============================================================ */
let toastTimer=null;
function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=> el.classList.remove("show"), 2200);
}

/* ============================================================
   11. READER
   ============================================================ */
const reader = document.getElementById("reader");
const readerTrack = document.getElementById("readerTrack");
const readerStage = document.getElementById("readerStage");
let currentComic = null, currentPage = 0, zoomScale = 1, uiHideTimer=null;
let dragStartX=0, dragging=false, dragDelta=0;
let pinchStartDist=0, pinchStartScale=1;

function openReader(id){
  if(blockIfGuestRead()) return;
  currentComic = state.comics.find(c=>c.id===id);
  if(!currentComic) return;
  currentComic.views = (currentComic.views||0)+1;
  saveState();
  const saved = state.progress[id];
  currentPage = (state.settings.remember && saved) ? Math.min(saved.page, currentComic.pages.length-1) : 0;
  document.getElementById("readerTitle").textContent = currentComic.title;
  buildReaderTrack();
  goToPage(currentPage, false);
  reader.classList.add("open");
  document.body.style.overflow="hidden";
  scheduleUiHide();
}
function closeReader(){
  reader.classList.remove("open");
  document.body.style.overflow="";
  clearTimeout(uiHideTimer);
  renderHome();
  renderComics();
}
document.getElementById("readerClose").addEventListener("click", closeReader);

function buildReaderTrack(){
  readerTrack.innerHTML = "";
  readerTrack.style.transition = "none";
  const rtl = state.settings.rtl;
  const pages = rtl ? [...currentComic.pages].reverse() : currentComic.pages;
  pages.forEach((src)=>{
    const slot = document.createElement("div");
    slot.className = "reader-page-slot";
    const img = document.createElement("img");
    img.loading = "lazy"; img.src = src; img.alt="";
    img.style.objectFit = state.settings.fit==="width" ? "contain" : "contain";
    slot.appendChild(img);
    readerTrack.appendChild(slot);
  });
}

function goToPage(index, animate=true){
  const total = currentComic.pages.length;
  currentPage = Math.max(0, Math.min(index, total-1));
  const rtl = state.settings.rtl;
  const displayIndex = rtl ? (total-1-currentPage) : currentPage;
  readerTrack.style.transition = animate ? "transform .32s cubic-bezier(.4,0,.2,1)" : "none";
  readerTrack.style.transform = `translateX(${rtl?1:-1 * 0}px)`; // reset baseline before applying
  readerTrack.style.transform = `translateX(${-displayIndex*100}%)`;
  resetZoom();
  document.getElementById("readerPageCount").textContent = `${currentPage+1} / ${total}`;
  document.getElementById("readerProgressFill").style.width = `${((currentPage+1)/total)*100}%`;
  state.progress[currentComic.id] = { page:currentPage, total, updatedAt:Date.now() };
  saveState();
  
  // Sync progress to API if authenticated
  const token = localStorage.getItem(API_TOKEN_KEY);
  if (token && currentComic.id) {
    apiCall(`/api/progress/${currentComic.id}`, {
      method: 'POST',
      body: JSON.stringify({ page: currentPage, total })
    }).catch(err => console.log('Progress sync error:', err));
  }
}
document.getElementById("readerPrev").addEventListener("click", ()=> goToPage(currentPage-1));
document.getElementById("readerNext").addEventListener("click", ()=> goToPage(currentPage+1));

/* Tap zones + swipe on stage */
readerStage.addEventListener("pointerdown", e=>{
  dragging = true; dragStartX = e.clientX; dragDelta = 0;
  readerStage.setPointerCapture(e.pointerId);
});
readerStage.addEventListener("pointermove", e=>{
  if(!dragging || zoomScale>1) return;
  dragDelta = e.clientX - dragStartX;
});
readerStage.addEventListener("pointerup", e=>{
  if(!dragging) return; dragging=false;
  if(zoomScale>1){ toggleUi(); return; }
  const stageWidth = readerStage.clientWidth;
  if(Math.abs(dragDelta) > stageWidth*0.15){
    const rtl = state.settings.rtl;
    if(dragDelta<0) goToPage(currentPage + (rtl?-1:1));
    else goToPage(currentPage - (rtl?-1:1));
  } else if(Math.abs(dragDelta) < 6){
    // simple tap: left third = prev, right third = next, middle = toggle UI
    const x = e.clientX - readerStage.getBoundingClientRect().left;
    if(x < stageWidth*0.28) goToPage(currentPage-1);
    else if(x > stageWidth*0.72) goToPage(currentPage+1);
    else toggleUi();
  }
  dragDelta = 0;
});

/* Pinch zoom (mobile) */
readerStage.addEventListener("touchstart", e=>{
  if(e.touches.length===2){
    pinchStartDist = touchDist(e.touches);
    pinchStartScale = zoomScale;
  }
}, {passive:true});
readerStage.addEventListener("touchmove", e=>{
  if(e.touches.length===2){
    e.preventDefault();
    const dist = touchDist(e.touches);
    const scale = Math.max(1, Math.min(3.5, pinchStartScale * (dist/pinchStartDist)));
    zoomScale = scale;
    applyZoom();
  }
}, {passive:false});
function touchDist(t){ return Math.hypot(t[0].clientX-t[1].clientX, t[0].clientY-t[1].clientY); }
function applyZoom(){
  const activeImg = readerTrack.querySelectorAll(".reader-page-slot")[state.settings.rtl ? currentComic.pages.length-1-currentPage : currentPage]?.querySelector("img");
  if(activeImg) activeImg.style.transform = `scale(${zoomScale})`;
}
function resetZoom(){ zoomScale=1; applyZoom(); }

/* Wheel zoom (desktop, ctrl+wheel) */
readerStage.addEventListener("wheel", e=>{
  if(!e.ctrlKey) return;
  e.preventDefault();
  zoomScale = Math.max(1, Math.min(3.5, zoomScale - e.deltaY*0.0015));
  applyZoom();
}, {passive:false});

/* Double-tap/click to zoom */
let lastTap=0;
readerStage.addEventListener("dblclick", ()=>{ zoomScale = zoomScale>1 ? 1 : 2; applyZoom(); });

/* Fullscreen */
document.getElementById("readerFullscreen").addEventListener("click", ()=>{
  if(!document.fullscreenElement){ reader.requestFullscreen?.().catch(()=>{}); }
  else { document.exitFullscreen?.(); }
});

/* UI auto-hide */
function scheduleUiHide(){
  clearTimeout(uiHideTimer);
  uiHideTimer = setTimeout(()=> reader.classList.add("ui-hidden"), 3200);
}
function toggleUi(){
  reader.classList.toggle("ui-hidden");
  if(!reader.classList.contains("ui-hidden")) scheduleUiHide();
}

/* Keyboard shortcuts */
document.addEventListener("keydown", e=>{
  if(!reader.classList.contains("open")) return;
  const rtl = state.settings.rtl;
  if(e.key==="ArrowRight") goToPage(currentPage + (rtl?-1:1));
  else if(e.key==="ArrowLeft") goToPage(currentPage - (rtl?-1:1));
  else if(e.key==="Escape") closeReader();
  else if(e.key==="f" || e.key==="F") document.getElementById("readerFullscreen").click();
  else if(e.key==="+" ) { zoomScale=Math.min(3.5,zoomScale+0.25); applyZoom(); }
  else if(e.key==="-" ) { zoomScale=Math.max(1,zoomScale-0.25); applyZoom(); }
});

/* ============================================================
   12. DOWNLOAD / COPY PROTECTION (deterrence, not prevention)
   ============================================================ */
document.addEventListener("contextmenu", e=> e.preventDefault());
document.addEventListener("dragstart", e=> e.preventDefault());
document.addEventListener("selectstart", e=>{
  // allow selection inside text inputs/textareas, block elsewhere (esp. comic images)
  const tag = (e.target.tagName||"").toLowerCase();
  if(tag!=="input" && tag!=="textarea") e.preventDefault();
});
document.addEventListener("keydown", e=>{
  const k = e.key.toLowerCase();
  const blockCombo =
    (e.ctrlKey || e.metaKey) && (k==="s" || k==="u" || k==="p") ||
    (e.ctrlKey && e.shiftKey && (k==="i" || k==="j" || k==="c")) ||
    k==="f12";
  if(blockCombo) e.preventDefault();
});

/* ============================================================
   13. LOADING SCREEN SEQUENCE
   ============================================================ */
function runLoadingSequence(){
  const fill = document.getElementById("loadingBarFill");
  const DURATION = 1750; // loading screen must stay visible for exactly 1.75s
  const startTime = Date.now();
  const iv = setInterval(()=>{
    const elapsed = Date.now() - startTime;
    const pct = Math.min(100, (elapsed/DURATION)*100);
    fill.style.width = pct+"%";
    if(elapsed>=DURATION) clearInterval(iv);
  }, 130);
  setTimeout(()=>{
    clearInterval(iv);
    fill.style.width = "100%";
    document.getElementById("loading-screen").classList.add("hidden");
  }, DURATION);
}

/* ============================================================
   14. INIT
   ============================================================ */
async function init(){
  document.getElementById("loadingLogoImg").src = state.logo;
  document.getElementById("aboutLogoImg").src = state.logo;
  document.getElementById("authLogoImg").src = state.logo;

  // Attempt to restore persistent sessions before showing auth gate
  const userRestored = restoreUserPersistentSession();
  const adminRestored = restoreAdminPersistentSession();
  
  // Sync session state after restoration attempt
  syncAdminSessionState();
  syncUserSessionState();
  
  // Sync comics from API
  const apiSyncSuccess = await syncComicsFromAPI();
  if (!apiSyncSuccess && state.comics.length === 0) {
    // Fallback to local comics if API fails
    console.log('API sync failed, using local comics');
  }
  
  if(canBrowse()) hideAuthGate();

  // sync settings UI from state
  document.querySelectorAll("#langSeg button").forEach(b=> b.classList.toggle("active", b.dataset.lang===state.settings.lang));
  document.querySelectorAll("#themeSeg button").forEach(b=> b.classList.toggle("active", b.dataset.theme===state.settings.theme));
  document.querySelectorAll("#fitSeg button").forEach(b=> b.classList.toggle("active", b.dataset.fit===state.settings.fit));
  document.querySelectorAll("#dirSeg button").forEach(b=> b.classList.toggle("active", (b.dataset.rtl==="1")===state.settings.rtl));
  document.getElementById("animToggle").checked = state.settings.animations;
  document.getElementById("rememberToggle").checked = state.settings.remember;

  renderAccentSwatches();
  applyTheme();
  applyI18n();
  applyAdminVisibility();
  renderComics();
  renderHome();

  // try to extract accent from logo once loaded (uses default gradient logo if none uploaded)
  const logoImg = document.getElementById("aboutLogoImg");
  if(logoImg.complete) extractDominantAccent(logoImg);
  else logoImg.addEventListener("load", ()=> extractDominantAccent(logoImg), {once:true});

  runLoadingSequence();
}

document.addEventListener("DOMContentLoaded", init);
})();
