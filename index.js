require("dotenv").config();
const express = require("express");
const session = require("express-session");
const { Pool } = require("pg");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(express.static("public"));

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: "http://localhost:5500", credentials: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "clave_secreta_segura",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true solo si usas HTTPS
  })
);

// Conexión a PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 5432,
  ssl: { rejectUnauthorized: false },
});

// Validación por lista blanca
function validarEntrada(data) {
  const camposValidos = [
    "nombre",
    "apellidoP",
    "apellidoM",
    "edad",
    "sexo",
    "origen",
  ];
  return Object.keys(data).every((campo) => camposValidos.includes(campo));
}

// Registro
app.post("/api/registro", async (req, res) => {
  const { nombre, apellidoP, apellidoM, edad, sexo, origen } = req.body;

  if (
    !validarEntrada(req.body) ||
    !nombre ||
    !apellidoP ||
    !apellidoM ||
    !edad ||
    !sexo ||
    !origen
  ) {
    return res.status(400).json({ error: "Campos inválidos o incompletos" });
  }

  try {
    const query = `
      INSERT INTO usuarios (nombre, apellidoP, apellidoM, edad, sexo, origen)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    await pool.query(query, [nombre, apellidoP, apellidoM, edad, sexo, origen]);

    req.session.user = { nombre, apellidoP };
    res.json({ mensaje: "Registro exitoso", usuario: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { nombre, apellidoP } = req.body;

  if (!nombre || !apellidoP) {
    return res.status(400).json({ error: "Campos requeridos" });
  }

  try {
    const query = `
      SELECT * FROM usuarios WHERE nombre = $1 AND apellidoP = $2
    `;
    const result = await pool.query(query, [nombre, apellidoP]);

    if (result.rows.length > 0) {
      req.session.user = { nombre, apellidoP };
      res.json({ mensaje: "Login exitoso", usuario: req.session.user });
    } else {
      res.status(401).json({ error: "Usuario no encontrado" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error del servidor" });
  }
});

// Ver sesión
app.get("/api/sesion", (req, res) => {
  if (req.session.user) {
    res.json({ usuario: req.session.user });
  } else {
    res.status(401).json({ error: "No hay sesión activa" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

app.get("/", (req, res) => {
  res.send("🚀 API de Registro y Login está corriendo!");
});

//Cambio de nombre a index.js
