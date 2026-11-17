if (dateString === todayString) {
      button.classList.add("today");
    }

    button.addEventListener("click", async () => {
      closeCalendar();
      await loadDashboard(dateString);
    });

    daysContainer.appendChild(button);

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