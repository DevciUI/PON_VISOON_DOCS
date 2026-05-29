const mediaSrc = "assets/pon-placeholder.svg";
const variantNav = document.getElementById("variantNav");
const variantsDocument = document.getElementById("variantsDocument");
let variantsData = [];

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTags(tags) {
  return (tags || []).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("");
}

function renderParagraphs(lines) {
  return (lines || []).map((line) => `<p>${escapeHtml(line)}</p>`).join("");
}

function renderVideo(label = "заглушка") {
  return `<div class="media-frame">
    <img src="${mediaSrc}" alt="${escapeHtml(label)}">
  </div>`;
}

function renderFeatures(features) {
  return (features || [])
    .map(
      (feature) => `<section class="feature-row">
        <div>
          <h4>${escapeHtml(feature.title)}</h4>
          <p>${escapeHtml(feature.body)}</p>
        </div>
        ${renderVideo("заглушка")}
      </section>`
    )
    .join("");
}

function renderFeatureList(items) {
  return (items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
}

function renderAfter(lines) {
  if (!lines || !lines.length) return "";
  return `<section class="after-block">${renderParagraphs(lines)}</section>`;
}

function renderVariant(variant, index) {
  const number = String(index + 1).padStart(2, "0");
  const author = variant.author || "by Devci";
  return `<article id="${escapeHtml(variant.id)}" class="page variant-page">
    <header class="variant-header">
      <div>
        <p class="eyebrow">описание P.O.N.</p>
        <h2>Вариант ${number}</h2>
      </div>
      <span class="author">${escapeHtml(author)}</span>
    </header>

    <section class="hero">
      <div>
        <p class="section-label">короткое описание</p>
        <p class="short-copy">${escapeHtml(variant.short)}</p>
        <div class="tags">${renderTags(variant.tags)}</div>
      </div>
      ${renderVideo()}
    </section>

    <section class="body-grid">
      <div class="main-copy">
        <h3>${escapeHtml(variant.aboutTitle || "Об этой игре")}</h3>
        ${renderParagraphs(variant.about)}
        <div class="feature-list-mobile">
          <h4>Особенности</h4>
          <ul>${renderFeatureList(variant.featureList)}</ul>
        </div>
        <div class="feature-blocks">${renderFeatures(variant.features)}</div>
        ${renderAfter(variant.after)}
      </div>
      <aside class="feature-list">
        <h4>Особенности</h4>
        <ul>${renderFeatureList(variant.featureList)}</ul>
      </aside>
    </section>
  </article>`;
}

function render(data) {
  const variants = data.variants || [];
  variantsData = variants;
  variantNav.innerHTML = variants
    .map(
      (variant, index) => `<button class="variant-tab" type="button" data-id="${escapeHtml(variant.id)}">
        <span>${String(index + 1).padStart(2, "0")}</span>
        <strong>Вариант ${String(index + 1).padStart(2, "0")}</strong>
        <em>${escapeHtml(variant.author || "by Devci")}</em>
      </button>`
    )
    .join("");

  variantsDocument.innerHTML = variants.map(renderVariant).join("");
  document.body.classList.add("loaded");
  const hashId = window.location.hash.replace(/^#/, "");
  selectVariant(variants.some((variant) => variant.id === hashId) ? hashId : variants[0]?.id, false);
  window.scrollTo(0, 0);
}

function selectVariant(id, updateHash = true) {
  if (!id) return;
  document.querySelectorAll(".variant-page").forEach((page) => {
    page.classList.toggle("active", page.id === id);
  });
  document.querySelectorAll(".variant-tab").forEach((button) => {
    button.classList.toggle("active", button.dataset.id === id);
  });
  if (updateHash) {
    history.replaceState(null, "", `#${id}`);
  }
}

variantNav.addEventListener("click", (event) => {
  const button = event.target.closest(".variant-tab");
  if (!button) return;
  selectVariant(button.dataset.id);
});

window.addEventListener("hashchange", () => {
  const hashId = window.location.hash.replace(/^#/, "");
  if (variantsData.some((variant) => variant.id === hashId)) {
    selectVariant(hashId, false);
  }
});

fetch("variants.json")
  .then((response) => response.json())
  .then(render)
  .catch((error) => {
    variantsDocument.innerHTML = `<section class="page"><p class="loading">Не удалось загрузить variants.json: ${escapeHtml(error.message)}</p></section>`;
  });
