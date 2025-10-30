function loadTableContent() {
  const tableBody = document.querySelector("#buchungen tbody");

  fetch("/buchungen")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((data) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td><div class="cell-content" id="buchung_${data.id}">${
          data.id
        }</div></td>
         <td id="email"><div class="cell-content">${data.email}</div></td>
         <td id="kennzeichen"><div class="cell-content">${
           data.fahrzeug_kennzeichen
         }</div></td>
         <td id="start_date"><div class="cell-content">${formatDate(
           data.start_date
         )}</div></td>
         <td id="end_date"><div class="cell-content">${formatDate(
           data.end_date
         )}</div></td>
         <td id="status"><div class"cell-content">${data.status}</div></td>
         <td><button id="edit">Bearbeiten</button></td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch((error) => {
      console.error("Fehler beim Laden der Daten:", error);
      const row = document.createElement("tr");
      row.innerHTML = `<td colspan="3">Fehler beim Laden der Daten</td>`;
      tableBody.appendChild(row);
    });
}

 function editListener() {
  const table = document.getElementById("buchungen");
  let id,
    selected_email,
    selected_start_date,
    selected_end_date,
    selected_kennzeichen,
    selected_status;

  table.addEventListener("click", (e) => {
    if (
      e.target.tagName === "BUTTON" &&
      e.target.textContent === "Bearbeiten"
    ) {
      const row = e.target.closest("tr");
      const cells = row.querySelectorAll("td");

      id = cells[0].textContent;
      cells.forEach(async (td, index) => {
        const oldValue = td.textContent.trim();
        if (index === cells.length - 1) return;
        if (cells[index].id === "status") {
          const parent = document.createElement("select");
          await setBuchungsstatus(parent, oldValue);

          td.innerHTML = "";
          td.appendChild(parent);
        }

        if (
          cells[index].id === "start_date" ||
          cells[index].id === "end_date"
        ) {
          td.innerHTML = "";
          td.appendChild(setDatePicker(oldValue));
        }
        if (cells[index].id === "email") {
          email = oldValue;
          td.innerHTML = "";
          td.appendChild(setInputText(oldValue));
        } 
        if (cells[index].id === "kennzeichen") {
          const parent = document.createElement("select");
          await setKennzeichenDropdown(parent);
          kennzeichen = oldValue;
          td.innerHTML = "";
          td.appendChild(parent);
        }
      });
      e.target.textContent = "Speichern";
    } else if (
      e.target.tagName === "BUTTON" &&
      e.target.textContent === "Speichern"
    ) {
      fetch(`/update/${id}`, {
        method: "POST",
        body: JSON.stringify({
          email: getEmail,
          start_date: getStart,
          end_date: getEnd,
          fahrzeug_kennzeichen: getKennzeichen,
          status: status,
        }),
        headers: {
          "Content-type": "application/json; charset=UTF-8",
        },
      })
        .then((response) => response.json())
        .then((json) => console.log(json));
    }
  });
}

 async function setKennzeichenDropdown(selectElement){
  const res =  await fetch("/verfuegbarekennzeichen");
  const kennzeichenList =  await res.json();
  for(const item of kennzeichenList){
    const option = document.createElement("option");
    option.value = item.kennzeichen;
    option.innerHTML = item.kennzeichen;
    selectElement.appendChild(option);
  }
}

async function setBuchungsstatus(selectElement, value){
  const res = await fetch("/buchungsstatus");
  const statusList = await res.json();
  console.log(statusList)
  for(const item of statusList){
    const option = document.createElement("option");
    option.value = item;
    option.innerHTML = item;
    selectElement.appendChild(option);
  }
}

function setInputText(text) {
  const textInput = document.createElement("input");
  textInput.type = "text";
  textInput.value = text;
  return textInput;
}

function setDatePicker(date) {
  const datePicker = document.createElement("input");
  const [day, month, year] = date.split(".");
  const formattedDate = `${year}-${month}-${day}`;
  datePicker.type = "date";
  datePicker.value = formattedDate;
  return datePicker;
}

function setStatusDropdown(zustand) {
  const option = document.createElement("option");
  option.value = zustand;
  option.innerHTML = zustand;
  return option;
}

document.addEventListener("DOMContentLoaded", () => {
  loadTableContent();
  editListener();
});

function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
