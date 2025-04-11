document
  .getElementById("loginForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = {};
    formData.forEach((val, key) => (data[key] = val));

    try {
      const res = await fetch("http://localhost:3001/api/registro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await res.json();
      if (res.ok) {
        alert("Bienvenido, " + result.usuario.nombre + "!");
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error al conectar:", error);
    }
  });
