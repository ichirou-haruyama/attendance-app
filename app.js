const STORAGE_KEY = "attendance-app-v2";

const state = {
  members: [],
  records: {},
  activeDate: toDateKey(new Date()),
  calendarMonth: startOfMonth(new Date()),
};

const el = {
  activeDate: document.querySelector("#activeDate"),
  attendanceDateLabel: document.querySelector("#attendanceDateLabel"),
  attendanceList: document.querySelector("#attendanceList"),
  emptyAttendance: document.querySelector("#emptyAttendance"),
  presentCount: document.querySelector("#presentCount"),
  absentCount: document.querySelector("#absentCount"),
  pendingCount: document.querySelector("#pendingCount"),
  summaryBody: document.querySelector("#summaryBody"),
  emptySummary: document.querySelector("#emptySummary"),
  clearDayButton: document.querySelector("#clearDayButton"),
  monthLabel: document.querySelector("#monthLabel"),
  calendarGrid: document.querySelector("#calendarGrid"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  memberForm: document.querySelector("#memberForm"),
  memberNameInput: document.querySelector("#memberNameInput"),
  memberAdminList: document.querySelector("#memberAdminList"),
  emptyMembers: document.querySelector("#emptyMembers"),
  attendanceTemplate: document.querySelector("#attendanceItemTemplate"),
  memberAdminTemplate: document.querySelector("#memberAdminTemplate"),
};

init();

function init() {
  loadState();
  bindEvents();
  render();
}

function bindEvents() {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  el.activeDate.addEventListener("change", () => {
    if (!el.activeDate.value) return;
    state.activeDate = el.activeDate.value;
    state.calendarMonth = startOfMonth(parseDateKey(state.activeDate));
    saveState();
    render();
  });

  el.prevMonth.addEventListener("click", () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() - 1, 1);
    renderCalendar();
  });

  el.nextMonth.addEventListener("click", () => {
    state.calendarMonth = new Date(state.calendarMonth.getFullYear(), state.calendarMonth.getMonth() + 1, 1);
    renderCalendar();
  });

  el.memberForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = el.memberNameInput.value.trim();
    if (!name) return;
    state.members.push({ id: crypto.randomUUID(), name });
    el.memberNameInput.value = "";
    saveState();
    render();
  });

  el.clearDayButton.addEventListener("click", () => {
    const dayRecord = state.records[state.activeDate];
    if (!dayRecord || !Object.keys(dayRecord).length) return;
    if (!confirm(`${formatDateLabel(state.activeDate)} の記録を消去しますか？`)) return;
    delete state.records[state.activeDate];
    saveState();
    render();
  });
}

function switchView(viewName) {
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.view === viewName);
  });

  document.querySelectorAll(".view").forEach((view) => {
    view.classList.toggle("is-active", view.id === `${viewName}View`);
  });
}

function loadState() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    state.members = [];
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.members = Array.isArray(parsed.members) ? parsed.members : [];
    state.records = parsed.records && typeof parsed.records === "object" ? parsed.records : {};
    state.activeDate = parsed.activeDate || state.activeDate;
    state.calendarMonth = startOfMonth(parseDateKey(state.activeDate));
  } catch {
    state.members = [];
    state.records = {};
  }
}

function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      members: state.members,
      records: state.records,
      activeDate: state.activeDate,
    }),
  );
}

function render() {
  el.activeDate.value = state.activeDate;
  el.attendanceDateLabel.textContent = formatDateLabel(state.activeDate);
  renderAttendance();
  renderSummary();
  renderCalendar();
  renderMembers();
}

function renderAttendance() {
  el.attendanceList.replaceChildren();
  el.emptyAttendance.classList.toggle("is-visible", state.members.length === 0);

  const dayRecord = state.records[state.activeDate] || {};
  let present = 0;
  let absent = 0;

  state.members.forEach((member) => {
    const item = el.attendanceTemplate.content.firstElementChild.cloneNode(true);
    const record = dayRecord[member.id];
    const presentButton = item.querySelector(".present-button");
    const absentButton = item.querySelector(".absent-button");

    item.querySelector(".member-name").textContent = member.name;
    presentButton.classList.toggle("is-selected", record?.status === "present");
    absentButton.classList.toggle("is-selected", record?.status === "absent");

    if (record?.status === "present") present += 1;
    if (record?.status === "absent") absent += 1;

    presentButton.addEventListener("click", () => setAttendance(member.id, "present"));
    absentButton.addEventListener("click", () => setAttendance(member.id, "absent"));

    el.attendanceList.append(item);
  });

  el.presentCount.textContent = present;
  el.absentCount.textContent = absent;
  el.pendingCount.textContent = Math.max(state.members.length - present - absent, 0);
}

function setAttendance(memberId, status) {
  state.records[state.activeDate] ||= {};
  const current = state.records[state.activeDate][memberId];

  if (current?.status === status) {
    delete state.records[state.activeDate][memberId];
  } else {
    state.records[state.activeDate][memberId] = {
      status,
      updatedAt: new Date().toISOString(),
    };
  }

  if (Object.keys(state.records[state.activeDate]).length === 0) {
    delete state.records[state.activeDate];
  }

  saveState();
  render();
}

function renderSummary() {
  el.summaryBody.replaceChildren();
  el.emptySummary.classList.toggle("is-visible", state.members.length === 0);
  const dayRecord = state.records[state.activeDate] || {};

  state.members.forEach((member) => {
    const record = dayRecord[member.id];
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    const statusCell = document.createElement("td");
    const timeCell = document.createElement("td");
    const badge = document.createElement("span");

    nameCell.textContent = member.name;
    badge.className = "status-badge";
    badge.textContent = "未入力";
    timeCell.textContent = "-";

    if (record?.status === "present") {
      badge.classList.add("present-badge");
      badge.textContent = "出";
      timeCell.textContent = formatTime(record.updatedAt);
    }

    if (record?.status === "absent") {
      badge.classList.add("absent-badge");
      badge.textContent = "欠";
      timeCell.textContent = formatTime(record.updatedAt);
    }

    statusCell.append(badge);
    row.append(nameCell, statusCell, timeCell);
    el.summaryBody.append(row);
  });
}

function renderCalendar() {
  el.calendarGrid.replaceChildren();
  const year = state.calendarMonth.getFullYear();
  const month = state.calendarMonth.getMonth();
  el.monthLabel.textContent = `${year}年 ${month + 1}月`;

  const firstDay = new Date(year, month, 1);
  const start = new Date(year, month, 1 - firstDay.getDay());

  for (let index = 0; index < 42; index += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const dateKey = toDateKey(date);
    const counts = countDay(dateKey);
    const button = document.createElement("button");
    const dayNumber = document.createElement("span");
    const miniCounts = document.createElement("span");
    const presentCount = document.createElement("span");
    const absentCount = document.createElement("span");

    button.type = "button";
    button.className = "calendar-day";
    button.classList.toggle("is-outside", date.getMonth() !== month);
    button.classList.toggle("is-selected", dateKey === state.activeDate);
    button.setAttribute("aria-label", `${formatDateLabel(dateKey)} を選択`);

    dayNumber.className = "calendar-day-number";
    dayNumber.textContent = date.getDate();
    miniCounts.className = "calendar-mini-counts";
    presentCount.className = "mini-present";
    absentCount.className = "mini-absent";
    presentCount.textContent = `出${counts.present}`;
    absentCount.textContent = `欠${counts.absent}`;

    miniCounts.append(presentCount, absentCount);
    button.append(dayNumber, miniCounts);
    button.addEventListener("click", () => {
      state.activeDate = dateKey;
      state.calendarMonth = startOfMonth(parseDateKey(dateKey));
      saveState();
      render();
      switchView("attendance");
    });

    el.calendarGrid.append(button);
  }
}

function renderMembers() {
  el.memberAdminList.replaceChildren();
  el.emptyMembers.classList.toggle("is-visible", state.members.length === 0);

  state.members.forEach((member) => {
    const item = el.memberAdminTemplate.content.firstElementChild.cloneNode(true);
    const input = item.querySelector(".admin-name-input");
    const saveButton = item.querySelector(".save-member-button");
    const deleteButton = item.querySelector(".delete-member-button");

    input.value = member.name;
    saveButton.addEventListener("click", () => updateMember(member.id, input.value));
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") updateMember(member.id, input.value);
    });
    deleteButton.addEventListener("click", () => deleteMember(member.id));

    el.memberAdminList.append(item);
  });
}

function updateMember(memberId, rawName) {
  const name = rawName.trim();
  if (!name) return;
  const member = state.members.find((item) => item.id === memberId);
  if (!member) return;
  member.name = name;
  saveState();
  render();
}

function deleteMember(memberId) {
  const member = state.members.find((item) => item.id === memberId);
  if (!member) return;
  if (!confirm(`${member.name} を名簿から削除しますか？`)) return;

  state.members = state.members.filter((item) => item.id !== memberId);
  Object.values(state.records).forEach((dayRecord) => {
    delete dayRecord[memberId];
  });
  saveState();
  render();
}

function countDay(dateKey) {
  const dayRecord = state.records[dateKey] || {};
  return Object.values(dayRecord).reduce(
    (counts, record) => {
      if (record.status === "present") counts.present += 1;
      if (record.status === "absent") counts.absent += 1;
      return counts;
    },
    { present: 0, absent: 0 },
  );
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDateLabel(dateKey) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(parseDateKey(dateKey));
}

function formatTime(isoString) {
  if (!isoString) return "-";
  return new Intl.DateTimeFormat("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoString));
}
