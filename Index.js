require("dotenv").config();
const express = require("express");
const session = require("express-session");
// const bcrypt = require("bcrypt"); // Eliminamos bcrypt
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(express.static("public"));
const PORT = process.env.PORT || 10000;

app.use(
  cors({
    origin: "https://ciberseguridad-s1yn.onrender.com", // Origen de CORS más general
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(
  session({
    secret: "clave_secreta_facil_de_adivinar", // Clave de sesión débil y hardcodeada
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, httpOnly: false }, // Cookie insegura (no seguro, no httpOnly)
  })
);

// ✅ Conexión con PostgreSQL (Neon)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Validación por lista blanca (se mantiene, pero se relaja para contraseña)
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

  // Validación básica relajada para demostración de vulnerabilidad
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
    password.length < 1 // Contraseña de cualquier longitud (mínimo 1 para no vacía)
  ) {
    return res.status(400).json({ error: "Campos inválidos o incompletos" });
  }

  try {
    // ❌ INSEGURIDAD CRÍTICA: Contraseña almacenada en texto plano
    const plainPassword = password;

    await pool.query(
      `INSERT INTO usuarios (nombre, apellidoP, apellidoM, edad, sexo, origen, usuario, password)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        nombre,
        apellidoP,
        apellidoM,
        edad,
        sexo,
        origen,
        usuario,
        plainPassword, // Aquí se inserta la contraseña sin hash
      ]
    );
    req.session.user = { usuario };
    res.json({ mensaje: "Registro exitoso", usuario });
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      // Manejo de error para usuario duplicado (si la columna usuario es UNIQUE)
      return res.status(409).json({ error: "El usuario ya existe." });
    }
    res
      .status(500)
      .json({ error: "Error en el servidor al intentar registrar." });
  }
});

// Login
app.post("/api/login", async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.status(400).json({ error: "Campos requeridos" });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM usuarios WHERE usuario = $1`,
      [usuario]
    );

    if (result.rows.length > 0) {
      const usuarioData = result.rows[0];
      // ❌ INSEGURIDAD CRÍTICA: Comparación de contraseña en texto plano
      const esValido = password === usuarioData.password; // Comparación directa sin hash

      if (esValido) {
        req.session.user = { usuario: usuarioData.usuario };
        res.json({
          mensaje: "Login exitoso",
          usuario: {
            nombre: usuarioData.nombre,
            apellidoP: usuarioData.apellidoP,
            usuario: usuarioData.usuario,
          },
        });
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

// Ruta para obtener el perfil del usuario logueado
app.get("/api/perfil", async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: "No autenticado" });
  }

  try {
    const result = await pool.query(
      `SELECT nombre, apellidoP, usuario FROM usuarios WHERE usuario = $1`,
      [req.session.user.usuario]
    );

    if (result.rows.length > 0) {
      res.json({ perfil: result.rows[0] });
    } else {
      res.status(404).json({ error: "Perfil no encontrado" });
    }
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    res.status(500).json({ error: "Error en el servidor" });
  }
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

app.listen(PORT, () => {
  console.log(
    `🚀 API de Registro y Login (INSEGURO PARA PRUEBAS) está corriendo en el puerto ${PORT}!`
  );
});
