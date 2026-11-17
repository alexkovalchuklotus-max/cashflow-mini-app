const DASHBOARD_API_URL =
  "https://hook.eu1.make.com/n73y197i5ss4q9l8a94vckpc5xv2lpsx";

const OPERATIONS_API_URL =
  "https://hook.eu1.make.com/ryrvxfvg4ik4w6t9pl51b6379ragpqux";

function buildQuery(params) {
  return new URLSearchParams(params).toString();
}

export async function fetchDashboard({ date, telegramId }) {
  const url = `${DASHBOARD_API_URL}?${buildQuery({
    date,
    telegram_id: telegramId
  })}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.success === false) {
    const error = new Error(
      data.error?.message || "Не вдалося отримати дані."
    );

    error.code = data.error?.code || "API_ERROR";
    error.status = response.status;

    throw error;
  }

  if (!response.ok) {
    throw new Error(`Dashboard API error: ${response.status}`);
  }

  return data;
}

export async function fetchOperations({
  date,
  companyCode,
  type,
  telegramId
}) {
  const url = `${OPERATIONS_API_URL}?${buildQuery({
    date,
    company_code: companyCode,
    type,
    telegram_id: telegramId
  })}`;
  const FINKY_API_URL =
  "https://hook.eu2.make.com/suakcyafjhsjbmyunct7qxpix9cnbmg2";

  const response = await fetch(url);
  const data = await response.json();

  if (data.success === false) {
    const error = new Error(
      data.error?.message || "Не вдалося отримати операції."
    );

    error.code = data.error?.code || "API_ERROR";
    error.status = response.status;

    throw error;
  }

  if (!response.ok) {
    throw new Error(`Operations API error: ${response.status}`);
  }

  return data;
}
export async function fetchFinky({ telegramId }) {
  const url = `${FINKY_API_URL}?${buildQuery({
    telegram_id: telegramId
  })}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data.success === false) {
    const error = new Error(
      data.error?.message || "Не вдалося отримати дані «Фінки»."
    );

    error.code = data.error?.code || "API_ERROR";
    error.status = response.status;

    throw error;
  }

  if (!response.ok) {
    throw new Error(`Finky API error: ${response.status}`);
  }

  return data;
}