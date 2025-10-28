const express = require("express");
const axios = require("axios");
const path = require("path");
const db = require("./db");

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

app.get("/", (req, res) => {
  const indexPath = path.join(__dirname, "public", "index.html");
  res.sendFile(indexPath);
});

app.get("/admin", (req, res) => {
  const adminPath = path.join(__dirname, "public", "adminPanel.html");
  res.sendFile(adminPath);
});

app.get("/edit", (req, res) => {
  const editPath = path.join(__dirname, "public", "editBuchung.html");
  res.sendFile(editPath);
});

app.get("/buchungen", async (req, res) => {
  try {
    const buchungen = await db.query(`SELECT * FROM Buchung`);
    res.json(buchungen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/buchungen/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const buchungen = await db.query(`SELECT * FROM Buchung WHERE id = ${id}`);
    res.json(buchungen);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/fahrzeuge", async (req, res) => {
  try {
    const fahrzeuge = await db.query("SELECT * FROM Fahrzeug");
    res.json(fahrzeuge);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/fahrzeugtyp", async (req, res) => {
  try {
    const fahrzeugtyp = await db.query("SELECT * FROM Fahrzeugtyp");
    res.json(fahrzeugtyp);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/verfuegbar/:start/:end/:typ", async (req, res) => {
  try {
    const start = req.params.start;
    const typ = req.params.typ;
    const end = req.params.end;
    const verfügbar = await db.query(`
    SELECT f.kennzeichen FROM Fahrzeug f
    LEFT JOIN Buchung b ON f.kennzeichen = b.fahrzeug_kennzeichen
      AND b.status NOT LIKE 'genehmigt'
      AND NOT (
        '${end}' < start_date OR '${start}' > end_date
        status = "genehmigt"
      )
    WHERE typname = '${typ}'
    AND b.id IS NULL
    LIMIT 1;
    `);
    res.json(verfügbar);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/buchung", async (req, res) => {
  try {
    const { email, start_date, end_date, fahrzeug_kennzeichen } = req.body;
    if (!email || !start_date || !end_date) {
      return res
        .status(400)
        .json({ error: "Pflicht Felder wurden nicht ausgefüllt" });
    }
    const result = await db.query(
      "INSERT INTO Buchung (email, vertrag, start_date, end_date, fahrzeug_kennzeichen, status) VALUES (?,?,?,?,?,?)",
      [email, null, start_date, end_date, fahrzeug_kennzeichen, "ausstehend"]
    );

    res.status(201).json({ message: "Buchung wurde erfolgreich erstellt" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/update/:id", async (req, res) => {
    id = req.params.id;
    try {
      const {email, kennzeichen, start, end, condition} = req.body;
      const result = await db.query(
        `UPDATE Buchung 
       SET email = ${email}, start_date = ${start}, end_date = ${end}, fahrzeug_kennzeichen = ${kennzeichen}, status = ${condition} 
       WHERE id = ${id}`
      )
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
    
  
});

app.listen(PORT, () => {
  console.log(`Server up and running on http://localhost:${PORT}`);
});
