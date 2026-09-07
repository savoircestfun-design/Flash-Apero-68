"use strict";

const menuButton = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
const mobileQuery = window.matchMedia("(max-width: 700px)");

function setMenu(open, restoreFocus = false) {
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute(
    "aria-label",
    open ? "Fermer le menu" : "Ouvrir le menu",
  );
  navigation.classList.toggle("open", open);
  document.body.classList.toggle("menu-open", open);
  if (restoreFocus) menuButton.focus();
}

menuButton.addEventListener("click", () =>
  setMenu(menuButton.getAttribute("aria-expanded") !== "true"),
);
document.addEventListener("keydown", (event) => {
  if (menuButton.getAttribute("aria-expanded") !== "true") return;
  if (event.key === "Escape") {
    setMenu(false, true);
    return;
  }
  if (event.key === "Tab" && mobileQuery.matches) {
    const links = [...navigation.querySelectorAll("a")];
    const first = menuButton;
    const last = links.at(-1);
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});
mobileQuery.addEventListener("change", () => setMenu(false));

const filters = [...document.querySelectorAll("[data-filter]")];
const categories = [...document.querySelectorAll("[data-category]")];
const count = document.querySelector(".catalogue-count");
const allowedFilters = new Set(filters.map((button) => button.dataset.filter));

function filterCatalogue(value) {
  if (!allowedFilters.has(value)) return;
  filters.forEach((button) => {
    const active = button.dataset.filter === value;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  let total = 0;
  categories.forEach((section) => {
    section.hidden = value !== "all" && value !== section.dataset.category;
    if (!section.hidden)
      total += section.querySelectorAll(".product-card").length;
  });
  count.textContent = `${total} produits à découvrir`;
}

document.querySelector(".filters").hidden = false;
filters.forEach((button) =>
  button.addEventListener("click", () =>
    filterCatalogue(button.dataset.filter),
  ),
);

function revealAnchor(hash) {
  const target = document.getElementById(hash.slice(1));
  if (!target) return;
  if (
    hash === "#produits" ||
    hash === "#snacks" ||
    target.closest("[data-category]")
  )
    filterCatalogue("all");
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", () => {
    const hash = link.getAttribute("href");
    revealAnchor(hash);
    if (navigation.contains(link) && mobileQuery.matches) {
      setMenu(false);
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.focus({ preventScroll: true });
        target.addEventListener(
          "blur",
          () => target.removeAttribute("tabindex"),
          { once: true },
        );
      }
    }
  });
});
window.addEventListener("hashchange", () => revealAnchor(location.hash));
window.addEventListener("popstate", () => revealAnchor(location.hash));
revealAnchor(location.hash);

// La liste reste consultable avec les accordéons natifs sans JavaScript.
const townInput = document.querySelector("#town-search");
const townGroups = [...document.querySelectorAll(".town-group")];
const townItems = [...document.querySelectorAll(".town-item")];
const townClear = document.querySelector(".town-clear");
const townResults = document.querySelector(".town-results");
const townEmpty = document.querySelector(".town-empty");
const normalizeTown = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .replace(/[^a-z0-9]/g, "");
const townIndex = new Map(
  townItems.map((item) => [item, normalizeTown(item.dataset.search)]),
);
let previousTownState = null;

function searchTowns() {
  const query = normalizeTown(townInput.value);
  if (query && !previousTownState)
    previousTownState = townGroups.map((group) => group.open);
  let matches = 0;
  townItems.forEach((item) => {
    item.hidden = Boolean(query) && !townIndex.get(item).includes(query);
    if (!item.hidden) matches++;
  });
  townGroups.forEach((group, index) => {
    const total = group.querySelectorAll(".town-item:not([hidden])").length;
    group.hidden = total === 0;
    group.querySelector(".town-group-count").textContent =
      `${total} commune${total > 1 ? "s" : ""}`;
    if (query) group.open = total > 0;
    else if (previousTownState) group.open = previousTownState[index];
  });
  if (!query) previousTownState = null;
  townResults.textContent = query
    ? `${matches} commune${matches > 1 ? "s" : ""} trouvée${matches > 1 ? "s" : ""}`
    : `${townItems.length} communes · liste alphabétique`;
  townClear.hidden = townInput.value.length === 0;
  townEmpty.hidden = matches !== 0;
}
document.querySelector(".town-search").hidden = false;
townInput.addEventListener("input", searchTowns);
townInput.addEventListener("search", searchTowns);
townClear.addEventListener("click", () => {
  townInput.value = "";
  searchTowns();
  townInput.focus();
});
townInput.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && townInput.value) {
    event.preventDefault();
    townClear.click();
  }
});

// A missing photo never hides a product name, size or price.
document.querySelectorAll(".product-image img").forEach((img) => {
  const replace = () => {
    const frame = img.closest(".product-image");
    const name = img.closest(".product-card").querySelector("h4").textContent;
    frame.classList.add("no-photo");
    const brand = document.createElement("span");
    brand.textContent = name;
    frame.replaceChildren(brand);
  };
  img.addEventListener("error", replace, { once: true });
  if (img.complete && img.naturalWidth === 0) replace();
});
