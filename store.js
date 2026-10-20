"use strict";

// Shared data + helpers for index.html (products) and categories.html.

const PRODUCTS_KEY = "gujarati_inventory_v1";
const CATEGORIES_KEY = "gujarati_categories_v1";

const SAVE_ERROR = "ડેટા સેવ થઈ શક્યો નથી. બ્રાઉઝરની સ્ટોરેજ સેટિંગ તપાસો.";

// Each product is counted either by weight or by pieces.
const UNITS = {
  kg: { label: "વજન (કિગ્રા.)", short: "કિગ્રા.", step: "0.001" },
  piece: { label: "નંગ", short: "નંગ", step: "1" }
};

const $ = (id) => document.getElementById(id);

const EDIT_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>';

const DELETE_ICON =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/></svg>';

// Dummy data: first run only.
const demoCategories = [
  { id: 1, name: "અનાજ", unit: "kg" },
  { id: 2, name: "કઠોળ", unit: "kg" },
  { id: 3, name: "મસાલા", unit: "kg" },
  { id: 4, name: "તેલ", unit: "piece" },
  { id: 5, name: "ખાદ્ય પદાર્થ", unit: "kg" },
  { id: 6, name: "અન્ય", unit: "piece" }
];

const demoProducts = [
  {
    id: 1,
    company: "પટેલ ટ્રેડર્સ",
    name: "ઘઉં",
    category: "અનાજ",
    unit: "kg",
    quantity: 250,
    netPrice: 8000
  },
  {
    id: 2,
    company: "શ્રી ગણેશ એન્ટરપ્રાઇઝ",
    name: "ચોખા",
    category: "અનાજ",
    unit: "kg",
    quantity: 100,
    netPrice: 5800
  },
  {
    id: 3,
    company: "અંબિકા ફૂડ્સ",
    name: "તુવેર દાળ",
    category: "કઠોળ",
    unit: "kg",
    quantity: 50,
    netPrice: 6000
  },
  {
    id: 4,
    company: "મહાલક્ષ્મી ટ્રેડર્સ",
    name: "ખાંડ",
    category: "ખાદ્ય પદાર્થ",
    unit: "kg",
    quantity: 150,
    netPrice: 6600
  },
  {
    id: 5,
    company: "જય માતાજી ટ્રેડર્સ",
    name: "જીરું",
    category: "મસાલા",
    unit: "kg",
    quantity: 20,
    netPrice: 9000
  },
  {
    id: 6,
    company: "સૌરાષ્ટ્ર ઓઇલ મિલ",
    name: "મગફળીનું તેલ",
    category: "તેલ",
    unit: "piece",
    quantity: 12,
    netPrice: 9600
  }
];

function cloneList(list) {
  return list.map(item => ({ ...item }));
}

function saveList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (error) {
    console.error("LocalStorage save failed:", error);
    return false;
  }
}

// Saves several lists; if one write fails, the earlier ones are rolled back.
function saveLists(entries) {
  for (let i = 0; i < entries.length; i++) {
    if (!saveList(entries[i].key, entries[i].value)) {
      for (let j = 0; j < i; j++) {
        saveList(entries[j].key, entries[j].previous);
      }
      return false;
    }
  }
  return true;
}

function loadList(key, demo) {
  const savedData = localStorage.getItem(key);

  if (savedData === null) {
    const list = cloneList(demo);
    return saveList(key, list) ? list : [];
  }

  const parsedData = JSON.parse(savedData);

  if (!Array.isArray(parsedData)) {
    throw new Error("Invalid inventory data");
  }

  return parsedData;
}

// Older saved products had both weight and pieces; keep only one.
function normalizeProduct(product) {
  if (UNITS[product.unit] && Number.isFinite(Number(product.quantity))) {
    return product;
  }

  const { weight, pieces, ...rest } = product;
  const byWeight = Number(weight) > 0;

  return {
    ...rest,
    category: rest.category || "અન્ય",
    unit: byWeight ? "kg" : "piece",
    quantity: byWeight ? Number(weight) : Number(pieces) || 0
  };
}

function nextId(list) {
  return list.reduce(
    (maxId, item) => Math.max(maxId, Number(item.id) || 0),
    0
  ) + 1;
}

// Make sure every category used by a product exists in the list.
function addMissingCategories(categories, products) {
  let added = false;

  products.forEach(product => {
    if (!categories.some(category => category.name === product.category)) {
      categories.push({
        id: nextId(categories),
        name: product.category,
        unit: product.unit
      });
      added = true;
    }
  });

  return added;
}

function loadData() {
  try {
    const categories = loadList(CATEGORIES_KEY, demoCategories);
    const products = loadList(PRODUCTS_KEY, demoProducts).map(normalizeProduct);

    if (addMissingCategories(categories, products)) {
      saveList(CATEGORIES_KEY, categories);
    }

    return { products, categories, ok: true };
  } catch (error) {
    console.error("LocalStorage load failed:", error);
    return { products: [], categories: [], ok: false };
  }
}

function formatNumber(value) {
  return Number(value).toLocaleString("en-IN", {
    maximumFractionDigits: 3
  });
}

function formatCurrency(value) {
  return "₹" + Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function formatQuantity(product) {
  const unit = UNITS[product.unit] || UNITS.piece;
  return formatNumber(product.quantity) + " " + unit.short;
}

function createIconButton(className, icon, label, onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "icon-btn " + className;
  // Icon markup is a static constant, never user input.
  button.innerHTML = icon;
  button.setAttribute("aria-label", label);
  button.title = label;
  button.addEventListener("click", onClick);
  return button;
}

function createUnitTag(unit) {
  const tag = document.createElement("span");
  tag.className = "unit-tag " + unit;
  tag.textContent = (UNITS[unit] || UNITS.piece).label;
  return tag;
}

function showMessage(elementId, message, isError = false) {
  $(elementId).textContent = message;
  $(elementId).classList.toggle("error", isError);
}

function setupModal(dialog, closeButtons, onClose) {
  closeButtons.forEach(button => {
    button.addEventListener("click", () => dialog.close());
  });

  // Close when clicking the dark backdrop outside the modal box.
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("close", onClose);
}
