document.addEventListener("DOMContentLoaded", () => {
  const tableBody = document.querySelector("#buchungen tbody");

  fetch("http://localhost:3000/buchungen")
    .then((response) => response.json())
    .then((data) => {
      data.forEach((data) => {
        const row = document.createElement("tr");
        row.innerHTML = `
        <td><div class="cell-content">${data.id}</div></td>
         <td><div class="cell-content">${data.email}</div></td>
         <td><div class="cell-content">${data.fahrzeug_kennzeichen}</div></td>
         <td><div class="cell-content">${formatDate(data.start_date)}</div></td>
         <td><div class="cell-content">${formatDate(data.end_date)}</div></td>
         <td><div class"cell-content">${data.status}</div></td>
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

  tableBody.addEventListener("dblclick", () => {
    
  });
});



function formatDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}
