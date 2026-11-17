import {
  fetchDashboard,
  fetchOperations,
  fetchFinky
} from "./api.js";

"use strict";

const telegram = window.Telegram?.WebApp;

const finkyEntities = [
  { key: "zzd", name: "ЗЗД", mark: "ЗЗД", accent: "#2563eb" },
  { key: "ml", name: "МЛ", mark: "МЛ", accent: "#7c3aed" },
  { key: "bs", name: "БС", mark: "БС", accent: "#059669" },
  { key: "kv", name: "КВ", mark: "КВ", accent: "#ea580c" },
  { key: "vadim", name: "Вадим", mark: "ВД", accent: "#dc2626" },
  { key: "igor", name: "Ігор", mark: "ІГ", accent: "#0891b2" },
  { key: "vitaliy", name: "Віталій", mark: "ВТ", accent: "#4f46e5" },
  { key: "karen", name: "Карен", mark: "КР", accent: "#be185d" }
];

function getYesterdayDate() {
  const date = new Date();
  date.setDate(date.getDate() - 1);

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function getTelegramId() {
  return telegram?.initDataUnsafe?.user?.id || "";
}

let cashflowData = {
  date: getYesterdayDate(),
  companies: []
};

let finkyData = {
  date: "",
  rows: []
};

let currentPage = "cashflow";
let finkyLoaded = false;
let calendarViewDate = new Date();

const monthNamesUk = [
  "Січень",
  "Лютий",
  "Березень",
  "Квітень",
  "Травень",
  "Червень",
  "Липень",
  "Серпень",
  "Вересень",
  "Жовтень",
  "Листопад",
  "Грудень"
];

function getElement(id) {
  const element = document.getElementById(id);

  if (!element) {
    console.error(`Не знайдено HTML-елемент з id="${id}"`);
  }

  return element;
}

function formatMoney(value) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return "0,00 ₴";
  }

  return (
    new Intl.NumberFormat("uk-UA", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number) + " ₴"
  );
}

function getMoneyClass(value) {
  const number = Number(value);

  if (number > 0) {
    return "money-positive";
  }

  if (number < 0) {
    return "money-negative";
  }

  return "money-zero";
}

function createAccessDeniedMarkup() {
  const telegramId = getTelegramId() || "невідомий";

  return `
    <section class="access-denied">
      <div class="access-denied-icon">🔒</div>
      <h2>Доступ заборонено</h2>
      <p>
        Ваш Telegram ID не має доступу до фінансового кабінету.
      </p>
      <div class="access-denied-id">
        Telegram ID: ${telegramId}
      </div>
      <p class="access-denied-note">
        Зверніться до адміністратора для надання доступу.
      </p>
    </section>
  `;
}

function showAccessDenied(page = currentPage) {
  if (page === "finky") {
    const finkyDate = getElement("finkyDate");
    const finkyTotal = getElement("finkyTotal");
    const finkyCount = getElement("finkyCount");
    const finkyGrid = getElement("finkyGrid");
    const finkySyncNote = getElement("finkySyncNote");

    if (finkyDate) finkyDate.textContent = "Доступ заборонено";
    if (finkyTotal) finkyTotal.textContent = "🔒";
    if (finkyCount) finkyCount.textContent = "Немає доступу";
    if (finkyGrid) finkyGrid.innerHTML = createAccessDeniedMarkup();
    if (finkySyncNote) {
      finkySyncNote.textContent = "Доступ до розділу «Фінки» не надано.";
    }

    return;
  }

  const reportDate = getElement("reportDate");
  const totalClosing = getElement("totalClosing");
  const companiesGrid = getElement("companiesGrid");
  const syncNote = getElement("syncNote");
  const companyCount = getElement("companyCount");

  if (reportDate) reportDate.textContent = "Доступ заборонено";
  if (totalClosing) totalClosing.textContent = "🔒";
  if (companyCount) companyCount.textContent = "Немає доступу";
  if (companiesGrid) companiesGrid.innerHTML = createAccessDeniedMarkup();
  if (syncNote) syncNote.textContent = "Доступ до Cash Flow не надано.";
}

async function loadDashboard(date = cashflowData.date) {
  const syncNote = getElement("syncNote");

  try {
    if (syncNote) {
      syncNote.textContent = "Завантаження даних...";
    }

    const data = await fetchDashboard({
      date,
      telegramId: getTelegramId()
    });

    const companies = Array.isArray(data.companies)
      ? data.companies
      : [];

    if (companies.length === 0) {
      if (syncNote) {
        syncNote.textContent = "За цю дату даних немає.";
      }

      telegram?.HapticFeedback?.notificationOccurred("warning");
      return false;
    }

    cashflowData = {
      date: data.date,
      companies
    };

    renderDashboard();

    if (syncNote) {
      syncNote.textContent = `Дані оновлено. Компаній: ${companies.length}`;
    }

    return true;
  } catch (error) {
    console.error(error);

    if (error.code === "ACCESS_DENIED") {
      showAccessDenied("cashflow");
      return false;
    }

    if (syncNote) {
      syncNote.textContent = `Помилка API: ${error.message}`;
    }

    return false;
  }
}

function calculateTotalClosing() {
  return cashflowData.companies.reduce((total, company) => {
    return total + Number(company.closing || 0);
  }, 0);
}

function createCompanyCard(company, index) {
  return `
    <article class="company-card">
      <header class="company-header">
        <div class="company-identity">
          <div
            class="company-mark"
            style="background: ${company.accent}"
          >
            ${company.code}
          </div>

          <div>
            <strong class="company-name">${company.code}</strong>
            <span class="company-full-name">${company.name}</span>
          </div>
        </div>

        <div class="closing-value">
          <span>На кінець дня</span>
          <strong>${formatMoney(company.closing)}</strong>
        </div>
      </header>

      <div class="flows">
        <div class="flow-row">
          <div class="flow-label">
            <span class="flow-dot" style="background: #94a3b8"></span>
            <span>На початок дня</span>
          </div>
          <strong class="flow-value">${formatMoney(company.opening)}</strong>
        </div>

        <button
          class="flow-row clickable income"
          data-index="${index}"
          data-type="income"
          type="button"
        >
          <div class="flow-label">
            <span class="flow-dot" style="background: #22c55e"></span>
            <span>Надходження</span>
          </div>
          <strong class="flow-value">
            + ${formatMoney(company.payments)}
            <span class="flow-chevron">›</span>
          </strong>
        </button>

        <button
          class="flow-row clickable payment"
          data-index="${index}"
          data-type="payment"
          type="button"
        >
          <div class="flow-label">
            <span class="flow-dot" style="background: #ef4444"></span>
            <span>Платежі</span>
          </div>
          <strong class="flow-value">
            − ${formatMoney(company.income)}
            <span class="flow-chevron">›</span>
          </strong>
        </button>
      </div>
    </article>
  `;
}

function renderDashboard() {
  const reportDate = getElement("reportDate");
  const totalClosing = getElement("totalClosing");
  const companiesGrid = getElement("companiesGrid");
  const companyCount = getElement("companyCount");

  if (!reportDate || !totalClosing || !companiesGrid) {
    return;
  }

  const [year, month, day] = cashflowData.date.split("-");
  reportDate.textContent = `${day}.${month}.${year}`;
  totalClosing.textContent = formatMoney(calculateTotalClosing());

  if (companyCount) {
    companyCount.textContent = `${cashflowData.companies.length} підприємства`;
  }

  companiesGrid.innerHTML = cashflowData.companies
    .map((company, index) => createCompanyCard(company, index))
    .join("");

  document
    .querySelectorAll("#cashflowPage .flow-row.clickable")
    .forEach(button => {
      button.addEventListener("click", () => {
        const index = Number(button.dataset.index);
        const type = button.dataset.type;
        openDetails(index, type);
      });
    });
}

function createOperationCard(operation) {
  return `
    <article class="operation-card">
      <div class="operation-top">
        <div class="operation-name">${operation.counterparty}</div>
        <div class="operation-amount">${formatMoney(operation.amount)}</div>
      </div>
      <p class="operation-purpose">${operation.purpose}</p>
    </article>
  `;
}

async function openDetails(companyIndex, type) {
  const company = cashflowData.companies[companyIndex];

  if (!company) {
    return;
  }

  const modalCompany = getElement("modalCompany");
  const modalTitle = getElement("modalTitle");
  const modalTotal = getElement("modalTotal");
  const operationsList = getElement("operationsList");
  const detailsModal = getElement("detailsModal");

  if (!modalCompany || !modalTitle || !modalTotal || !operationsList || !detailsModal) {
    return;
  }

  modalCompany.textContent = `${company.code} · ${company.name}`;
  modalTitle.textContent = type === "income" ? "Надходження" : "Платежі";
  modalTotal.textContent = "0,00 ₴";
  operationsList.innerHTML = `<div class="empty-state">Завантаження...</div>`;

  detailsModal.classList.remove("hidden");
  detailsModal.setAttribute("aria-hidden", "false");
  telegram?.HapticFeedback?.impactOccurred("light");

  try {
    const apiType = type === "income" ? "payment" : "income";

    const data = await fetchOperations({
      date: cashflowData.date,
      companyCode: company.code,
      type: apiType,
      telegramId: getTelegramId()
    });

    const operations = Array.isArray(data.operations)
      ? data.operations
      : [];

    const total = operations.reduce((sum, operation) => {
      return sum + Number(operation.amount || 0);
    }, 0);

    modalTotal.textContent = formatMoney(total);
    operationsList.innerHTML = operations.length
      ? operations.map(createOperationCard).join("")
      : `<div class="empty-state">Операцій за цей день немає.</div>`;
  } catch (error) {
    console.error("Operations API error:", error);
    modalTotal.textContent = "0,00 ₴";
    operationsList.innerHTML = `
      <div class="empty-state">
        Не вдалося завантажити операції.
      </div>
    `;
  }
}

function normalizeName(value) {
  return String(value || "").trim().toUpperCase();
}

function getFinkyTotalRow() {
  return finkyData.rows.find(row => normalizeName(row.name) === "РАЗОМ");
}

function getFinkyRelations(entity) {
  return finkyData.rows
    .filter(row => normalizeName(row.name) !== "РАЗОМ")
    .map(row => {
      const value = Number(row[entity.key] || 0);

      if (
        !Number.isFinite(value) ||
        value === 0 ||
        normalizeName(row.name) === normalizeName(entity.name)
      ) {
        return null;
      }

      return {
        debtor: value < 0 ? entity.name : row.name,
        creditor: value < 0 ? row.name : entity.name,
        amount: value
      };
    })
    .filter(Boolean);
}

function createFinkyInlineRelation(relation) {
  return `
    <div class="finky-inline-relation">
      <span class="finky-inline-route">
        ${relation.debtor} → ${relation.creditor}
      </span>

      <strong
        class="finky-inline-amount ${getMoneyClass(relation.amount)}"
      >
        ${formatMoney(relation.amount)}
      </strong>
    </div>
  `;
}

function createFinkyCard(entity, index) {
  const totalRow = getFinkyTotalRow();
  const closing = Number(totalRow?.[entity.key] || 0);
  const relations = getFinkyRelations(entity);

  return `
    <article class="company-card finky-card">
      <header class="company-header">
        <div class="company-identity">
          <div
            class="company-mark"
            style="background: ${entity.accent}"
          >
            ${entity.mark}
          </div>

          <div>
            <strong class="company-name">${entity.name}</strong>
            <span class="company-full-name">Фінансова допомога</span>
          </div>
        </div>

        <div class="closing-value">
          <span>На кінець дня</span>
          <strong class="${getMoneyClass(closing)}">
            ${formatMoney(closing)}
          </strong>
        </div>
      </header>

      <div class="flows">
        <button
          class="flow-row clickable finky-details-button"
          data-finky-index="${index}"
          type="button"
        >
          <div class="flow-label">
            <span class="flow-dot" style="background: #7c3aed"></span>
            <span>Взаєморозрахунки</span>
          </div>

          <strong class="flow-value">
            ${relations.length} позицій
            <span class="flow-chevron">›</span>
          </strong>
        </button>

        <div class="finky-inline-relations">
          ${relations.length
            ? relations.map(createFinkyInlineRelation).join("")
            : `<p class="finky-inline-empty">Взаєморозрахунків немає.</p>`}
        </div>
      </div>
    </article>
  `;
}

function createFinkyRelationCard(relation) {
  return `
    <article class="operation-card finky-relation-card">
      <div class="operation-top">
        <div class="operation-name">
          ${relation.debtor} → ${relation.creditor}
        </div>

        <div
          class="operation-amount ${getMoneyClass(relation.amount)}"
        >
          ${formatMoney(relation.amount)}
        </div>
      </div>

      <p class="operation-purpose">
        «${relation.debtor}» має повернути «${relation.creditor}»
      </p>
    </article>
  `;
}

function renderFinky() {
  const finkyDate = getElement("finkyDate");
  const finkyTotal = getElement("finkyTotal");
  const finkyCount = getElement("finkyCount");
  const finkyGrid = getElement("finkyGrid");
  const totalRow = getFinkyTotalRow();

  if (!finkyDate || !finkyTotal || !finkyGrid) {
    return;
  }

  finkyDate.textContent = finkyData.date || "—";
  finkyTotal.textContent = formatMoney(totalRow?.total || 0);

  if (finkyCount) {
    finkyCount.textContent = `${finkyEntities.length} учасників`;
  }

  finkyGrid.innerHTML = finkyEntities
    .map((entity, index) => createFinkyCard(entity, index))
    .join("");

  document
    .querySelectorAll("[data-finky-index]")
    .forEach(button => {
      button.addEventListener("click", () => {
        openFinkyDetails(Number(button.dataset.finkyIndex));
      });
    });
}

async function loadFinky(force = false) {
  const finkySyncNote = getElement("finkySyncNote");

  if (finkyLoaded && !force) {
    renderFinky();
    return true;
  }

  try {
    if (finkySyncNote) {
      finkySyncNote.textContent = "Завантаження даних...";
    }

    const data = await fetchFinky({
      telegramId: getTelegramId()
    });

    const rows = Array.isArray(data.rows) ? data.rows : [];

    if (rows.length === 0) {
      if (finkySyncNote) {
        finkySyncNote.textContent = "Даних немає.";
      }

      telegram?.HapticFeedback?.notificationOccurred("warning");
      return false;
    }

    finkyData = {
      date: data.date || "",
      rows
    };

    finkyLoaded = true;
    renderFinky();

    if (finkySyncNote) {
      finkySyncNote.textContent = `Дані оновлено. Учасників: ${finkyEntities.length}`;
    }

    return true;
  } catch (error) {
    console.error("Finky API error:", error);

    if (error.code === "ACCESS_DENIED") {
      showAccessDenied("finky");
      return false;
    }

    if (finkySyncNote) {
      finkySyncNote.textContent = `Помилка API: ${error.message}`;
    }

    return false;
  }
}

function openFinkyDetails(entityIndex) {
  const entity = finkyEntities[entityIndex];

  if (!entity) {
    return;
  }

  const totalRow = getFinkyTotalRow();
  const closing = Number(totalRow?.[entity.key] || 0);
  const relations = getFinkyRelations(entity);
  const modalCompany = getElement("modalCompany");
  const modalTitle = getElement("modalTitle");
  const modalTotal = getElement("modalTotal");
  const operationsList = getElement("operationsList");
  const detailsModal = getElement("detailsModal");

  if (!modalCompany || !modalTitle || !modalTotal || !operationsList || !detailsModal) {
    return;
  }

  modalCompany.textContent = entity.name;
  modalTitle.textContent = "Фінансова допомога";
  modalTotal.textContent = formatMoney(closing);
  operationsList.innerHTML = relations.length
    ? relations.map(createFinkyRelationCard).join("")
    : `<div class="empty-state">Взаєморозрахунків немає.</div>`;

  detailsModal.classList.remove("hidden");
  detailsModal.setAttribute("aria-hidden", "false");
  telegram?.HapticFeedback?.impactOccurred("light");
}

function closeDetails() {
  const detailsModal = getElement("detailsModal");

  if (!detailsModal) {
    return;
  }

  detailsModal.classList.add("hidden");
  detailsModal.setAttribute("aria-hidden", "true");
}

async function switchPage(page) {
  if (page !== "cashflow" && page !== "finky") {
    return;
  }

  currentPage = page;

  const cashflowPage = getElement("cashflowPage");
  const finkyPage = getElement("finkyPage");
  const cashflowTab = getElement("cashflowTab");
  const finkyTab = getElement("finkyTab");
  const pageTitle = getElement("pageTitle");

  cashflowPage?.classList.toggle("hidden", page !== "cashflow");
  finkyPage?.classList.toggle("hidden", page !== "finky");
  cashflowTab?.classList.toggle("active", page === "cashflow");
  finkyTab?.classList.toggle("active", page === "finky");

  if (pageTitle) {
    pageTitle.textContent = page === "finky" ? "Фінки" : "Cash Flow";
  }

  closeCalendar();
  closeDetails();

  if (page === "finky") {
    await loadFinky();
  }
}

function setupTelegram() {
  if (!telegram) {
    return;
  }

  telegram.ready();
  telegram.expand();
  telegram.setHeaderColor?.("#eef2f7");
  telegram.setBackgroundColor?.("#eef2f7");
  loadDashboard();
}

function openCalendar() {
  const backdrop = getElement("calendarBackdrop");
  const selectedDate = new Date(`${cashflowData.date}T12:00:00`);

  calendarViewDate = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    1
  );

  renderCalendar();

  if (backdrop) {
    backdrop.hidden = false;
  }
}

function closeCalendar() {
  const backdrop = getElement("calendarBackdrop");

  if (backdrop) {
    backdrop.hidden = true;
  }
}

function renderCalendar() {
  const monthTitle = getElement("calendarMonthTitle");
  const daysContainer = getElement("calendarDays");

  if (!monthTitle || !daysContainer) {
    return;
  }

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  monthTitle.textContent = `${monthNamesUk[month]} ${year}`;

  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = (firstDay.getDay() + 6) % 7;
  const selectedDate = cashflowData.date;
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0")
  ].join("-");

  daysContainer.innerHTML = "";

  for (let i = 0; i < startWeekday; i += 1) {
    const empty = document.createElement("span");
    empty.className = "calendar-day empty";
    daysContainer.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateString = [
      year,
      String(month + 1).padStart(2, "0"),
      String(day).padStart(2, "0")
    ].join("-");

    const button = document.createElement("button");
    button.type = "button";
    button.className = "calendar-day";
    button.textContent = String(day);
    button.dataset.date = dateString;

    if (dateString === selectedDate) {
      button.classList.add("selected");
    }

    if (dateString === todayString) {
      button.classList.add("today");
    }

    button.addEventListener("click", async () => {
      closeCalendar();
      await loadDashboard(dateString);
    });

    daysContainer.appendChild(button);
  }
}

function setupEvents() {
  const cashflowTab = getElement("cashflowTab");
  const finkyTab = getElement("finkyTab");
  const openCalendarButton = getElement("openCalendar");
  const calendarBackdrop = getElement("calendarBackdrop");
  const calendarPrevMonth = getElement("calendarPrevMonth");
  const calendarNextMonth = getElement("calendarNextMonth");
  const calendarToday = getElement("calendarToday");
  const closeModalButton = getElement("closeModal");
  const detailsModal = getElement("detailsModal");
  const refreshButton = getElement("refreshButton");
  const previousDayButton = getElement("previousDay");
  const nextDayButton = getElement("nextDay");

  cashflowTab?.addEventListener("click", () => switchPage("cashflow"));
  finkyTab?.addEventListener("click", () => switchPage("finky"));
  closeModalButton?.addEventListener("click", closeDetails);
  openCalendarButton?.addEventListener("click", openCalendar);

  calendarBackdrop?.addEventListener("click", event => {
    if (event.target === calendarBackdrop) {
      closeCalendar();
    }
  });

  calendarPrevMonth?.addEventListener("click", () => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() - 1);
    renderCalendar();
  });

  calendarNextMonth?.addEventListener("click", () => {
    calendarViewDate.setMonth(calendarViewDate.getMonth() + 1);
    renderCalendar();
  });

  calendarToday?.addEventListener("click", async () => {
    const today = new Date();
    const todayString = [
      today.getFullYear(),
      String(today.getMonth() + 1).padStart(2, "0"),
      String(today.getDate()).padStart(2, "0")
    ].join("-");

    closeCalendar();
    await loadDashboard(todayString);
  });

  detailsModal?.addEventListener("click", event => {
    if (event.target === detailsModal) {
      closeDetails();
    }
  });

  refreshButton?.addEventListener("click", async () => {
    const success = currentPage === "finky"
      ? await loadFinky(true)
      : await loadDashboard(cashflowData.date);

    if (success) {
      telegram?.HapticFeedback?.notificationOccurred("success");
    }
  });

  previousDayButton?.addEventListener("click", async () => {
    const currentDate = new Date(`${cashflowData.date}T12:00:00`);
    currentDate.setDate(currentDate.getDate() - 1);

    const newDate = [
      currentDate.getFullYear(),
      String(currentDate.getMonth() + 1).padStart(2, "0"),
      String(currentDate.getDate()).padStart(2, "0")
    ].join("-");

    await loadDashboard(newDate);
  });

  nextDayButton?.addEventListener("click", async () => {
    const currentDate = new Date(`${cashflowData.date}T12:00:00`);
    currentDate.setDate(currentDate.getDate() + 1);

    const newDate = [
      currentDate.getFullYear(),
      String(currentDate.getMonth() + 1).padStart(2, "0"),
      String(currentDate.getDate()).padStart(2, "0")
    ].join("-");

    await loadDashboard(newDate);
  });
}

function initApp() {
  setupTelegram();
  setupEvents();
}

document.addEventListener("DOMContentLoaded", initApp);
