require("dotenv").config();
const express = require("express");
const session = require("express-session");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");

const app = express();
app.use(express.static("public"));
const PORT = process.env.PORT || 10000;

app.use(cors({ origin: "http://localhost:5500", credentials: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "clave_secreta_segura",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
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
    "usuario",
    "password",
  ];
  return Object.keys(data).every((campo) => camposValidos.includes(campo));
}

// Registro
app.post("/api/registro", async (req, res) => {
  const {
    nombre,
    apellidoP,
    apellidoM,
    edad,
    sexo,
    origen,
    usuario,
    password,
  } = req.body;

  if (
    !validarEntrada(req.body) ||
    !nombre ||
    !apellidoP ||
    !apellidoM ||
    !edad ||
    !sexo ||
    !origen ||
    !usuario ||
    !password ||
    password.length < 8
  ) {
    return res.status(400).json({ error: "Campos inválidos o incompletos" });
  }

  try {
    const hash = await bcrypt.hash(password, 10);
    const conn = await pool.getConnection();
    const query = `
      INSERT INTO usuarios (nombre, apellidoP, apellidoM, edad, sexo, origen, usuario, password)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await conn.execute(query, [
      nombre,
      apellidoP,
      apellidoM,
      edad,
      sexo,
      origen,
      usuario,
      hash,
    ]);
    conn.release();
    req.session.user = { usuario };
    res.json({ mensaje: "Registro exitoso", usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error en el servidor" });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: "Campos requeridos" });
  }

  try {
    const conn = await pool.getConnection();
    const [rows] = await conn.execute(
      `SELECT * FROM usuarios WHERE usuario = ?`,
      [usuario]
    );
    conn.release();

    if (rows.length > 0) {
      const usuarioData = rows[0];
      const esValido = await bcrypt.compare(password, usuarioData.password);

      if (esValido) {
        req.session.user = { usuario };
        res.json({ mensaje: "Login exitoso", usuario });
      } else {
        res.status(401).json({ error: "Contraseña incorrecta" });
      }
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
  console.log(`🚀 API de Registro y Login está corriendo!`);
});
