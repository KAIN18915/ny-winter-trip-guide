(function () {
  function applyFilters(gridId, searchId, cityId, catId) {
    const grid = document.getElementById(gridId);
    const q = (document.getElementById(searchId)?.value || "").toLowerCase();
    const city = document.getElementById(cityId)?.value || "all";
    const cat = document.getElementById(catId)?.value || "all";
    grid.querySelectorAll("[data-card]").forEach((card) => {
      const text = card.textContent.toLowerCase();
      const c = card.dataset.city || "";
      const k = card.dataset.category || card.dataset.area || "all";
      const price = parseFloat(card.dataset.price || "99999");
      const max = parseFloat(document.getElementById("price-max")?.value || "99999");
      const show =
        text.includes(q) &&
        (city === "all" || c === city) &&
        (cat === "all" || k === cat) &&
        price <= max;
      card.hidden = !show;
    });
  }

  function wire(gridId, searchId, cityId, catId) {
    ["input", "change"].forEach((ev) => {
      [searchId, cityId, catId, "price-max"].forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener(ev, () => applyFilters(gridId, searchId, cityId, catId));
      });
    });
  }

  document.querySelectorAll("[data-filter-grid]").forEach((el) => {
    wire(el.dataset.filterGrid, el.dataset.filterSearch, el.dataset.filterCity, el.dataset.filterCat);
    applyFilters(el.dataset.filterGrid, el.dataset.filterSearch, el.dataset.filterCity, el.dataset.filterCat);
  });
})();
