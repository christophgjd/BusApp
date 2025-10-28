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
         <td><div class="cell-content">${data.email}</div></td>
         <td><div class="cell-content">${data.fahrzeug_kennzeichen}</div></td>
         <td><div class="cell-content">${formatDate(data.start_date)}</div></td>
         <td><div class="cell-content">${formatDate(data.end_date)}</div></td>
         <td id = "status"><div class"cell-content">${data.status}</div></td>
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

  table.addEventListener("click", (e) => {
    if (
      e.target.tagName === "BUTTON" &&
      e.target.textContent === "Bearbeiten"
    ) {
      const row = e.target.closest("tr");
      const cells = row.querySelectorAll("td");
      console.log(cells);
      cells.forEach((td, index) => {
        const oldValue = td.textContent.trim();
        if (index === cells.length - 1) return;
        if (cells[index].id === "status") {
          const parent = document.createElement("select");
          parent.appendChild(setStatusDropdown("genehmigt"));
          parent.appendChild(setStatusDropdown("Offen"));
          parent.appendChild(setStatusDropdown("Abgelehnt"));
        }
      });
    }
  });
}

function setStatusDropdown(zustand) {
  const option = document.createElement("option");
  option.value = zustand;
  option.innerHTML = zustand;
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
