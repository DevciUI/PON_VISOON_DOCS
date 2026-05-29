const search = document.getElementById("search");
const cards = Array.from(document.querySelectorAll(".shot-card"));
const countNode = document.getElementById("visibleCount");
function applySearch() {
  const query = search.value.trim().toLowerCase();
  let visible = 0;
  for (const card of cards) {
    const hidden = Boolean(query && !card.dataset.text.includes(query));
    card.hidden = hidden;
    if (!hidden) visible++;
  }
  if (countNode) countNode.textContent = String(visible);
}
search.addEventListener("input", applySearch);
applySearch();
