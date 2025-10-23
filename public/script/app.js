const url = "http://localhost:3000/";
let globalTagesPreis,
  globalKilometerPreis = 0;

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
  hideError();
  const form = document.getElementById("bookingForm");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      updateDatabase();
    });
  }
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
  document
    .getElementById("typ")
    .addEventListener("change", () => loadVehicleTypes());

  document
    .getElementById("start")
    .addEventListener("change", () => setPreise());
  document.getElementById("end").addEventListener("change", () => setPreise());
});

async function loadVehicleTypes() {
  const currenttyp = document.getElementById("typ").value;

  try {
    const res = await fetch(`${url}fahrzeugtyp`);
    const data = await res.json();
    for (let i in data) {
      console.log(globalTagesPreis);
      if (data[i].name == currenttyp) {
        globalKilometerPreis = data[i].kilometerpreis;
        globalTagesPreis = data[i].tagespreis;
        console.log(globalTagesPreis);
        setPreise();
      }
    }
  } catch (e) {
    console.error("Fahrzeugtypen konnten nicht geladen werden", e);
  }
}

async function setPreise() {
  const dauer = setDauer();
  document.getElementById("vd-preis").innerHTML = globalTagesPreis;
  document.getElementById("vd-kmpreis").innerHTML = globalKilometerPreis;
  document.getElementById("vd-kaution").innerHTML = 100;
  document.getElementById("vd-gesamt").innerHTML =
    globalTagesPreis * dauer + 100;
}

function setDauer() {
  const start = new Date(document.getElementById("start").value);
  const ende = new Date(document.getElementById("end").value);

  const differenzMs = ende - start;
  const tage = Math.floor(differenzMs / (1000 * 60 * 60 * 24)) + 1;

  return tage;
}

function formatEUR(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function hideError() {
  const errorDiv = document.getElementById("error-message");
  errorDiv.style.display = "none";
}

function showError(message) {
  const errorDiv = document.getElementById("error-message");
  errorDiv.textContent = message;
  errorDiv.style.display = "block";
  setTimeout(() => {
    errorDiv.style.display = "none";
  }, 5000);
}

async function updateDatabase() {
  const getEmail = document.getElementById("email").value;
  const getStart = document.getElementById("start").value;
  const getEnd = document.getElementById("end").value;
  const getTyp = document.getElementById("typ").value;

  const getKennzeichen = await checkAvailablePlate(getStart, getEnd, getTyp);
  if (!getKennzeichen) {
    showError(
      `In diesem Zeitraum ist kein Fahrzeug vom Typ ${getTyp} verfügbar`
    );
    return;
  }
  savePdf();
  fetch(`${url}buchung`, {
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

async function savePdf() {
  let file = "";
  let textSize = 11;
  let nameX,
    nameY,
    telefonnummerX,
    telefonnummerY,
    personalnummerX,
    personalnummerY,
    emailX,
    emailY,
    vonDatumX,
    vonDatumY,
    bisDatumX,
    bisDatumY;
  if (document.getElementById("typ").value == "Pritsche") {
    file = "/pdfTemplate/VertragPritsche.pdf";
    nameX = 310;
    nameY = 670;
    telefonnummerX = 340;
    telefonnummerY = 647;
    personalnummerX = 470;
    personalnummerY = 620;
    vonDatumX = 353;
    vonDatumY = 565;
    bisDatumX = 450;
    bisDatumY = 565;
  } else if (document.getElementById("typ").value == "BUS") {
    file = "/pdfTemplate/VertragBus.pdf";
    nameX = 310;
    nameY = 710;
    telefonnummerX = 340;
    telefonnummerY = 675;
    personalnummerX = 450;
    personalnummerY = 650;
    vonDatumX = 335;
    vonDatumY = 595;
    bisDatumX = 435;
    bisDatumY = 595;
  }
  const name =
    document.getElementById("vorname").value +
    " " +
    document.getElementById("nachname").value;
  const telefonnummer = document.getElementById("telefonnummer").value;
  const email = document.getElementById("email").value;
  const vonDatum = document.getElementById("start").value;
  const bisDatum = document.getElementById("end").value;

  const existingPdfBytes = await fetch(file).then((res) => res.arrayBuffer());
  const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);
  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  firstPage.drawText(name, { x: nameX, y: nameY, size: textSize });
  firstPage.drawText(telefonnummer, {
    x: telefonnummerX,
    y: telefonnummerY,
    size: textSize,
  });
  firstPage.drawText(vonDatum, { x: vonDatumX, y: vonDatumY, size: textSize });
  firstPage.drawText(bisDatum, { x: bisDatumX, y: bisDatumY, size: textSize });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "Vertrag.pdf";
  link.click();
}

async function checkAvailablePlate(start, end, typ) {
  let kennzeichen = "";

  await fetch(`${url}verfuegbar/${start}/${end}/${typ}`)
    .then((response) => response.json())
    .then((data) => {
      kennzeichen = data[0].kennzeichen;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  return kennzeichen;
}
