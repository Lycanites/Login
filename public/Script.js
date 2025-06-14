const express = require("express");
const cors = require("cors");
const session = require("express-session");

const app = express();
const PORT = process.env.PORT || 3000;

// ⚙️ CONFIGURACIÓN CORS PARA PERMITIR COOKIES
app.use(
  cors({
    origin: "https://login-kj9u.onrender.com", // Cambia por el dominio real de tu frontend
    credentials: true, // 🔑 Permite enviar cookies entre frontend y backend
  })
);

app.use(express.json());

// ⚙️ CONFIGURACIÓN DE SESIONES CON COOKIES
app.use(
  session({
    secret: "secreto_muy_seguro", // 🔑 Cambia esto por algo más robusto en producción
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true, // ✅ true para producción (Render usa HTTPS)
      sameSite: "None", // ✅ Necesario para cookies cross-origin
      httpOnly: true, // 🔒 Protección extra para evitar acceso desde JS
    },
  })
);

// 🗂️ USUARIOS SIMULADOS (ejemplo simple, en producción usa base de datos)
const usuarios = [
  {
    id: 1,
    nombre: "André",
    apellidoP: "Hernández",
    usuario: "andrehc",
    password: "12345",
  },
];

// 🔐 Ruta de login
app.post("/api/login", (req, res) => {
  const { usuario, password } = req.body;
  const user = usuarios.find(
    (u) => u.usuario === usuario && u.password === password
  );

  if (user) {
    req.session.usuario = {
      id: user.id,
      nombre: user.nombre,
      apellidoP: user.apellidoP,
      usuario: user.usuario,
    };
    res.json({ mensaje: "Login exitoso", usuario: req.session.usuario });
  } else {
    res.status(401).json({ error: "Credenciales inválidas" });
  }
});

// 📄 Ruta para obtener el perfil (requiere sesión activa)
app.get("/api/perfil", (req, res) => {
  if (req.session.usuario) {
    res.json({ perfil: req.session.usuario });
  } else {
    res.status(401).json({ error: "No autenticado" });
  }
});

// 🔒 Ruta para cerrar sesión
app.post("/api/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: "No se pudo cerrar sesión" });
    } else {
      res.clearCookie("connect.sid"); // nombre por defecto de cookie de express-session
      res.json({ mensaje: "Sesión cerrada" });
    }
  });
});

// 📌 Ruta de registro (opcional, ejemplo simple, sin guardado real)
app.post("/api/registro", (req, res) => {
  const { nombre, apellidoP, usuario, password } = req.body;

  // Valida si ya existe usuario
  if (usuarios.find((u) => u.usuario === usuario)) {
    return res.status(409).json({ error: "El usuario ya existe" });
  }

  const nuevoUsuario = {
    id: usuarios.length + 1,
    nombre,
    apellidoP,
    usuario,
    password,
  };
  usuarios.push(nuevoUsuario);
  res.json({ mensaje: "Registro exitoso", usuario: nuevoUsuario });
});

// ✅ Inicia el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
