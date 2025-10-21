function setDatePickerDefaults(inputId, monthsAhead = 4) {
  const dateInput = document.getElementById(inputId);

  const today = new Date();
  const todayStr = formatDate(today);

  const futureDate = new Date(today);
  futureDate.setMonth(futureDate.getMonth() + monthsAhead);
  const futureStr = formatDate(futureDate);

  dateInput.value = todayStr;
  dateInput.min = todayStr;
  dateInput.max = futureStr;
}

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

window.addEventListener("DOMContentLoaded", async () => {
  document.getElementById("vorname").addEventListener("input", function () {
    this.value = this.value.replace(/[0-9]/g, "");
  });
  document.getElementById("nachname").addEventListener("input", function () {
    this.value = this.value.replace(/[0-9]/g, "");
  });
  setDatePickerDefaults("start");
  setDatePickerDefaults("end");
  await loadVehicleTypes();
  wireUpDetailsUpdates();
  const form = document.getElementById("bookingForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      updateDatabase();
      updateVehicleDetails();
      updateTotalPrice();
    });
  }
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
});

const vehicleTypes = new Map();

async function loadVehicleTypes() {
  try {
    const res = await fetch("http://localhost:3000/fahrzeugtyp");
    const data = await res.json();
    data.forEach((row) => {
      const key = getField(row, ["typname", "Typname", "name", "typ"]);
      if (key) vehicleTypes.set(String(key), row);
    });
    updateVehicleDetails();
  } catch (e) {
    console.error("Fahrzeugtypen konnten nicht geladen werden", e);
  }
}

function wireUpDetailsUpdates() {
  ["start", "end", "typ"].forEach((id) => {
    const el = document.getElementById(id);
    if (el)
      el.addEventListener("change", () => {
        updateVehicleDetails();
        updateTotalPrice();
      });
  });
}

function getField(obj, names) {
  for (const n of names)
    if (obj && Object.prototype.hasOwnProperty.call(obj, n)) return obj[n];
  return undefined;
}

function updateVehicleDetails() {
  const typ = document.getElementById("typ")?.value;
  const row = typ ? vehicleTypes.get(String(typ)) : undefined;
  const preis = getField(row, [
    "preis",
    "Preis",
    "price",
    "preis_pro_tag",
    "tagespreis",
  ]);
  const maxDauer = getField(row, [
    "max_dauer",
    "MaxDauer",
    "maxDauer",
    "dauer",
  ]);
  const freiKm = getField(row, ["frei_km", "FreiKM", "freikm", "km_frei"]);
  const kmPreis = getField(row, [
    "km_preis",
    "KmPreis",
    "kmPreis",
    "preis_km",
    "kilometerpreis",
  ]);
  const kaution = getField(row, ["kaution", "Kaution", "deposit"]);

  setDetail("vd-preis", preis != null ? formatEUR(preis) + " / Tag" : "—");
  setDetail("vd-maxdauer", maxDauer != null ? `${maxDauer} Tage` : "—");
  setDetail("vd-freikm", freiKm != null ? `${freiKm} km` : "—");
  setDetail("vd-kmpreis", kmPreis != null ? formatEUR(kmPreis) + " / km" : "—");
  setDetail("vd-kaution", kaution != null ? formatEUR(kaution) : "—");

  updateTotalPrice();
}

function setDetail(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

function updateTotalPrice() {
  const typ = document.getElementById("typ")?.value;
  const row = typ ? vehicleTypes.get(String(typ)) : undefined;
  const preis = getField(row, ["preis", "Preis", "price", "preis_pro_tag"]);
  const start = document.getElementById("start")?.value;
  const end = document.getElementById("end")?.value;
  const out = document.getElementById("vd-gesamt");
  if (!out) return;
  if (!preis || !start || !end) {
    out.textContent = "—";
    return;
  }
  const d1 = new Date(start);
  const d2 = new Date(end);
  const msPerDay = 24 * 60 * 60 * 1000;
  let days = Math.floor((d2 - d1) / msPerDay) + 1; // inkl. Starttag
  if (!Number.isFinite(days) || days <= 0) {
    out.textContent = "—";
    return;
  }
  const total = days * Number(preis);
  out.textContent = formatEUR(total);
}

function formatEUR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

async function updateDatabase() {
  const getEmail = document.getElementById("email").value;
  const getStart = document.getElementById("start").value;
  const getEnd = document.getElementById("end").value;
  const getTyp = document.getElementById("typ").value;

  const getKennzeichen = await checkAvailablePlate(getStart, getEnd, getTyp);

  fetch("http://localhost:3000/buchung", {
    method: "POST",
    body: JSON.stringify({
      email: getEmail,
      start_date: getStart,
      end_date: getEnd,
      fahrzeug_kennzeichen: getKennzeichen,
    }),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
    },
  })
    .then((response) => response.json())
    .then((json) => console.log(json));
}

async function checkAvailablePlate(start, end, typ) {
  const url = `http://localhost:3000/verfuegbar/${start}/${end}/${typ}`;
  let kennzeichen = "";

  await fetch(url)
    .then((response) => response.json())
    .then((data) => {
      kennzeichen = data[0].kennzeichen;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  console.log(kennzeichen);
  return kennzeichen;
}
