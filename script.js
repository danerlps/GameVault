document.addEventListener('DOMContentLoaded', function() {  
    // Aguarda o carregamento completo do DOM antes de executar o código

    // Elementos DOM
    const gameInput = document.getElementById('game-input');
    const addBtn = document.getElementById('add-btn');
    const gamesList = document.getElementById('games-list');
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    // Estado da aplicação
    let games = JSON.parse(localStorage.getItem('games')) || []; 
    // Recupera os jogos salvos no localStorage ou inicializa como array vazio caso não existam

    let currentFilter = 'all';
    let currentGameRating = 0;
    let currentGameId = null;
    
    // Inicialização
    init();
    
    function init() {
        renderGames();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Adiciona um ouvinte de clique ao botão de adicionar jogo
        addBtn.addEventListener('click', addGame);

        // Adiciona um ouvinte de tecla pressionada no campo de input para permitir adicionar jogo ao pressionar Enter
        gameInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') addGame();
        });
        
        // Adiciona ouvintes de clique aos botões de filtro
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                // Remove a classe 'active' de todos os botões
                filterBtns.forEach(b => b.classList.remove('active'));
                // Adiciona a classe 'active' no botão clicado
                this.classList.add('active');
                // Atualiza o filtro atual com o filtro selecionado
                currentFilter = this.dataset.filter;
                renderGames();
            });
        });
    }
    
    function renderGames() {
        gamesList.innerHTML = '';
        
        const filteredGames = games.filter(game => {
            if (currentFilter === 'all') return true;
            return game.status === currentFilter;
        });
        
        if (filteredGames.length === 0) {
            gamesList.innerHTML = `
                <li class="no-games">
                    <i class="fas fa-gamepad"></i>
                    <p>Nenhum jogo encontrado</p>
                </li>
            `;
            return;
        }
        
        filteredGames.forEach(game => {
            const statusClass = getStatusClass(game.status);
            const statusIcon = getStatusIcon(game.status);
            
            const gameItem = document.createElement('li');
            gameItem.className = `game-item ${statusClass}`;
            gameItem.dataset.id = game.id;
            
            gameItem.innerHTML = `
                <div class="game-info">
                    <div class="game-title">${game.name}</div>
                    <div class="game-status ${statusClass}">
                        <i class="fas ${statusIcon}"></i>
                        ${getStatusText(game.status)}
                    </div>
                    ${game.rating ? `
                    <div class="rating-stars">
                        ${renderStars(game.rating)}
                    </div>
                    ` : ''}
                </div>
                <div class="game-actions">
                    <button class="action-btn status-btn" title="Alterar status">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="action-btn rating-btn" title="Avaliar">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="action-btn delete-btn" title="Excluir">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            gamesList.appendChild(gameItem);
        });
        
        // Adiciona ouvintes de clique nos botões de status de cada jogo
        document.querySelectorAll('.status-btn').forEach(btn => {
            btn.addEventListener('click', changeGameStatus);
        });
        
        // Adiciona ouvintes de clique nos botões de avaliação de cada jogo
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', openRatingModal);
        });
        
        // Adiciona ouvintes de clique nos botões de exclusão de cada jogo
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', deleteGame);
        });
    }
    
    function getStatusClass(status) {
        return status;
    }
    
    function getStatusIcon(status) {
        switch(status) {
            case 'to-play': return 'fa-clock';
            case 'playing': return 'fa-play';
            case 'played': return 'fa-check';
            default: return 'fa-question';
        }
    }
    
    function getStatusText(status) {
        switch(status) {
            case 'to-play': return 'A Jogar';
            case 'playing': return 'Jogando';
            case 'played': return 'Jogado';
            default: return '';
        }
    }
    
    function renderStars(rating) {
        let stars = '';
        for (let i = 1; i <= 5; i++) {
            stars += i <= rating ? '★' : '☆';
        }
        return stars;
    }
    
    function addGame() {
        const gameName = gameInput.value.trim();
        
        if (!gameName) {
            showError('Por favor, digite o nome do jogo');
            return;
        }
        
        const newGame = {
            id: Date.now(),
            name: gameName,
            status: 'to-play',
            rating: null,
            addedAt: new Date().toISOString()
        };
        
        games.unshift(newGame); // Adiciona o novo jogo no início do array
        saveGames(); // Salva o array atualizado no localStorage
        gameInput.value = '';
        renderGames();
        
        addBtn.innerHTML = '<i class="fas fa-check"></i> Adicionado!';
        setTimeout(() => {
            addBtn.innerHTML = '<i class="fas fa-plus"></i> Adicionar';
        }, 2000);
    }
    
    function changeGameStatus(e) {
        const gameItem = e.target.closest('.game-item');
        const gameId = parseInt(gameItem.dataset.id);
        const gameIndex = games.findIndex(g => g.id === gameId);
        
        if (gameIndex === -1) return;
        
        const statusOrder = ['to-play', 'playing', 'played'];
        const currentIndex = statusOrder.indexOf(games[gameIndex].status);
        const nextIndex = (currentIndex + 1) % statusOrder.length;
        
        games[gameIndex].status = statusOrder[nextIndex];
        saveGames(); // Salva a nova lista de jogos no localStorage após a mudança de status
        renderGames();
        
        const btn = e.target.closest('button');
        btn.innerHTML = '<i class="fas fa-check"></i>';
        setTimeout(() => {
            btn.innerHTML = '<i class="fas fa-sync-alt"></i>';
        }, 1000);
    }
    
    function openRatingModal(e) {
        const gameItem = e.target.closest('.game-item');
        currentGameId = parseInt(gameItem.dataset.id);
        const game = games.find(g => g.id === currentGameId);
        
        if (!game) return;
        
        currentGameRating = game.rating || 0;
        
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <h3 class="modal-title">Avaliar "${game.name}"</h3>
                <div class="star-rating">
                    <span class="star" data-rating="1">${currentGameRating >= 1 ? '★' : '☆'}</span>
                    <span class="star" data-rating="2">${currentGameRating >= 2 ? '★' : '☆'}</span>
                    <span class="star" data-rating="3">${currentGameRating >= 3 ? '★' : '☆'}</span>
                    <span class="star" data-rating="4">${currentGameRating >= 4 ? '★' : '☆'}</span>
                    <span class="star" data-rating="5">${currentGameRating >= 5 ? '★' : '☆'}</span>
                </div>
                <div class="modal-buttons">
                    <button class="modal-btn cancel">Cancelar</button>
                    <button class="modal-btn confirm">Salvar Avaliação</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Adiciona evento de clique para cada estrela da avaliação
        modal.querySelectorAll('.star').forEach(star => {
            star.addEventListener('click', function() {
                currentGameRating = parseInt(this.dataset.rating);
                updateStarsInModal(modal);
            });
            
            star.addEventListener('mouseover', function() {
                const hoverRating = parseInt(this.dataset.rating);
                highlightStars(modal, hoverRating);
            });
            
            star.addEventListener('mouseout', function() {
                highlightStars(modal, currentGameRating);
            });
        });
        
        // Botão para confirmar a avaliação e salvar
        modal.querySelector('.confirm').addEventListener('click', function() {
            rateGame(currentGameId, currentGameRating);
            modal.remove();
        });
        
        // Botão para cancelar e fechar o modal sem salvar
        modal.querySelector('.cancel').addEventListener('click', function() {
            modal.remove();
        });
        
        // Fecha o modal ao clicar fora do conteúdo
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    function updateStarsInModal(modal) {
        modal.querySelectorAll('.star').forEach(star => {
            const rating = parseInt(star.dataset.rating);
            star.textContent = rating <= currentGameRating ? '★' : '☆';
        });
    }
    
    function highlightStars(modal, rating) {
        modal.querySelectorAll('.star').forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            star.textContent = starRating <= rating ? '★' : '☆';
        });
    }
    
    function rateGame(gameId, rating) {
        const gameIndex = games.findIndex(g => g.id === gameId);
        if (gameIndex === -1) return;
        
        games[gameIndex].rating = rating;
        saveGames(); // Salva no localStorage a nova avaliação
        renderGames();
    }
    
    function deleteGame(e) {
        const gameItem = e.target.closest('.game-item');
        const gameId = parseInt(gameItem.dataset.id);
        
        gameItem.style.transform = 'translateX(100%)';
        gameItem.style.opacity = '0';
        gameItem.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            games = games.filter(g => g.id !== gameId);
            saveGames(); // Atualiza o localStorage após excluir o jogo
            renderGames();
        }, 300);
    }
    
    function saveGames() {
        localStorage.setItem('games', JSON.stringify(games)); 
        // Salva o array de jogos no localStorage convertendo-o para string JSON
    }
    
    function showError(message) {
        const error = document.createElement('div');
        error.className = 'error-message';
        error.textContent = message;
        
        document.body.appendChild(error);
        
        setTimeout(() => {
            error.remove();
        }, 3000);
    }
});
