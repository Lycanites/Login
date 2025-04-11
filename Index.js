require("dotenv").config();
const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(express.static("public"));
const PORT = process.env.PORT || 10000;

app.use(cors({ origin: "https://login-kj9u.onrender.com", credentials: true }));
app.use(bodyParser.json());
app.use(
  session({
    secret: "clave_secreta_segura",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// ✅ Conexión con PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    // ✅ Nueva sintaxis para PostgreSQL
    await pool.query(
      `INSERT INTO usuarios (nombre, apellidoP, apellidoM, edad, sexo, origen, usuario, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [nombre, apellidoP, apellidoM, edad, sexo, origen, usuario, hash]
    );
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
    // ✅ PostgreSQL usa query() en lugar de execute()
    const result = await pool.query(
      `SELECT * FROM usuarios WHERE usuario = $1`,
      [usuario]
    );

    if (result.rows.length > 0) {
      const usuarioData = result.rows[0];
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

// Ruta para cerrar sesión
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: "No se pudo cerrar la sesión" });
    }
    res.clearCookie("connect.sid");
    res.json({ mensaje: "Sesión cerrada correctamente" });
  });
});
