// ===== API CONFIG =====
const API_KEY = "61e576a4";
const API_BASE = `https://www.omdbapi.com/?apikey=${API_KEY}`;

// ===== STATE =====
let currentMovie = null;
let selectedRating = 0;

// ===== OTT PLATFORM DATABASE =====
// Simulated OTT availability based on genre & production studio patterns
const OTT_PLATFORMS = {
  netflix: { name: "Netflix", class: "ott-netflix", logo: "N", url: (title) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}` },
  prime: { name: "Prime Video", class: "ott-prime", logo: "P", url: (title) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video` },
  disney: { name: "Disney+", class: "ott-disney", logo: "D+", url: (title) => `https://www.disneyplus.com/search/${encodeURIComponent(title)}` },
  hbo: { name: "Max", class: "ott-hbo", logo: "M", url: (title) => `https://play.max.com/search?q=${encodeURIComponent(title)}` },
  apple: { name: "Apple TV+", class: "ott-apple", logo: "▶", url: (title) => `https://tv.apple.com/search?term=${encodeURIComponent(title)}` },
  hulu: { name: "Hulu", class: "ott-hulu", logo: "H", url: (title) => `https://www.hulu.com/search?q=${encodeURIComponent(title)}` },
  peacock: { name: "Peacock", class: "ott-peacock", logo: "P", url: (title) => `https://www.peacocktv.com/search?q=${encodeURIComponent(title)}` },
  paramount: { name: "Paramount+", class: "ott-paramount", logo: "P+", url: (title) => `https://www.paramountplus.com/search/?q=${encodeURIComponent(title)}` },
};

// Genre-to-platform mapping for simulated availability
function getOTTAvailability(movie) {
  if (!movie || movie.Response === "False") return [];

  const title = (movie.Title || "").toLowerCase();
  const genre = (movie.Genre || "").toLowerCase();
  const year = parseInt(movie.Year) || 2000;
  const production = (movie.Production || "").toLowerCase();
  const rated = (movie.Rated || "").toUpperCase();

  const platforms = [];

  // Hash title for deterministic "randomness"
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = ((hash << 5) - hash) + title.charCodeAt(i);
    hash |= 0;
  }
  hash = Math.abs(hash);

  // Netflix: Strong in drama, thriller, sci-fi, newer content
  if (genre.includes("drama") || genre.includes("thriller") || genre.includes("mystery") ||
      (year >= 2015 && hash % 3 === 0) || genre.includes("documentary")) {
    platforms.push("netflix");
  }

  // Prime Video: Broad library, especially action, comedy
  if (genre.includes("action") || genre.includes("comedy") || genre.includes("adventure") ||
      (year >= 2010 && hash % 4 === 1) || genre.includes("sci-fi")) {
    platforms.push("prime");
  }

  // Disney+: Animation, family, Marvel/Star Wars, superhero
  if (genre.includes("animation") || genre.includes("family") || genre.includes("fantasy") ||
      production.includes("disney") || production.includes("marvel") || production.includes("pixar") ||
      production.includes("lucasfilm") || title.includes("star wars") || title.includes("avenger") ||
      title.includes("spider") || title.includes("iron man") || title.includes("frozen") ||
      title.includes("toy story")) {
    platforms.push("disney");
  }

  // Max (HBO): Prestige dramas, DC, Warner Bros
  if (genre.includes("crime") || genre.includes("drama") ||
      production.includes("warner") || production.includes("hbo") ||
      title.includes("batman") || title.includes("harry potter") || title.includes("superman") ||
      (hash % 5 === 2 && year >= 2018)) {
    platforms.push("hbo");
  }

  // Apple TV+: Newer premium content
  if ((year >= 2020 && hash % 6 === 0) || production.includes("apple")) {
    platforms.push("apple");
  }

  // Hulu: TV-style, comedy, drama
  if ((genre.includes("comedy") && hash % 3 !== 0) || genre.includes("romance") ||
      (year >= 2012 && hash % 5 === 3)) {
    platforms.push("hulu");
  }

  // Peacock: Universal / NBC content
  if (production.includes("universal") || production.includes("nbc") ||
      (genre.includes("comedy") && hash % 4 === 0) || title.includes("jurassic") ||
      title.includes("fast") || title.includes("despicable")) {
    platforms.push("peacock");
  }

  // Paramount+: Paramount content
  if (production.includes("paramount") || title.includes("mission impossible") ||
      title.includes("top gun") || title.includes("transformers") ||
      (hash % 7 === 4 && year >= 2015)) {
    platforms.push("paramount");
  }

  // Ensure at least 1-2 platforms
  if (platforms.length === 0) {
    const fallback = ["netflix", "prime", "hulu", "hbo"];
    platforms.push(fallback[hash % fallback.length]);
    if (hash % 2 === 0) {
      const second = fallback[(hash + 1) % fallback.length];
      if (!platforms.includes(second)) platforms.push(second);
    }
  }

  // Cap at 4 platforms
  return [...new Set(platforms)].slice(0, 4);
}

// ===== SEARCH =====
function searchMovie() {
  const query = document.getElementById("movieName").value.trim();
  if (!query) return;

  // Show loader, hide others
  document.getElementById("loader").style.display = "flex";
  document.getElementById("movie-card").style.display = "none";
  document.getElementById("error-msg").style.display = "none";

  fetch(`${API_BASE}&t=${encodeURIComponent(query)}&plot=full`)
    .then((res) => res.json())
    .then((data) => {
      document.getElementById("loader").style.display = "none";

      if (data.Response === "False") {
        document.getElementById("error-text").innerText =
          data.Error || "Movie not found. Try a different name.";
        document.getElementById("error-msg").style.display = "flex";
        return;
      }

      currentMovie = data;
      renderMovieCard(data);
    })
    .catch((err) => {
      document.getElementById("loader").style.display = "none";
      document.getElementById("error-text").innerText =
        "Network error. Please check your connection.";
      document.getElementById("error-msg").style.display = "flex";
      console.error(err);
    });
}

// Enter key support
document.getElementById("movieName").addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchMovie();
});

// ===== RENDER MOVIE CARD =====
function renderMovieCard(data) {
  document.getElementById("title").innerText = data.Title || "N/A";
  document.getElementById("desc").innerText = data.Plot || "No plot available.";
  document.getElementById("actors").innerText = data.Actors || "N/A";
  document.getElementById("directors").innerText = data.Director || "N/A";
  document.getElementById("writers").innerText = data.Writer || "N/A";
  document.getElementById("awards").innerText = data.Awards || "N/A";
  document.getElementById("collection").innerText = data.BoxOffice || "N/A";
  document.getElementById("ratings").innerText = data.imdbRating || "N/A";

  // Poster
  const poster = document.getElementById("poster");
  if (data.Poster && data.Poster !== "N/A") {
    poster.src = data.Poster;
    poster.alt = data.Title + " poster";
  } else {
    poster.src =
      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='390' viewBox='0 0 260 390'%3E%3Crect fill='%231c1c28' width='260' height='390'/%3E%3Ctext x='130' y='195' text-anchor='middle' fill='%235a5a6e' font-size='16' font-family='sans-serif'%3ENo Poster%3C/text%3E%3C/svg%3E";
    poster.alt = "No poster available";
  }

  // Badges
  document.getElementById("year-badge").innerText = data.Year || "";
  document.getElementById("rated-badge").innerText = data.Rated || "";
  document.getElementById("runtime-badge").innerText = data.Runtime || "";

  // Genre tags
  const genreContainer = document.getElementById("genre-tags");
  genreContainer.innerHTML = "";
  if (data.Genre && data.Genre !== "N/A") {
    data.Genre.split(",").forEach((g) => {
      const tag = document.createElement("span");
      tag.className = "genre-tag";
      tag.textContent = g.trim();
      genreContainer.appendChild(tag);
    });
  }

  // Additional ratings (Rotten Tomatoes, Metacritic)
  const rtRating = document.getElementById("rt-rating");
  const mcRating = document.getElementById("mc-rating");
  rtRating.style.display = "none";
  mcRating.style.display = "none";

  if (data.Ratings && Array.isArray(data.Ratings)) {
    data.Ratings.forEach((r) => {
      if (r.Source === "Rotten Tomatoes") {
        document.getElementById("rt-score").innerText = r.Value;
        rtRating.style.display = "flex";
      }
      if (r.Source === "Metacritic") {
        document.getElementById("mc-score").innerText = r.Value;
        mcRating.style.display = "flex";
      }
    });
  }

  // OTT Availability
  renderOTT(data);

  // Wishlist button state
  updateWishlistButton();

  // Reviews
  renderReviews();

  // Show card
  document.getElementById("movie-card").style.display = "block";
}

// ===== OTT RENDERING =====
function renderOTT(movie) {
  const container = document.getElementById("ott-badges");
  container.innerHTML = "";

  const platforms = getOTTAvailability(movie);

  if (platforms.length === 0) {
    container.innerHTML = `<div class="ott-badge ott-unavailable">
      <i class="fa-solid fa-circle-xmark"></i> Not available for streaming
    </div>`;
    return;
  }

  const movieTitle = movie.Title || "";

  platforms.forEach((key) => {
    const platform = OTT_PLATFORMS[key];
    if (!platform) return;

    const link = document.createElement("a");
    link.className = `ott-badge ${platform.class}`;
    link.href = platform.url(movieTitle);
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = `Watch ${movieTitle} on ${platform.name}`;
    link.innerHTML = `
      <span class="ott-logo">${platform.logo}</span>
      ${platform.name}
      <i class="fa-solid fa-arrow-up-right-from-square ott-link-icon"></i>
    `;
    container.appendChild(link);
  });
}

// ===== WISHLIST =====
function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem("movieExplorerWishlist") || "[]");
  } catch {
    return [];
  }
}

function saveWishlist(list) {
  localStorage.setItem("movieExplorerWishlist", JSON.stringify(list));
  updateWishlistCount();
}

function isInWishlist(imdbID) {
  return getWishlist().some((m) => m.imdbID === imdbID);
}

function toggleWishlist() {
  if (!currentMovie) return;

  const list = getWishlist();
  const idx = list.findIndex((m) => m.imdbID === currentMovie.imdbID);

  if (idx !== -1) {
    list.splice(idx, 1);
    saveWishlist(list);
    showToast("Removed from wishlist");
  } else {
    list.push({
      imdbID: currentMovie.imdbID,
      Title: currentMovie.Title,
      Year: currentMovie.Year,
      Poster: currentMovie.Poster,
      imdbRating: currentMovie.imdbRating,
      Genre: currentMovie.Genre,
    });
    saveWishlist(list);
    showToast("Added to wishlist ♥");
  }

  updateWishlistButton();
}

function updateWishlistButton() {
  if (!currentMovie) return;

  const btn = document.getElementById("btn-add-wishlist");
  const icon = document.getElementById("wishlist-icon");
  const text = document.getElementById("wishlist-btn-text");

  if (isInWishlist(currentMovie.imdbID)) {
    btn.classList.add("in-wishlist");
    icon.className = "fa-solid fa-heart";
    text.innerText = "In Wishlist";
  } else {
    btn.classList.remove("in-wishlist");
    icon.className = "fa-regular fa-heart";
    text.innerText = "Add to Wishlist";
  }
}

function updateWishlistCount() {
  const count = getWishlist().length;
  document.getElementById("wishlist-count").innerText = count;
}

function renderWishlist() {
  const list = getWishlist();
  const grid = document.getElementById("wishlist-grid");
  const empty = document.getElementById("wishlist-empty");
  const total = document.getElementById("wishlist-total");

  total.innerText = `${list.length} movie${list.length !== 1 ? "s" : ""}`;

  if (list.length === 0) {
    grid.style.display = "none";
    empty.style.display = "block";
    return;
  }

  grid.style.display = "grid";
  empty.style.display = "none";
  grid.innerHTML = "";

  list.forEach((movie, index) => {
    const card = document.createElement("div");
    card.className = "wishlist-card";
    card.style.animationDelay = `${index * 0.05}s`;

    const posterSrc =
      movie.Poster && movie.Poster !== "N/A"
        ? movie.Poster
        : "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='280' viewBox='0 0 200 280'%3E%3Crect fill='%231c1c28' width='200' height='280'/%3E%3Ctext x='100' y='140' text-anchor='middle' fill='%235a5a6e' font-size='14' font-family='sans-serif'%3ENo Poster%3C/text%3E%3C/svg%3E";

    card.innerHTML = `
      <button class="wishlist-card-remove" onclick="event.stopPropagation(); removeFromWishlist('${movie.imdbID}')" title="Remove from wishlist">
        <i class="fa-solid fa-xmark"></i>
      </button>
      <img src="${posterSrc}" alt="${movie.Title}" loading="lazy">
      <div class="wishlist-card-info">
        <div class="wishlist-card-title" title="${movie.Title}">${movie.Title}</div>
        <div class="wishlist-card-year">${movie.Year || ""}</div>
        ${
          movie.imdbRating && movie.imdbRating !== "N/A"
            ? `<div class="wishlist-card-rating"><i class="fa-solid fa-star"></i> ${movie.imdbRating}</div>`
            : ""
        }
      </div>
    `;

    card.addEventListener("click", () => {
      showTab("search");
      document.getElementById("movieName").value = movie.Title;
      searchMovie();
    });

    grid.appendChild(card);
  });
}

function removeFromWishlist(imdbID) {
  const list = getWishlist().filter((m) => m.imdbID !== imdbID);
  saveWishlist(list);
  renderWishlist();
  showToast("Removed from wishlist");

  // Update button if same movie
  if (currentMovie && currentMovie.imdbID === imdbID) {
    updateWishlistButton();
  }
}

// ===== REVIEWS =====
function getReviews(movieId) {
  try {
    const all = JSON.parse(
      localStorage.getItem("movieExplorerReviews") || "{}"
    );
    return all[movieId] || [];
  } catch {
    return [];
  }
}

function saveReviews(movieId, reviews) {
  try {
    const all = JSON.parse(
      localStorage.getItem("movieExplorerReviews") || "{}"
    );
    all[movieId] = reviews;
    localStorage.setItem("movieExplorerReviews", JSON.stringify(all));
  } catch (e) {
    console.error("Failed to save reviews", e);
  }
}

function renderReviews() {
  if (!currentMovie) return;

  const reviews = getReviews(currentMovie.imdbID);
  const list = document.getElementById("reviews-list");
  const noReviews = document.getElementById("no-reviews");

  list.innerHTML = "";

  if (reviews.length === 0) {
    noReviews.style.display = "block";
    return;
  }

  noReviews.style.display = "none";

  reviews.forEach((review, index) => {
    const card = document.createElement("div");
    card.className = "review-card";

    const initial = (review.name || "A")[0].toUpperCase();
    const stars = renderStars(review.rating);
    const date = new Date(review.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

    card.innerHTML = `
      <button class="review-delete" onclick="deleteReview(${index})" title="Delete review">
        <i class="fa-solid fa-trash-can"></i>
      </button>
      <div class="review-card-header">
        <div class="review-author">
          <div class="review-avatar">${initial}</div>
          <div>
            <div class="review-name">${escapeHtml(review.name)}</div>
            <div class="review-date">${date}</div>
          </div>
        </div>
        <div class="review-stars">${stars}</div>
      </div>
      <p class="review-text">${escapeHtml(review.text)}</p>
    `;

    list.appendChild(card);
  });
}

function renderStars(rating) {
  let html = "";
  for (let i = 1; i <= 5; i++) {
    html +=
      i <= rating
        ? '<i class="fa-solid fa-star"></i>'
        : '<i class="fa-regular fa-star empty"></i>';
  }
  return html;
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function openReviewModal() {
  if (!currentMovie) return;

  document.getElementById("modal-movie-title").innerText = currentMovie.Title;
  document.getElementById("review-name").value = "";
  document.getElementById("review-text").value = "";
  selectedRating = 0;
  updateStarUI();

  document.getElementById("review-modal").style.display = "flex";
  document.body.style.overflow = "hidden";
}

function closeReviewModal() {
  document.getElementById("review-modal").style.display = "none";
  document.body.style.overflow = "";
}

function updateStarUI() {
  const stars = document.querySelectorAll("#star-rating-input .star-btn");
  stars.forEach((star) => {
    const val = parseInt(star.dataset.value);
    if (val <= selectedRating) {
      star.classList.add("active");
      star.querySelector("i").className = "fa-solid fa-star";
    } else {
      star.classList.remove("active");
      star.querySelector("i").className = "fa-regular fa-star";
    }
  });
}

// Star click handlers
document.querySelectorAll("#star-rating-input .star-btn").forEach((star) => {
  star.addEventListener("click", () => {
    selectedRating = parseInt(star.dataset.value);
    updateStarUI();
  });

  star.addEventListener("mouseenter", () => {
    const val = parseInt(star.dataset.value);
    document.querySelectorAll("#star-rating-input .star-btn").forEach((s) => {
      const v = parseInt(s.dataset.value);
      if (v <= val) {
        s.querySelector("i").className = "fa-solid fa-star";
        s.querySelector("i").style.color = "#f5c518";
      } else {
        s.querySelector("i").className = "fa-regular fa-star";
        s.querySelector("i").style.color = "";
      }
    });
  });

  star.addEventListener("mouseleave", () => {
    updateStarUI();
    document.querySelectorAll("#star-rating-input .star-btn i").forEach((i) => {
      i.style.color = "";
    });
  });
});

function submitReview() {
  if (!currentMovie) return;

  const name = document.getElementById("review-name").value.trim() || "Anonymous";
  const text = document.getElementById("review-text").value.trim();

  if (!text) {
    showToast("Please write something!");
    return;
  }

  if (selectedRating === 0) {
    showToast("Please select a star rating!");
    return;
  }

  const review = {
    name,
    text,
    rating: selectedRating,
    date: new Date().toISOString(),
  };

  const reviews = getReviews(currentMovie.imdbID);
  reviews.unshift(review);
  saveReviews(currentMovie.imdbID, reviews);

  closeReviewModal();
  renderReviews();
  showToast("Review submitted! ★");
}

function deleteReview(index) {
  if (!currentMovie) return;

  const reviews = getReviews(currentMovie.imdbID);
  reviews.splice(index, 1);
  saveReviews(currentMovie.imdbID, reviews);
  renderReviews();
  showToast("Review deleted");
}

// Close modal on overlay click
document.getElementById("review-modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) closeReviewModal();
});

// Close modal on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeReviewModal();
});

// ===== TABS =====
function showTab(tab) {
  document.getElementById("tab-search").style.display =
    tab === "search" ? "block" : "none";
  document.getElementById("tab-wishlist").style.display =
    tab === "wishlist" ? "block" : "none";

  document.getElementById("nav-search").classList.toggle("active", tab === "search");
  document.getElementById("nav-wishlist").classList.toggle("active", tab === "wishlist");

  if (tab === "wishlist") {
    renderWishlist();
  }
}

// ===== TOAST =====
function showToast(message) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-text").innerText = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 2500);
}

// ===== INIT =====
updateWishlistCount();