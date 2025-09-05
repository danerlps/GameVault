document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const gamesContainer = document.getElementById('games-container');
    const noGames = document.getElementById('no-games');
    const modal = document.getElementById('game-modal');
    const gameForm = document.getElementById('game-form');
    const imageUploadArea = document.getElementById('image-upload-area');
    const imageUploadInput = document.getElementById('image-upload-input');
    const imagePreview = document.getElementById('image-preview');
    const starRating = document.getElementById('star-rating');
    const ratingText = document.getElementById('rating-text');
    const closeModalBtn = document.getElementById('close-modal');
    const cancelButton = document.getElementById('cancel-button');
    const addGameBtn = document.getElementById('add-game-btn');
    const emptyAddBtn = document.getElementById('empty-add-btn');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const currentFilterText = document.getElementById('current-filter');
    const totalGamesEl = document.getElementById('total-games');
    const playedGamesEl = document.getElementById('played-games');
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('i');
    
    // Variáveis de estado
    let currentFilter = 'all';
    let selectedRating = 0;
    let selectedImage = null;
    let games = JSON.parse(localStorage.getItem('games')) || [];
    let editingGameId = null;
    
    // Verificar preferência de tema salva
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.remove('dark-mode');
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
    } else {
        document.body.classList.add('dark-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
    
    // Textos para avaliações
    const ratingTexts = {
        0: "Sem avaliação",
        1: "Péssimo",
        2: "Ruim",
        3: "Regular",
        4: "Bom",
        5: "Excelente"
    };
    
    // Inicialização
    renderGames();
    updateNoGamesMessage();
    updateStats();
    
    // Event Listeners
    if (addGameBtn) addGameBtn.addEventListener('click', () => openModal());
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', () => openModal());
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => closeModal());
    if (cancelButton) cancelButton.addEventListener('click', () => closeModal());
    if (imageUploadArea) imageUploadArea.addEventListener('click', () => imageUploadInput.click());

    // Toggle de tema
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);

    if (imageUploadInput) {
        imageUploadInput.addEventListener('change', function(e) {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    selectedImage = e.target.result;
                    imagePreview.innerHTML = `<img src="${selectedImage}" alt="Preview">`;
                }
                reader.readAsDataURL(this.files[0]);
            }
        });
    }

    if (starRating) {
        starRating.querySelectorAll('i').forEach(star => {
            star.addEventListener('click', function() {
                const value = parseInt(this.getAttribute('data-value'));
                setRating(value);
            });

            star.addEventListener('mouseover', function() {
                const value = parseInt(this.getAttribute('data-value'));
                highlightStars(value);
            });
        });

        starRating.addEventListener('mouseleave', function() {
            highlightStars(selectedRating);
        });
    }

    if (gameForm) {
        gameForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveGame();
        });
    }

    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            setFilter(filter, this.textContent.trim());
        });
    });

    // Fechar modal ao clicar fora dele
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
    
    // Funções
    function toggleTheme() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    }
    
    function openModal(game = null) {
        editingGameId = game ? game.id : null;
        
        // Preencher o formulário se for edição
        if (game) {
            document.getElementById('game-title').value = game.title;
            document.querySelector(`input[name="status"][value="${game.status}"]`).checked = true;
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
            
            document.getElementById('modal-title').textContent = 'Editar Jogo';
        } else {
            // Limpar o formulário para novo jogo
            gameForm.reset();
            setRating(0);
            selectedImage = null;
            imagePreview.innerHTML = `
                <i class="fas fa-cloud-upload-alt"></i>
                <p>Clique para adicionar uma imagem</p>
            `;
            document.getElementById('modal-title').textContent = 'Adicionar Novo Jogo';
        }
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
    
    function closeModal() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
    
    function setRating(value) {
        selectedRating = value;
        highlightStars(value);
        ratingText.textContent = ratingTexts[value];
    }
    
    function highlightStars(value) {
        const stars = starRating.querySelectorAll('i');
        
        stars.forEach(star => {
            const starValue = parseInt(star.getAttribute('data-value'));
            if (starValue <= value) {
                star.classList.add('active');
                star.classList.remove('far');
                star.classList.add('fas');
            } else {
                star.classList.remove('active');
                star.classList.add('far');
                star.classList.remove('fas');
            }
        });
    }
    
    function setFilter(filter, filterName) {
        currentFilter = filter;
        
        // Atualizar botões de filtro
        filterButtons.forEach(button => {
            if (button.getAttribute('data-filter') === filter) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Atualizar texto do filtro atual
        currentFilterText.textContent = filterName;
        
        renderGames();
    }
    
    function saveGame() {
        const title = document.getElementById('game-title').value;
        const status = document.querySelector('input[name="status"]:checked').value;
        
        if (editingGameId !== null) {
            // Editar jogo existente
            const index = games.findIndex(game => game.id === editingGameId);
            if (index !== -1) {
                games[index] = {
                    ...games[index],
                    title,
                    status,
                    rating: selectedRating,
                    image: selectedImage || games[index].image
                };
            }
        } else {
            // Adicionar novo jogo
            const newGame = {
                id: Date.now(),
                title,
                status,
                rating: selectedRating,
                image: selectedImage
            };
            
            games.push(newGame);
        }
        
        // Salvar no localStorage
        localStorage.setItem('games', JSON.stringify(games));
        
        // Atualizar a interface
        renderGames();
        updateNoGamesMessage();
        updateStats();
        closeModal();
    }
    
    function renderGames() {
        gamesContainer.innerHTML = '';
        
        const filteredGames = games.filter(game => {
            if (currentFilter === 'all') return true;
            return game.status === currentFilter;
        });
        
        if (filteredGames.length === 0) {
            noGames.style.display = 'flex';
            return;
        }
        
        noGames.style.display = 'none';
        
        filteredGames.forEach(game => {
            const gameCard = document.createElement('div');
            gameCard.className = 'game-card';
            
            let statusText, statusClass;
            switch (game.status) {
                case 'to-play':
                    statusText = 'Pretendo Jogar';
                    statusClass = 'to-play';
                    break;
                case 'playing':
                    statusText = 'Jogando';
                    statusClass = 'playing';
                    break;
                case 'played':
                    statusText = 'Jogado';
                    statusClass = 'played';
                    break;
            }
            
            let starsHtml = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= game.rating) {
                    starsHtml += '<i class="fas fa-star"></i>';
                } else {
                    starsHtml += '<i class="fas fa-star inactive"></i>';
                }
            }
            
            gameCard.innerHTML = `
                <div class="game-image">
                    ${game.image ? 
                        `<img src="${game.image}" alt="${game.title}">` : 
                        `<i class="fas fa-gamepad placeholder"></i>`
                    }
                    <span class="game-status-badge">${statusText}</span>
                </div>
                <div class="game-info">
                    <h3 class="game-title">${game.title}</h3>
                    <div class="game-rating">
                        <div class="stars">${starsHtml}</div>
                    </div>
                    <div class="game-actions">
                        <button class="action-btn edit-btn" data-id="${game.id}">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="action-btn delete-btn" data-id="${game.id}">
                            <i class="fas fa-trash"></i> Excluir
                        </button>
                    </div>
                </div>
            `;
            
            gamesContainer.appendChild(gameCard);
        });
        
        // Adicionar event listeners para os botões de editar e excluir
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const gameId = parseInt(this.getAttribute('data-id'));
                const game = games.find(g => g.id === gameId);
                if (game) openModal(game);
            });
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const gameId = parseInt(this.getAttribute('data-id'));
                deleteGame(gameId);
            });
        });
    }
    
    function deleteGame(id) {
        if (confirm('Tem certeza que deseja excluir este jogo?')) {
            games = games.filter(game => game.id !== id);
            localStorage.setItem('games', JSON.stringify(games));
            renderGames();
            updateNoGamesMessage();
            updateStats();
        }
    }
    
    function updateNoGamesMessage() {
        if (games.length === 0) {
            noGames.style.display = 'flex';
        } else {
            const filteredGames = games.filter(game => {
                if (currentFilter === 'all') return true;
                return game.status === currentFilter;
            });
            if (filteredGames.length === 0) {
                noGames.style.display = 'flex';
            } else {
                noGames.style.display = 'none';
            }
        }
    }
    
    function updateStats() {
        totalGamesEl.textContent = games.length;
        const playedGames = games.filter(game => game.status === 'played').length;
        playedGamesEl.textContent = playedGames;
    }
});