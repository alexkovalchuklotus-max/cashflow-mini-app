const DASHBOARD_API_URL =
  "https://hook.eu2.make.com/twemwtvqbpp7bkt9ymhi41k7flmlzxjk";

const OPERATIONS_API_URL =
  "https://hook.eu2.make.com/9g6al424xaqvktj4grwso59q71rv6aj9";

function buildQuery(params) {
  return new URLSearchParams(params).toString();
}

export async function fetchDashboard({ date, telegramId }) {
  const url = `${DASHBOARD_API_URL}?${buildQuery({
    date,
    telegram_id: telegramId
  })}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Dashboard API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.success === false) {
    throw new Error(
      data.error?.message || "Не вдалося отримати дані."
    );
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

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Operations API error: ${response.status}`);
  }

  const data = await response.json();

  if (data.success === false) {
    throw new Error(data.error?.message || "Не вдалося отримати операції.");
  }

  return data;
}

  //if (!response.ok) {
   // throw new Error(`Operations API error: ${response.status}`);
 // }

  //const data = await response.json();

 // if (data.success === false) {
   // throw new Error(
     // data.error?.message || "Не вдалося отримати операції."
    //);
 // }

 // return data;
//}