require("dotenv").config();
const express = require("express");
const session = require("express-session");
const mysql = require("mysql2/promise");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: "http://localhost:5500", credentials: true })); // Cambia el puerto si usas otro
app.use(bodyParser.json());
app.use(
  session({
    secret: "clave_secreta_segura",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // true solo con HTTPS
  })
);

// Conexión a la base de datos
const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "registro_pastel",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
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

// Ruta de registro
app.post("/api/registro", async (req, res) => {
  const { nombre, apellidoP, apellidoM, edad, sexo, origen } = req.body;

  // Validación de entrada
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
    const conn = await pool.getConnection();
    const query = `
      INSERT INTO usuarios (nombre, apellidoP, apellidoM, edad, sexo, origen)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await conn.execute(query, [
      nombre,
      apellidoP,
      apellidoM,
      edad,
      sexo,
      origen,
    ]);
    conn.release();

    // Guardar sesión
    req.session.user = { nombre, apellidoP };
    res.json({ mensaje: "Registro exitoso", usuario: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Ruta de login
app.post("/api/login", async (req, res) => {
  const { nombre, apellidoP } = req.body;

  if (!nombre || !apellidoP) {
    return res.status(400).json({ error: "Campos requeridos" });
  }

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      `SELECT * FROM usuarios WHERE nombre = ? AND apellidoP = ?`,
      [nombre, apellidoP]
    );
    conn.release();

    if (rows.length > 0) {
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

// Ruta de sesión
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
