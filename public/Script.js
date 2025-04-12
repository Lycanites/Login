document
  .getElementById("registroForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((val, key) => (data[key] = val));

    try {
      const res = await fetch(
        "https://ciberseguridad-s1yn.onrender.com/api/perfil",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      const result = await res.json();
      if (res.ok) {
        alert("Registro exitoso. ¡Bienvenido, " + result.usuario.nombre + "!");
        window.location.href = "Login.html"; // Redirección al login
      } else {
        alert("Error: " + (result.error || "No se pudo registrar"));
      }
    } catch (error) {
      console.error("Error al conectar:", error);
      alert("Ocurrió un error al registrar. Intenta más tarde.");
    }
  });
