const docs = window.DOCS;
const byId = Object.fromEntries(docs.map((doc) => [doc.id, doc]));
const folders = Array.from(document.querySelectorAll(".os-folder"));
const title = document.getElementById("docTitle");
const eyebrow = document.getElementById("docEyebrow");
const summary = document.getElementById("docSummary");
const frame = document.getElementById("pdfFrame");
const openPdf = document.getElementById("openPdf");
const openSource = document.getElementById("openSource");
const docWindow = document.getElementById("docWindow");
const closeWindow = document.getElementById("closeWindow");
const notice = document.getElementById("notice");
const accessState = document.getElementById("accessState");
const accessMessage = document.getElementById("accessMessage");
const accessChip = document.getElementById("accessChip");
const readGate = document.getElementById("readGate");
const readGateTitle = document.getElementById("readGateTitle");
const readGateText = document.getElementById("readGateText");
const readProgress = document.getElementById("readProgress");
const markRead = document.getElementById("markRead");
const teamVacGate = document.getElementById("teamVacGate");
const teamVacForm = document.getElementById("teamVacForm");
const teamVacCode = document.getElementById("teamVacCode");
const teamVacError = document.getElementById("teamVacError");
const fullscreenToggle = document.getElementById("fullscreenToggle");

const TEAMVAC_CODE = "TeamVAC";
const TEAMVAC_STORAGE_KEY = "pon-teamvac-access-v1";
const STORAGE_KEY = "pon-origin-read-complete-v1";
if (new URLSearchParams(window.location.search).has("resetAccess")) {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(TEAMVAC_STORAGE_KEY);
}
let originComplete = localStorage.getItem(STORAGE_KEY) === "1";
let currentDocId = "";
let noticeTimer = 0;
let originCleanup = null;

function requestFullscreenMode() {
  if (document.fullscreenElement || !document.documentElement.requestFullscreen) return;
  document.documentElement.requestFullscreen().catch(() => {});
}

function updateFullscreenButton() {
  if (!fullscreenToggle) return;
  fullscreenToggle.textContent = document.fullscreenElement ? "×" : "⛶";
  fullscreenToggle.title = document.fullscreenElement ? "Выйти из полного экрана" : "Полный экран";
  fullscreenToggle.setAttribute("aria-label", fullscreenToggle.title);
}

function unlockTeamVacGate(enterFullscreen = false) {
  sessionStorage.setItem(TEAMVAC_STORAGE_KEY, "1");
  document.body.classList.remove("locked-by-gate");
  if (teamVacGate) teamVacGate.hidden = true;
  if (enterFullscreen) requestFullscreenMode();
}

function lockTeamVacGate() {
  document.body.classList.add("locked-by-gate");
  if (teamVacGate) teamVacGate.hidden = false;
  window.requestAnimationFrame(() => {
    if (teamVacCode) teamVacCode.focus();
  });
}

function handleTeamVacSubmit(event) {
  event.preventDefault();
  const value = teamVacCode.value.trim();
  if (value === TEAMVAC_CODE) {
    teamVacError.textContent = "";
    unlockTeamVacGate(true);
    return;
  }

  teamVacCode.value = "";
  teamVacError.textContent = "Неверный код";
  teamVacForm.classList.remove("shake");
  void teamVacForm.offsetWidth;
  teamVacForm.classList.add("shake");
  teamVacCode.focus();
}

function requiresOrigin(id) {
  return id !== "pon-origin";
}

function showNotice(text) {
  notice.textContent = text;
  window.clearTimeout(noticeTimer);
  noticeTimer = window.setTimeout(() => {
    notice.textContent = "";
  }, 4200);
}

function setProgress(percent) {
  const value = Math.max(0, Math.min(100, Math.round(percent)));
  readProgress.style.width = value + "%";
  readGateText.textContent = "Прогресс чтения: " + value + "%";
}

function highlightRequiredFolder() {
  const originFolder = folders.find((folder) => folder.dataset.doc === "pon-origin");
  if (!originFolder) return;
  originFolder.classList.add("attention");
  window.setTimeout(() => originFolder.classList.remove("attention"), 900);
}

function setWindowMode(docId) {
  const isOrigin = docId === "pon-origin";
  docWindow.classList.toggle("origin-mode", isOrigin);
  docWindow.classList.toggle("reader-mode", docId === "pon-vision");
  readGate.hidden = !isOrigin;
}

function applyAccessState() {
  document.body.classList.toggle("access-open", originComplete);
  accessState.textContent = originComplete ? "доступ открыт" : "доступ ограничен";
  accessChip.textContent = originComplete ? "открыто" : "этап 01";
  accessMessage.textContent = originComplete
    ? "Раздел «Начало P.O.N.» прочитан. Теперь можно открыть основной вижен-документ, варианты описания и базу референсов."
    : "Чтобы открыть вижен-документ, варианты описания и получить доступ к референсам, сначала прочитайте весь раздел «Начало P.O.N.»: переписку Devci и Mars. После этого остальные папки разблокируются.";

  folders.forEach((folder) => {
    const locked = folder.dataset.requiresOrigin === "true" && !originComplete;
    folder.classList.toggle("locked", locked);
    folder.dataset.locked = locked ? "true" : "false";
  });
}

function completeOriginRead() {
  if (originComplete) return;
  originComplete = true;
  localStorage.setItem(STORAGE_KEY, "1");
  applyAccessState();
  setProgress(100);
  markRead.disabled = false;
  markRead.textContent = "открыть вижен";
  readGateTitle.textContent = "Доступ открыт";
    readGateText.textContent = "Теперь можно открыть «Вижен P.O.N.», варианты описания и «Базу P.O.N.»";
  showNotice("Доступ открыт: вижен-документ и база референсов разблокированы.");
}

function clearOriginTracker() {
  if (originCleanup) {
    originCleanup();
    originCleanup = null;
  }
}

function bindOriginProgress() {
  clearOriginTracker();
  if (currentDocId !== "pon-origin") {
    docWindow.classList.remove("origin-mode");
    readGate.hidden = true;
    return;
  }

  setWindowMode("pon-origin");
  if (originComplete) {
    setProgress(100);
    markRead.disabled = false;
    markRead.textContent = "открыть вижен";
    readGateTitle.textContent = "Доступ открыт";
    readGateText.textContent = "Можно переходить к основному вижен-документу, вариантам описания и базе.";
    return;
  }

  readGateTitle.textContent = "Прочитайте раздел до конца";
  markRead.disabled = true;
  markRead.textContent = "доскролльте до конца";
  setProgress(0);

  try {
    const win = frame.contentWindow;
    const doc = frame.contentDocument;
    const scroller = doc.scrollingElement || doc.documentElement || doc.body;
    const update = () => {
      const max = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      const percent = Math.min(100, (scroller.scrollTop / max) * 100);
      setProgress(percent);
      if (percent >= 96 && !originComplete) {
        completeOriginRead();
      }
    };
    win.addEventListener("scroll", update, { passive: true });
    scroller.addEventListener("scroll", update, { passive: true });
    originCleanup = () => {
      win.removeEventListener("scroll", update);
      scroller.removeEventListener("scroll", update);
    };
    update();
  } catch (error) {
    readGateTitle.textContent = "Проверка прокрутки недоступна";
    readGateText.textContent = "После чтения раздела подтвердите вручную.";
    markRead.disabled = false;
    markRead.textContent = "подтвердить прочтение";
  }
}

function selectDoc(id, hash = "") {
  const doc = byId[id] || docs[0];

  if (requiresOrigin(doc.id) && !originComplete) {
    showNotice("Папка закрыта. Сначала откройте и прочитайте «Начало P.O.N.» до конца.");
    highlightRequiredFolder();
    return;
  }

  clearOriginTracker();
  currentDocId = doc.id;
  folders.forEach((folder) => folder.classList.toggle("active", folder.dataset.doc === doc.id));
  title.textContent = doc.title;
  eyebrow.textContent = doc.eyebrow;
  summary.textContent = doc.summary;
  docWindow.hidden = false;
  setWindowMode(doc.id);
  frame.removeAttribute("src");
  window.requestAnimationFrame(() => {
    frame.src = doc.view + (hash || "");
  });
  openPdf.href = doc.primary || doc.view;
  openPdf.textContent = doc.primaryLabel || "ОТКРЫТЬ";
  if (doc.source) {
    openSource.hidden = false;
    openSource.href = doc.source;
    openSource.textContent = doc.sourceLabel || "ИСХ";
  } else {
    openSource.hidden = true;
    openSource.removeAttribute("href");
  }
}

window.selectDoc = selectDoc;

folders.forEach((folder) => {
  folder.addEventListener("click", () => {
    if (folder.dataset.locked === "true") {
      showNotice("Папка закрыта. Сначала прочитайте «Начало P.O.N.» до конца.");
      highlightRequiredFolder();
      return;
    }
    selectDoc(folder.dataset.doc);
  });
});

frame.addEventListener("load", bindOriginProgress);
window.addEventListener("message", (event) => {
  const data = event.data || {};
  if (currentDocId !== "pon-origin") return;
  if (data.type === "pon-origin-progress" && typeof data.percent === "number" && !originComplete) {
    setProgress(data.percent);
  }
  if (data.type === "pon-origin-complete") {
    completeOriginRead();
  }
});
markRead.addEventListener("click", () => {
  if (originComplete && currentDocId === "pon-origin") {
    selectDoc("pon-vision");
    return;
  }
  completeOriginRead();
});
closeWindow.addEventListener("click", () => {
  docWindow.hidden = true;
  frame.removeAttribute("src");
  currentDocId = "";
  clearOriginTracker();
  docWindow.classList.remove("origin-mode");
  docWindow.classList.remove("reader-mode");
  readGate.hidden = true;
  folders.forEach((folder) => folder.classList.remove("active"));
});

if (teamVacForm) {
  teamVacForm.addEventListener("submit", handleTeamVacSubmit);
}

if (fullscreenToggle) {
  fullscreenToggle.addEventListener("click", () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      requestFullscreenMode();
    }
  });
  document.addEventListener("fullscreenchange", updateFullscreenButton);
  updateFullscreenButton();
}

if (sessionStorage.getItem(TEAMVAC_STORAGE_KEY) === "1") {
  unlockTeamVacGate(false);
} else {
  lockTeamVacGate();
}

applyAccessState();
