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
  count.textContent = `${total} produit${total > 1 ? "s" : ""} à découvrir`;
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
