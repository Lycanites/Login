window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch(
      "https://ciberseguridad-s1yn.onrender.com/api/perfil",
      {
        credentials: "include",
      }
    );

    const result = await res.json();

    if (res.ok && result.perfil) {
      const perfilDiv = document.getElementById("perfilContainer");
      if (perfilDiv) {
        perfilDiv.innerHTML = `
          <p><strong>Nombre:</strong> ${result.perfil.nombre}</p>
          <p><strong>Apellido:</strong> ${result.perfil.apellidoP}</p>
          <p><strong>Usuario:</strong> ${result.perfil.usuario}</p>
        `;
      } else {
        console.error("Contenedor de perfil no encontrado.");
      }
    } else {
      console.warn("Respuesta del servidor:", result);
      alert("Error al cargar perfil: " + (result.error || "Sesión no válida"));
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error("Error al conectar:", error);
    alert("No se pudo conectar al servidor.");
    window.location.href = "login.html";
  }
});

document
  .getElementById("cerrarSesionBtn")
  .addEventListener("click", async () => {
    const confirmacion = confirm("¿Deseas cerrar sesión?");
    if (!confirmacion) return;

    try {
      const res = await fetch("https://login-kj9u.onrender.com/api/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await res.json();
      if (res.ok) {
        alert(result.mensaje);
        window.location.href = "login.html";
      } else {
        alert("Error al cerrar sesión: " + result.error);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      alert("Error de conexión al cerrar sesión.");
    }
  });
