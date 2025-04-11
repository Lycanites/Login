window.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await fetch("http://localhost:3001/api/perfil", {
      credentials: "include",
    });

    const result = await res.json();

    if (res.ok) {
      const perfilDiv = document.getElementById("perfilContainer");
      perfilDiv.innerHTML = `
          <p><strong>Nombre:</strong> ${result.perfil.nombre}</p>
          <p><strong>Apellido:</strong> ${result.perfil.apellidoP}</p>
          <p><strong>Usuario:</strong> ${result.perfil.usuario}</p>
        `;
    } else {
      alert("Error al cargar perfil: " + result.error);
      window.location.href = "login.html";
    }
  } catch (error) {
    console.error("Error al conectar:", error);
  }
});

document
  .getElementById("cerrarSesionBtn")
  .addEventListener("click", async () => {
    try {
      const res = await fetch("http://localhost:3001/api/logout", {
        method: "POST",
        credentials: "include",
      });

      const result = await res.json();
      if (res.ok) {
        alert(result.mensaje);
        window.location.href = "login.html";
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  });
