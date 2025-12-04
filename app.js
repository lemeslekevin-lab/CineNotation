// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Remplacer par l'URL de votre Web App Google Apps Script
  API_URL: 'https://script.google.com/macros/s/AKfycbza-chRRLGabIBUgwoj4E0BB16ugVu_eTYJlR7HMDtHuZYCROr5zWlqEmrjI-nOwyuYWA/exec’
};

// ============================================
// ÉTAT DE L'APPLICATION
// ============================================

let currentMovieIndex = 0;
let moviesToRate = [];
let genres = [];

// ============================================
// INITIALISATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Application initialisée');
  
  // Charger les genres
  await loadGenres();
  
  // Charger les films à noter
  await loadUnratedMovies();
});

// ============================================
// CHARGEMENT DES GENRES
// ============================================

async function loadGenres() {
  try {
    const response = await fetch(`${CONFIG.API_URL}?action=getGenres`);
    const data = await response.json();
    
    if (data.genres && data.genres.length > 0) {
      genres = data.genres;
      populateGenreSelect();
    }
  } catch (error) {
    console.error('Erreur chargement genres:', error);
    // Utiliser des genres par défaut
    genres = ['Action', 'Aventure', 'Comédie', 'Drame', 'Fantastique', 'Horreur', 'Romance', 'Science-Fiction', 'Thriller'];
    populateGenreSelect();
  }
}

function populateGenreSelect() {
  const select = document.getElementById('genre-select');
  
  // Vider les options existantes sauf la première (placeholder)
  while (select.options.length > 1) {
    select.remove(1);
  }
  
  // Ajouter les genres
  genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre.toLowerCase();
    option.textContent = genre;
    select.appendChild(option);
  });
}

// ============================================
// CHARGEMENT DES FILMS À NOTER
// ============================================

async function loadUnratedMovies() {
  const loadingIndicator = document.getElementById('loadingIndicator');
  const noMoviesMessage = document.getElementById('noMoviesMessage');
  const ticketCard = document.getElementById('ticketCard');
  const errorMessage = document.getElementById('errorMessage');
  
  try {
    loadingIndicator.style.display = 'block';
    noMoviesMessage.style.display = 'none';
    ticketCard.style.display = 'none';
    errorMessage.style.display = 'none';
    
    const response = await fetch(`${CONFIG.API_URL}?action=getUnratedMovies`);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Erreur lors du chargement');
    }
    
    moviesToRate = data.movies || [];
    
    loadingIndicator.style.display = 'none';
    
    if (moviesToRate.length === 0) {
      noMoviesMessage.style.display = 'block';
    } else {
      currentMovieIndex = 0;
      displayCurrentMovie();
      ticketCard.style.display = 'flex';
      setupFormHandlers();
    }
    
  } catch (error) {
    console.error('Erreur:', error);
    loadingIndicator.style.display = 'none';
    errorMessage.textContent = `Erreur: ${error.message}`;
    errorMessage.style.display = 'block';
  }
}

// ============================================
// AFFICHAGE DU FILM ACTUEL
// ============================================

function displayCurrentMovie() {
  const movie = moviesToRate[currentMovieIndex];
  
  if (!movie) {
    document.getElementById('noMoviesMessage').style.display = 'block';
    document.getElementById('ticketCard').style.display = 'none';
    return;
  }
  
  // Titre
  document.getElementById('movieTitle').textContent = movie.titre;
  
  // Affiche
  const posterImg = document.getElementById('moviePoster');
  if (movie.affiche && movie.affiche !== '') {
    posterImg.src = movie.affiche;
    posterImg.onerror = () => {
      posterImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="296" height="242" viewBox="0 0 296 242"%3E%3Crect fill="%23e0e0e0" width="296" height="242"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3EAffiche non disponible%3C/text%3E%3C/svg%3E';
    };
  } else {
    posterImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="296" height="242" viewBox="0 0 296 242"%3E%3Crect fill="%23e0e0e0" width="296" height="242"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="18" fill="%23999"%3EAffiche non disponible%3C/text%3E%3C/svg%3E';
  }
  
  // Date
  document.getElementById('movieDate').textContent = movie.jourSeance || 'XX/XX/XXXX';
  
  // Heure
  document.getElementById('movieTime').textContent = movie.heureSeance || 'XX:XX';
  
  // Durée
  document.getElementById('movieDuration').textContent = movie.duree || 'XhXX';
  
  // Langue
  document.getElementById('movieLang').textContent = movie.langue || 'VF';
  
  // Salle
  const salleText = movie.salle ? `Salle ${movie.salle}` : 'Salle XX';
  document.getElementById('movieRoom').textContent = salleText;
  
  // Siège
  const siegeText = movie.siege ? `Siège ${movie.siege}` : 'Siège AXX';
  document.getElementById('movieSeat').textContent = siegeText;
  
  // Réinitialiser le formulaire
  document.getElementById('notationForm').reset();
}

// ============================================
// GESTION DU FORMULAIRE
// ============================================

function setupFormHandlers() {
  const form = document.getElementById('notationForm');
  const submitBtn = document.getElementById('submitBtn');
  
  // Retirer les anciens handlers
  submitBtn.replaceWith(submitBtn.cloneNode(true));
  const newSubmitBtn = document.getElementById('submitBtn');
  
  newSubmitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    await handleSubmit();
  });
}

async function handleSubmit() {
  const movie = moviesToRate[currentMovieIndex];
  
  // Récupérer les valeurs du formulaire
  const ratingInput = document.querySelector('input[name="rating"]:checked');
  const favoriteInput = document.getElementById('favorite-checkbox');
  const genreSelect = document.getElementById('genre-select');
  
  // Validation
  if (!ratingInput) {
    alert('Veuillez sélectionner une note');
    return;
  }
  
  if (!genreSelect.value) {
    alert('Veuillez sélectionner un genre');
    return;
  }
  
  // Préparer les données
  const movieData = {
    ...movie,
    note: parseInt(ratingInput.value),
    coupDeCoeur: favoriteInput.checked,
    genre: genreSelect.options[genreSelect.selectedIndex].text
  };
  
  // Sauvegarder
  try {
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.querySelector('.text-wrapper-3').textContent = 'Enregistrement...';
    
    const response = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'saveRating',
        movie: movieData
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Passer au film suivant ou afficher un message
      currentMovieIndex++;
      
      if (currentMovieIndex < moviesToRate.length) {
        displayCurrentMovie();
      } else {
        // Tous les films ont été notés
        document.getElementById('ticketCard').style.display = 'none';
        const noMoviesMessage = document.getElementById('noMoviesMessage');
        noMoviesMessage.innerHTML = '<p>Tous les films ont été notés ! 🎉</p>';
        noMoviesMessage.style.display = 'block';
      }
      
      submitBtn.disabled = false;
      submitBtn.querySelector('.text-wrapper-3').textContent = 'Enregistrer';
      
    } else {
      throw new Error(result.error || 'Erreur lors de la sauvegarde');
    }
    
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    alert('Erreur lors de la sauvegarde: ' + error.message);
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = false;
    submitBtn.querySelector('.text-wrapper-3').textContent = 'Enregistrer';
  }
}

// ============================================
// GESTION DES ÉTOILES (effet visuel)
// ============================================

document.addEventListener('DOMContentLoaded', () => {
  const starInputs = document.querySelectorAll('.star-input');
  
  starInputs.forEach((input, index) => {
    input.addEventListener('change', () => {
      if (input.checked) {
        updateStarsVisual(index + 1);
      }
    });
  });
});

function updateStarsVisual(rating) {
  const starLabels = document.querySelectorAll('.star-label img');
  
  starLabels.forEach((img, index) => {
    if (index < rating) {
      img.style.filter = 'brightness(1.1) saturate(1.3)';
    } else {
      img.style.filter = 'brightness(0.8) saturate(0.5)';
    }
  });
}
