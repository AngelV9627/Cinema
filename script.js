// ===========================
// CONFIGURACIÓN API OMDb
// ===========================
const API_KEY = "1ae3590f";
const BASE_URL = "https://www.omdbapi.com/";

// ===========================
// ELEMENTOS DEL DOM
// ===========================
const mainContent = document.getElementById("main-content");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const logo = document.getElementById("logo");

const modal = document.getElementById("movie-modal");
const modalBody = document.getElementById("modal-body");
const closeModal = modal.querySelector(".close");

// ===========================
// LOGIN / REGISTRO
// ===========================
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const usernameSpan = document.getElementById("username");

const authModal = document.getElementById("auth-modal");
const authForm = document.getElementById("auth-form");
const authTitle = document.getElementById("auth-title");
const authSubmit = document.getElementById("auth-submit");
const switchAuth = document.getElementById("switch-auth");

let isLogin = true;
let currentUser = localStorage.getItem("currentUser") || null;
let favorites = [];

// --- FUNCIONES LOGIN / REGISTRO ---
loginBtn.addEventListener("click", () => { 
  authModal.style.display = "block"; 
  isLogin = true;
  authTitle.textContent = "Login";
  authSubmit.textContent = "Login";
});

switchAuth.addEventListener("click", () => {
  isLogin = !isLogin;
  authTitle.textContent = isLogin ? "Login" : "Registro";
  authSubmit.textContent = isLogin ? "Login" : "Registrar";
  switchAuth.textContent = isLogin ? "Regístrate" : "Inicia sesión";
});

authModal.querySelector(".close").addEventListener("click", () => authModal.style.display = "none");
window.addEventListener("click", e => { if(e.target === authModal) authModal.style.display = "none"; });

authForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("auth-username").value.trim();
  const password = document.getElementById("auth-password").value.trim();
  if(!username || !password) return;

  let users = JSON.parse(localStorage.getItem("users")) || {};

  if(isLogin) {
    if(users[username] && users[username] === password) {
      alert("Login exitoso");
      currentUser = username;
      localStorage.setItem("currentUser", currentUser);
      loadUserFavorites();
      updateUserUI();
      authModal.style.display = "none";
    } else alert("Usuario o contraseña incorrecta");
  } else {
    if(users[username]) alert("Usuario ya existe");
    else {
      users[username] = password;
      localStorage.setItem("users", JSON.stringify(users));
      alert("Usuario registrado");
      isLogin = true;
      authTitle.textContent = "Login";
      authSubmit.textContent = "Login";
      switchAuth.textContent = "Regístrate";
    }
  }
});

logoutBtn.addEventListener("click", () => {
  currentUser = null;
  favorites = [];
  localStorage.removeItem("currentUser");
  updateUserUI();
});

function updateUserUI() {
  if(currentUser) {
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    usernameSpan.style.display = "inline-block";
    usernameSpan.textContent = currentUser;
  } else {
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    usernameSpan.style.display = "none";
  }
}

function loadUserFavorites() {
  if(!currentUser) return;
  let allFavorites = JSON.parse(localStorage.getItem("allFavorites")) || {};
  favorites = allFavorites[currentUser] || [];
}

// ===========================
// CATEGORÍAS
// ===========================
const categories = [
  { name: "Acción", query: "action", type: "movie" },
  { name: "Comedia", query: "comedy", type: "movie" },
  { name: "Drama", query: "drama", type: "movie" },
  { name: "Ciencia Ficción", query: "sci-fi", type: "movie" },
  { name: "Series Populares", query: "popular", type: "series" }
];

// --- Cargar categorías ---
async function loadCategories() {
  mainContent.innerHTML = "";
  loadUserFavorites();

  for(let cat of categories) {
    const section = document.createElement("section");
    section.classList.add("movie-section");
    section.innerHTML = `<h2>${cat.name}</h2><div class="movies-row"></div>`;
    mainContent.appendChild(section);

    const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(cat.query)}&type=${cat.type}&page=1`);
    const data = await res.json();
    const movies = data.Search || [];
    displayMovies(movies, section.querySelector(".movies-row"));
  }
}

// --- Mostrar películas ---
function displayMovies(movies, container) {
  container.innerHTML = "";
  movies.forEach(movie => {
    const card = createMovieCard(movie);
    container.appendChild(card);
  });
}

// --- Tarjeta película/serie ---
function createMovieCard(movie) {
  const card = document.createElement("div");
  card.classList.add("movie-card");

  const isFav = favorites.some(fav => fav.imdbID === movie.imdbID);

  card.innerHTML = `
    <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/300x450?text=No+Image"}" alt="${movie.Title}">
    <h3>${movie.Title}</h3>
    <p>${movie.Year}</p>
    <div class="favorite-btn">${isFav ? "★" : "☆"}</div>
  `;

  card.querySelector("h3,p").addEventListener("click", () => openModal(movie.imdbID));
  card.querySelector(".favorite-btn").addEventListener("click", e => {
    e.stopPropagation();
    toggleFavorite(movie);
    card.querySelector(".favorite-btn").textContent = favorites.some(fav => fav.imdbID === movie.imdbID) ? "★" : "☆";
  });

  return card;
}

// --- Favoritos ---
function toggleFavorite(movie) {
  if(!currentUser) { alert("Debes iniciar sesión"); return; }

  let allFavorites = JSON.parse(localStorage.getItem("allFavorites")) || {};
  let userFavs = allFavorites[currentUser] || [];

  const index = userFavs.findIndex(fav => fav.imdbID === movie.imdbID);
  if(index > -1) userFavs.splice(index, 1);
  else userFavs.push(movie);

  allFavorites[currentUser] = userFavs;
  localStorage.setItem("allFavorites", JSON.stringify(allFavorites));
  favorites = userFavs;
}

// ===========================
// MODAL
// ===========================
async function openModal(imdbID) {
  const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&i=${imdbID}&plot=full`);
  const movie = await res.json();

  modalBody.innerHTML = `
    <h2>${movie.Title} (${movie.Year})</h2>
    <img src="${movie.Poster !== "N/A" ? movie.Poster : "https://via.placeholder.com/600x900?text=No+Image"}" alt="${movie.Title}">
    <p><strong>Tipo:</strong> ${movie.Type === "series" ? "Serie" : "Película"}</p>
    <p><strong>Género:</strong> ${movie.Genre}</p>
    <p><strong>Duración:</strong> ${movie.Runtime}</p>
    <p><strong>Sinopsis:</strong> ${movie.Plot}</p>
  `;

  modal.style.display = "block";
}

closeModal.addEventListener("click", () => modal.style.display = "none");
window.addEventListener("click", e => { if(e.target == modal) modal.style.display = "none"; });

// ===========================
// BUSCADOR
// ===========================
searchForm.addEventListener("submit", async e => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if(!query) return;

  mainContent.innerHTML = "";
  const types = ["movie","series"];
  for(let type of types){
    const res = await fetch(`${BASE_URL}?apikey=${API_KEY}&s=${encodeURIComponent(query)}&type=${type}`);
    const data = await res.json();
    const movies = data.Search || [];
    if(movies.length>0){
      const section = document.createElement("section");
      section.classList.add("movie-section");
      section.innerHTML = `<h2>Resultados para "${query}" (${type==="series"?"Series":"Películas"})</h2><div class="movies-row"></div>`;
      mainContent.appendChild(section);
      displayMovies(movies, section.querySelector(".movies-row"));
    }
  }
});

// ===========================
// LOGO - INICIO
// ===========================
logo.addEventListener("click", () => {
  searchInput.value = "";
  loadCategories();
});

// ===========================
// INICIALIZACIÓN
// ===========================
window.addEventListener("DOMContentLoaded", () => loadCategories());
updateUserUI();
