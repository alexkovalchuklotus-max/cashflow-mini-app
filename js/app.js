import { fetchDashboard, fetchOperations } from "./api.js";
"use strict";

const telegram = window.Telegram?.WebApp;

let cashflowData = {
  date: "2026-07-18",
  companies: []
};
function showAccessDenied() {
  const reportDate = getElement("reportDate");
  const totalClosing = getElement("totalClosing");
  const companiesGrid = getElement("companiesGrid");
  const syncNote = getElement("syncNote");
  const companyCount = document.getElementById("companyCount");

  
  const tg = window.Telegram?.WebApp;

let telegramId = tg?.initDataUnsafe?.user?.id;

// ВРЕМЕННО для теста в браузере:
if (!telegramId) {
  telegramId = 459183589; // сюда твой Telegram ID
}

  if (reportDate) {
    reportDate.textContent = "Доступ заборонено";
  }

  if (totalClosing) {
    totalClosing.textContent = "🔒";
  }
 
  if (companyCount) {
  companyCount.textContent = "Немає доступу";
}

  if (companiesGrid) {
    companiesGrid.innerHTML = `
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

  if (syncNote) {
    syncNote.textContent = "Доступ до Cash Flow не надано.";
  }
}

async function loadDashboard(date = cashflowData.date) {
  const syncNote = document.getElementById("syncNote");

  try {
    if (syncNote) {
      syncNote.textContent = "Завантаження даних...";
    }

     const data = await fetchDashboard({
  date: date,
  telegramId: telegram?.initDataUnsafe?.user?.id || ""
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
  showAccessDenied();
  return false;
}

if (syncNote) {
  syncNote.textContent = `Помилка API: ${error.message}`;
}

    return false;
  }
}
telegram.ready();
telegram.expand();
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
  console.log(
  company.code,
  company.payment,
  company.payments,
  company
);
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
          data-type="payment"
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
            − ${formatMoney(company.payment)}
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

async function openDetails(companyIndex, type) {
  const company = cashflowData.companies[companyIndex];

  if (!company) {
    console.error("Компанію не знайдено:", companyIndex);
    return;
  }

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

  modalCompany.textContent = `${company.code} · ${company.name}`;

  modalTitle.textContent =
    type === "income"
      ? "Надходження"
      : "Платежі";

  modalTotal.textContent = "0,00 ₴";

  operationsList.innerHTML = `
    <div class="empty-state">
      Завантаження...
    </div>
  `;

  detailsModal.classList.remove("hidden");
  detailsModal.setAttribute("aria-hidden", "false");

  telegram?.HapticFeedback?.impactOccurred("light");

  try {
    const data = await fetchOperations({
  date: cashflowData.date,
  companyCode: company.code,
  type: type,
  telegramId: telegram?.initDataUnsafe?.user?.id || ""
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
      : `
        <div class="empty-state">
          Операцій за цей день немає.
        </div>
      `;

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
  loadDashboard();

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

  refreshButton?.addEventListener("click", async () => {
  await loadDashboard(cashflowData.date);

  telegram?.HapticFeedback?.notificationOccurred("success");
});

  previousDayButton?.addEventListener("click", async () => {
  const currentDate = new Date(`${cashflowData.date}T12:00:00`);

  currentDate.setDate(currentDate.getDate() - 1);

  const newDate = currentDate.toISOString().split("T")[0];

  await loadDashboard(newDate);
});

nextDayButton?.addEventListener("click", async () => {
  const currentDate = new Date(`${cashflowData.date}T12:00:00`);

  currentDate.setDate(currentDate.getDate() + 1);

  const newDate = currentDate.toISOString().split("T")[0];
  const syncNote = getElement("syncNote");

  try {
    const data = await fetchDashboard({
      date: newDate,
      telegramId: telegram?.initDataUnsafe?.user?.id || 123456789
    });

    const companies = Array.isArray(data.companies)
      ? data.companies
      : [];

    if (companies.length === 0) {
      if (syncNote) {
        syncNote.textContent = "Новіших даних поки немає.";
      }

      telegram?.HapticFeedback?.notificationOccurred("warning");
      return;
    }

    cashflowData = {
      date: data.date,
      companies

    };

    renderDashboard();

    if (syncNote) {
      syncNote.textContent = `Дані оновлено. Компаній: ${companies.length}`;
    }

  } catch (error) {
    console.error(error);

    if (syncNote) {
      syncNote.textContent = `Помилка API: ${error.message}`;
    }
  }
});
}

function initApp() {
  setupTelegram();
  renderDashboard();
  setupEvents();
}

document.addEventListener("DOMContentLoaded", initApp);