import { fetchDashboard, fetchOperations } from "./api.js";
"use strict";

const telegram = window.Telegram?.WebApp;

const cashflowData = {
  date: "14.07.2026",

  companies: [
    {
      code: "ЗЗД",
      name: "ЗЕРНОЗБУД",
      accent: "#15803d",

      opening: 7561913.56,
      income: 482300,
      payments: 315800,
      closing: 7728413.56,

      details: {
        income: [
          {
            counterparty: "ТОВ «Агро Партнер»",
            purpose: "Оплата за поставлене зерно",
            amount: 300000
          },
          {
            counterparty: "ТОВ «Трейд Сервіс»",
            purpose: "Погашення дебіторської заборгованості",
            amount: 182300
          }
        ],

        payments: [
          {
            counterparty: "ТОВ «Добрива Плюс»",
            purpose: "Оплата за мінеральні добрива",
            amount: 185800
          },
          {
            counterparty: "Податки",
            purpose: "ПДВ та обов'язкові платежі",
            amount: 130000
          }
        ]
      }
    },

    {
      code: "МЛ",
      name: "МАТІОС ЛОГІСТІК",
      accent: "#1d4ed8",

      opening: 2258981.97,
      income: 140000,
      payments: 96500,
      closing: 2302481.97,

      details: {
        income: [
          {
            counterparty: "ТОВ «Карго Груп»",
            purpose: "Оплата логістичних послуг",
            amount: 140000
          }
        ],

        payments: [
          {
            counterparty: "Паливна компанія",
            purpose: "Дизельне пальне",
            amount: 61500
          },
          {
            counterparty: "СТО",
            purpose: "Технічне обслуговування транспорту",
            amount: 35000
          }
        ]
      }
    },

    {
      code: "КВ",
      name: "КВ АГРО ГРУП",
      accent: "#c2410c",

      opening: 3045764.15,
      income: 275000,
      payments: 198750,
      closing: 3122014.15,

      details: {
        income: [
          {
            counterparty: "ТОВ «Зерно Інвест»",
            purpose: "Оплата за товар",
            amount: 275000
          }
        ],

        payments: [
          {
            counterparty: "ТОВ «Насіння Україна»",
            purpose: "Оплата за посівний матеріал",
            amount: 128750
          },
          {
            counterparty: "Оренда",
            purpose: "Орендна плата за склад",
            amount: 70000
          }
        ]
      }
    },

    {
      code: "БС",
      name: "БАЗА СЕРВІС",
      accent: "#6d28d9",

      opening: 75595.38,
      income: 42000,
      payments: 18500,
      closing: 99095.38,

      details: {
        income: [
          {
            counterparty: "ТОВ «Сервіс Лайн»",
            purpose: "Оплата за послуги",
            amount: 42000
          }
        ],

        payments: [
          {
            counterparty: "Комунальні послуги",
            purpose: "Електроенергія та водопостачання",
            amount: 18500
          }
        ]
      }
    }
  ]
};
async function loadDashboard() {
  try {
    const data = await fetchDashboard({
      date: "2026-07-18",
      telegramId: telegram?.initDataUnsafe?.user?.id || 123456789
    });

    console.log("Dashboard:", data);

    const syncNote = document.getElementById("syncNote");

    if (syncNote) {
      syncNote.textContent = `API працює. Отримано компаній: ${
        data.companies?.length ?? 0
      }`;
    }
  } catch (error) {
    console.error(error);

    const syncNote = document.getElementById("syncNote");

    if (syncNote) {
      syncNote.textContent = `Помилка API: ${error.message}`;
    }
  }
}
telegram.ready();

console.log("Telegram user:", telegram.initDataUnsafe);

loadDashboard();

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
            <strong class="company-name">
              ${company.code}
            </strong>

            <span class="company-full-name">
              ${company.name}
            </span>
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
            <span
              class="flow-dot"
              style="background: #94a3b8"
            ></span>

            <span>На початок дня</span>
          </div>

          <strong class="flow-value">
            ${formatMoney(company.opening)}
          </strong>
        </div>

        <button
          class="flow-row clickable income"
          data-index="${index}"
          data-type="income"
          type="button"
        >
          <div class="flow-label">
            <span
              class="flow-dot"
              style="background: #22c55e"
            ></span>

            <span>Надходження</span>
          </div>

          <strong class="flow-value">
            + ${formatMoney(company.income)}
            <span class="flow-chevron">›</span>
          </strong>
        </button>

        <button
          class="flow-row clickable payment"
          data-index="${index}"
          data-type="payments"
          type="button"
        >
          <div class="flow-label">
            <span
              class="flow-dot"
              style="background: #ef4444"
            ></span>

            <span>Платежі</span>
          </div>

          <strong class="flow-value">
            − ${formatMoney(company.payments)}
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

  if (!reportDate || !totalClosing || !companiesGrid) {
    return;
  }

  reportDate.textContent = cashflowData.date;
  totalClosing.textContent = formatMoney(calculateTotalClosing());

  companiesGrid.innerHTML = cashflowData.companies
    .map((company, index) => createCompanyCard(company, index))
    .join("");

  document
    .querySelectorAll(".flow-row.clickable")
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
        <div class="operation-name">
          ${operation.counterparty}
        </div>

        <div class="operation-amount">
          ${formatMoney(operation.amount)}
        </div>
      </div>

      <p class="operation-purpose">
        ${operation.purpose}
      </p>
    </article>
  `;
}

function openDetails(companyIndex, type) {
  const company = cashflowData.companies[companyIndex];

  if (!company) {
    console.error("Компанію не знайдено:", companyIndex);
    return;
  }

  const operations = company.details?.[type] ?? [];

  const modalCompany = getElement("modalCompany");
  const modalTitle = getElement("modalTitle");
  const modalTotal = getElement("modalTotal");
  const operationsList = getElement("operationsList");
  const detailsModal = getElement("detailsModal");

  if (
    !modalCompany ||
    !modalTitle ||
    !modalTotal ||
    !operationsList ||
    !detailsModal
  ) {
    return;
  }

  const total = operations.reduce((sum, operation) => {
    return sum + Number(operation.amount || 0);
  }, 0);

  modalCompany.textContent = `${company.code} · ${company.name}`;

  modalTitle.textContent =
    type === "income"
      ? "Надходження"
      : "Платежі";

  modalTotal.textContent = formatMoney(total);

  operationsList.innerHTML = operations.length
    ? operations.map(createOperationCard).join("")
    : `
      <div class="empty-state">
        Операцій за цей день немає.
      </div>
    `;

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

function setupTelegram() {
  if (!telegram) {
    return;
  }

  telegram.ready();
  telegram.expand();

  telegram.setHeaderColor?.("#eef2f7");
  telegram.setBackgroundColor?.("#eef2f7");
}

function setupEvents() {
  const closeModalButton = getElement("closeModal");
  const detailsModal = getElement("detailsModal");
  const refreshButton = getElement("refreshButton");
  const previousDayButton = getElement("previousDay");
  const nextDayButton = getElement("nextDay");

  closeModalButton?.addEventListener("click", closeDetails);

  detailsModal?.addEventListener("click", event => {
    if (event.target === detailsModal) {
      closeDetails();
    }
  });

  refreshButton?.addEventListener("click", () => {
    const syncNote = getElement("syncNote");

    if (syncNote) {
      syncNote.textContent =
        "Дані оновлено. Поки використовується демо-режим.";
    }

    telegram?.HapticFeedback?.notificationOccurred("success");
  });

  previousDayButton?.addEventListener("click", () => {
    alert("Вибір дати підключимо наступним кроком.");
  });

  nextDayButton?.addEventListener("click", () => {
    alert("Вибір дати підключимо наступним кроком.");
  });
}

function initApp() {
  setupTelegram();
  renderDashboard();
  setupEvents();
}

document.addEventListener("DOMContentLoaded", initApp);