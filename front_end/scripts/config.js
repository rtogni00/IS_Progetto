const config = {
  apiUrl:
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
      ? "http://localhost:5000"
      : "https://is-progetto.onrender.com",
};

export default config;
