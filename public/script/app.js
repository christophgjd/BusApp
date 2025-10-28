let vehicles, selectedVehicle;

function formatDate(date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function setDatePickerDefaults(inputId, monthsAhead = 3) {
  const dateInput = document.getElementById(inputId);
  dateInput.addEventListener("change", () => setPreise());

  const today = new Date();
  const todayStr = formatDate(today);

  const futureDate = new Date(today);
  futureDate.setMonth(futureDate.getMonth() + monthsAhead);
  const futureStr = formatDate(futureDate);

  dateInput.value = todayStr;
  dateInput.min = todayStr;
  dateInput.max = futureStr;
}

function nameInputValidation(inputId) {
  document.getElementById(inputId).addEventListener("input", function () {
    this.value = this.value.replace(/[0-9]/g, "");
  });
}

function submitBookingListner() {
  const form = document.getElementById("bookingForm");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.reportValidity();
    updateDatabase();
  });
}

function impressumYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

window.addEventListener("DOMContentLoaded", async () => {
  // set default values & add listeners
  setDatePickerDefaults("start");
  setDatePickerDefaults("end");
  impressumYear();

  // database requests
  await loadVehicleTypes();

  // append needed listners
  nameInputValidation("vorname");
  nameInputValidation("nachname");
  submitBookingListner();
});

async function loadVehicleTypes() {
  try {
    const res = await fetch(`/fahrzeugtyp`);
    vehicles = await res.json();

    const parent = document.getElementById("vehicle-type");
    for (let i in vehicles) {
      const option = document.createElement("option");
      option.value = vehicles[i].name;
      option.innerHTML = vehicles[i].name;
      parent.appendChild(option);
    }

    selectedVehicle = vehicles[0];
    setPreise();
    document
      .getElementById("vehicle-type")
      .addEventListener("change", setPreise);
  } catch (e) {
    console.error("Fahrzeugtypen konnten nicht geladen werden", e);
  }
}

async function setPreise() {
  selectedVehicle = vehicles.find(
    (el) => el.name == document.getElementById("vehicle-type").value
  );
  const dauer = setDauer();
  document.getElementById("vd-preis").innerHTML =
    selectedVehicle.tagespreis + "€";
  document.getElementById("vd-kmpreis").innerHTML =
    selectedVehicle.kilometerpreis + "€";
  document.getElementById("vd-kaution").innerHTML =
    selectedVehicle.kaution + "€";
  document.getElementById("vd-gesamt").innerHTML =
    selectedVehicle.tagespreis * dauer + selectedVehicle.kaution + "€";
}

function setDauer() {
  const start = new Date(document.getElementById("start").value);
  const ende = new Date(document.getElementById("end").value);

  const differenzMs = ende - start;
  const tage = Math.floor(differenzMs / (1000 * 60 * 60 * 24)) + 1;

  return tage;
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
  const getTyp = document.getElementById("vehicle-type").value;

  const getKennzeichen = await checkAvailablePlate(getStart, getEnd, getTyp);
  if (!getKennzeichen) {
    showError(
      `In diesem Zeitraum ist kein Fahrzeug vom Typ ${getTyp} verfügbar`
    );
    return;
  }
  savePdf();
  fetch("/buchung", {
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
  if (document.getElementById("vehicle-type").value == "Pritsche") {
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

  await fetch(`/verfuegbar/${start}/${end}/${typ}`)
    .then((response) => response.json())
    .then((data) => {
      kennzeichen = data[0].kennzeichen;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
  return kennzeichen;
}
