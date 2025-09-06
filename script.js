document.addEventListener("DOMContentLoaded", function () {
  // Elementos do DOM
  const gamesContainer = document.getElementById("games-container");
  const noGames = document.getElementById("no-games");
  const modal = document.getElementById("game-modal");
  const gameForm = document.getElementById("game-form");
  const imageUploadArea = document.getElementById("image-upload-area");
  const imageUploadInput = document.getElementById("image-upload-input");
  const imagePreview = document.getElementById("image-preview");
  const starRating = document.getElementById("star-rating");
  const ratingText = document.getElementById("rating-text");
  const closeModalBtn = document.getElementById("close-modal");
  const cancelButton = document.getElementById("cancel-button");
  const addGameBtn = document.getElementById("add-game-btn");
  const emptyAddBtn = document.getElementById("empty-add-btn");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const currentFilterText = document.getElementById("current-filter");
  const totalGamesEl = document.getElementById("total-games");
  const playedGamesEl = document.getElementById("played-games");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIcon = themeToggle.querySelector("i");
  const uploadProgress = document.getElementById("upload-progress");
  const progressFill = document.getElementById("progress-fill");
  const progressText = document.getElementById("progress-text");
  const submitButton = document.getElementById("submit-button");

  // Variáveis de estado
  let currentFilter = "all";
  let selectedRating = 0;
  let selectedImage = null;
  let games = JSON.parse(localStorage.getItem("games")) || [];
  let editingGameId = null;

  // Verificar preferência de tema salva
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "light") {
    document.body.classList.remove("dark-mode");
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
  } else {
    document.body.classList.add("dark-mode");
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
  }

  // Textos para avaliações
  const ratingTexts = {
    0: "Sem avaliação",
    1: "Péssimo",
    2: "Ruim",
    3: "Regular",
    4: "Bom",
    5: "Excelente",
  };

  // Inicialização
  renderGames();
  updateNoGamesMessage();
  updateStats();

  // Event Listeners
  addGameBtn.addEventListener("click", () => openModal());
  emptyAddBtn.addEventListener("click", () => openModal());
  closeModalBtn.addEventListener("click", () => closeModal());
  cancelButton.addEventListener("click", () => closeModal());
  imageUploadArea.addEventListener("click", () => imageUploadInput.click());

  // Toggle de tema
  themeToggle.addEventListener("click", toggleTheme);

  imageUploadInput.addEventListener("change", function (e) {
    if (this.files && this.files[0]) {
      const file = this.files[0];
      // Verificar se é uma imagem
      if (!file.type.match("image.*")) {
        alert("Por favor, selecione um arquivo de imagem.");
        return;
      }

      // Verificar tamanho do arquivo (máximo 10MB para alta resolução)
      if (file.size > 10 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 10MB.");
        return;
      }

      // Processar a imagem
      processImage(file);
    }
  });

  starRating.querySelectorAll("i").forEach((star) => {
    star.addEventListener("click", function () {
      const value = parseInt(this.getAttribute("data-value"));
      setRating(value);
    });

    star.addEventListener("mouseover", function () {
      const value = parseInt(this.getAttribute("data-value"));
      highlightStars(value);
    });
  });

  starRating.addEventListener("mouseleave", function () {
    highlightStars(selectedRating);
  });

  gameForm.addEventListener("submit", function (e) {
    e.preventDefault();
    saveGame();
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      const filter = this.getAttribute("data-filter");
      setFilter(filter, this.textContent.trim());
    });
  });

  // Fechar modal ao clicar fora dele
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Inicializar display das estrelas
  initializeStarDisplay();

  // Funções
  function toggleTheme() {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      themeIcon.classList.remove("fa-moon");
      themeIcon.classList.add("fa-sun");
      localStorage.setItem("theme", "dark");
    } else {
      themeIcon.classList.remove("fa-sun");
      themeIcon.classList.add("fa-moon");
      localStorage.setItem("theme", "light");
    }
  }

  function openModal(game = null) {
    editingGameId = game ? game.id : null;

    // Preencher o formulário se for edição
    if (game) {
      document.getElementById("game-title").value = game.title;
      document.querySelector(
        `input[name="status"][value="${game.status}"]`
      ).checked = true;
      setRating(game.rating);

      if (game.image) {
        selectedImage = game.image;
        imagePreview.innerHTML = `<img src="${game.image}" alt="Preview">`;
      } else {
        selectedImage = null;
        imagePreview.innerHTML = `
                      <i class="fas fa-cloud-upload-alt"></i>
                      <p>Clique para adicionar uma imagem</p>
                  `;
      }

      document.getElementById("modal-title").textContent = "Editar Jogo";
    } else {
      // Limpar o formulário para novo jogo
      gameForm.reset();
      setRating(0);
      selectedImage = null;
      imagePreview.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Clique para adicionar uma imagem</p>
            `;
      document.getElementById("modal-title").textContent =
        "Adicionar Novo Jogo";
    }

    // Esconder barra de progresso
    uploadProgress.style.display = "none";

    modal.style.display = "flex";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
  }

  function setRating(value) {
    selectedRating = value;
    highlightStars(value);
    ratingText.textContent = ratingTexts[value];
  }

  function highlightStars(value) {
    const stars = starRating.querySelectorAll("i");

    stars.forEach((star) => {
      const starValue = parseInt(star.getAttribute("data-value"));
      if (starValue <= value) {
        star.classList.add("active");
        star.classList.remove("far");
        star.classList.add("fas");
      } else {
        star.classList.remove("active");
        star.classList.add("far");
        star.classList.remove("fas");
      }
    });
  }

  function initializeStarDisplay() {
    // Garantir que as estrelas estejam visíveis ao carregar a página
    const stars = starRating.querySelectorAll("i");
    stars.forEach((star) => {
      star.classList.add("far"); // Garantir que usamos o ícone de estrela vazia
      star.classList.remove("fas"); // Remover ícone de estrela preenchida se existir
    });

    // Destacar estrelas baseado na avaliação atual
    highlightStars(selectedRating);
  }

  function setFilter(filter, filterName) {
    currentFilter = filter;

    // Atualizar botões de filtro
    filterButtons.forEach((button) => {
      if (button.getAttribute("data-filter") === filter) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    });

    // Atualizar texto do filtro atual
    currentFilterText.textContent = filterName;

    renderGames();
  }

  function processImage(file) {
    // Mostrar barra de progresso
    uploadProgress.style.display = "block";
    progressFill.style.width = "30%";
    progressText.textContent = "Carregando imagem...";

    const reader = new FileReader();
    reader.onload = function (e) {
      progressFill.style.width = "60%";
      progressText.textContent = "Processando imagem...";

      const img = new Image();
      img.src = e.target.result;

      img.onload = function () {
        // Criar canvas para redimensionamento
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Definir dimensões desejadas (proporção 3:4 para card mais baixo)
        const targetWidth = 360;
        const targetHeight = 480;

        // Configurar canvas com as dimensões desejadas
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calcular escala para preencher o canvas (cover)
        const scale = Math.max(
          targetWidth / img.width,
          targetHeight / img.height
        );

        // Calcular novas dimensões
        const newWidth = img.width * scale;
        const newHeight = img.height * scale;

        // Calcular posição para centralizar
        const x = (targetWidth - newWidth) / 2;
        const y = (targetHeight - newHeight) / 2;

        // Preencher o fundo com cor neutra (para áreas transparentes)
        ctx.fillStyle = "#2a2d37";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Desenhar imagem redimensionada
        ctx.drawImage(img, x, y, newWidth, newHeight);

        try {
          // Exportar com qualidade
          selectedImage = canvas.toDataURL("image/jpeg", 0.9);

          // Atualizar preview
          imagePreview.innerHTML = `<img src="${selectedImage}" alt="Preview">`;

          // Completar barra de progresso
          progressFill.style.width = "100%";
          progressText.textContent = "Imagem processada com sucesso!";

          // Esconder barra de progresso após um tempo
          setTimeout(() => {
            uploadProgress.style.display = "none";
          }, 700);
        } catch (error) {
          // Fallback: usar a imagem original
          selectedImage = e.target.result;
          imagePreview.innerHTML = `<img src="${selectedImage}" alt="Preview">`;
          uploadProgress.style.display = "none";
          alert("Erro ao processar a imagem. Usando imagem original.");
        }
      };

      img.onerror = function () {
        alert("Erro ao carregar a imagem. Tente novamente.");
        uploadProgress.style.display = "none";
      };
    };

    reader.onerror = function () {
      alert("Erro ao ler o arquivo. Tente novamente.");
      uploadProgress.style.display = "none";
    };

    reader.readAsDataURL(file);
  }

  function saveGame() {
    const title = document.getElementById("game-title").value;
    const status = document.querySelector('input[name="status"]:checked').value;

    // Validar título
    if (!title.trim()) {
      alert("Por favor, insira um título para o jogo.");
      return;
    }

    // Desabilitar botão para evitar múltiplos cliques
    submitButton.disabled = true;
    submitButton.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> Salvando...';

    // Simular tempo de salvamento
    setTimeout(() => {
      if (editingGameId !== null) {
        // Editar jogo existente
        const index = games.findIndex((game) => game.id === editingGameId);
        if (index !== -1) {
          games[index] = {
            ...games[index],
            title,
            status,
            rating: selectedRating,
            image: selectedImage || games[index].image,
          };
        }
      } else {
        // Adicionar novo jogo
        const newGame = {
          id: Date.now(),
          title,
          status,
          rating: selectedRating,
          image: selectedImage,
        };

        games.push(newGame);
      }

      // Salvar no localStorage
      localStorage.setItem("games", JSON.stringify(games));

      // Atualizar a interface
      renderGames();
      updateNoGamesMessage();
      updateStats();
      closeModal();

      // Reativar botão
      submitButton.disabled = false;
      submitButton.innerHTML = '<i class="fas fa-save"></i> Salvar Jogo';
    }, 800);
  }

  function renderGames() {
    gamesContainer.innerHTML = "";

    const filteredGames = games.filter((game) => {
      if (currentFilter === "all") return true;
      return game.status === currentFilter;
    });

    if (filteredGames.length === 0) {
      noGames.style.display = "flex";
      return;
    }

    noGames.style.display = "none";

    filteredGames.forEach((game) => {
      const gameCard = document.createElement("div");
      gameCard.className = "game-card";

      let statusText;
      switch (game.status) {
        case "to-play":
          statusText = "Pretendo Jogar";
          break;
        case "playing":
          statusText = "Jogando";
          break;
        case "played":
          statusText = "Jogado";
          break;
      }

      let starsHtml = "";
      for (let i = 1; i <= 5; i++) {
        if (i <= game.rating) {
          starsHtml += '<i class="fas fa-star"></i>';
        } else {
          starsHtml += '<i class="fas fa-star inactive"></i>';
        }
      }

      gameCard.innerHTML = `
                <div class="game-image">
                    ${
                      game.image
                        ? `<img src="${game.image}" alt="${game.title}">`
                        : `<i class="fas fa-gamepad placeholder"></i>`
                    }
                    <span class="game-status-badge">${statusText}</span>
                </div>
                <div class="game-info">
                    <h3 class="game-title">${game.title}</h3>
                    <div class="game-rating">
                        <div class="stars">${starsHtml}</div>
                    </div>
                    <div class="game-actions">
                        <button class="action-btn edit-btn" data-id="${
                          game.id
                        }">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="action-btn delete-btn" data-id="${
                          game.id
                        }">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;

      gamesContainer.appendChild(gameCard);
    });

    // Adicionar event listeners para os botões de editar e excluir
    document.querySelectorAll(".edit-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const gameId = parseInt(this.getAttribute("data-id"));
        const game = games.find((g) => g.id === gameId);
        if (game) openModal(game);
      });
    });

    document.querySelectorAll(".delete-btn").forEach((btn) => {
      btn.addEventListener("click", function () {
        const gameId = parseInt(this.getAttribute("data-id"));
        deleteGame(gameId);
      });
    });
  }

  function deleteGame(id) {
    if (confirm("Tem certeza que deseja excluir este jogo?")) {
      games = games.filter((game) => game.id !== id);
      localStorage.setItem("games", JSON.stringify(games));
      renderGames();
      updateNoGamesMessage();
      updateStats();
    }
  }

  function updateNoGamesMessage() {
    if (games.length === 0) {
      noGames.style.display = "flex";
    } else {
      const filteredGames = games.filter((game) => {
        if (currentFilter === "all") return true;
        return game.status === currentFilter;
      });

      noGames.style.display = filteredGames.length === 0 ? "flex" : "none";
    }
  }

  function updateStats() {
    totalGamesEl.textContent = games.length;

    const playedCount = games.filter((game) => game.status === "played").length;
    playedGamesEl.textContent = playedCount;
  }
});

// Elementos do DOM para o feedback
const feedbackButton = document.getElementById("feedback-button");
const feedbackModal = document.getElementById("feedback-modal");
const feedbackCloseButton = document.getElementById("feedback-close-button");

// Abrir modal de feedback
if (feedbackButton) {
    feedbackButton.addEventListener("click", () => {
        feedbackModal.style.display = "flex";
        document.body.style.overflow = "hidden";
    });
}

// Fechar modal de feedback
if (feedbackCloseButton) {
    feedbackCloseButton.addEventListener("click", () => {
        feedbackModal.style.display = "none";
        document.body.style.overflow = "auto";
    });
}

// Fechar modal ao clicar fora dele
if (feedbackModal) {
    feedbackModal.addEventListener("click", (e) => {
        if (e.target === feedbackModal) {
            feedbackModal.style.display = "none";
            document.body.style.overflow = "auto";
        }
    });
}