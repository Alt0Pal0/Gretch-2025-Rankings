// Edit Rankings JavaScript
class EditRankings {
    constructor() {
        this.playersData = null;
        this.currentVersion = null;
        this.isDirty = false;
        this.draggedElement = null;
        
        this.init();
    }

    async init() {
        try {
            await this.loadData();
            this.setupEventListeners();
            this.renderPlayers();
            this.hideLoading();
        } catch (error) {
            this.showError('Failed to initialize edit interface: ' + error.message);
        }
    }

    async loadData() {
        try {
            const response = await fetch('/api/players');
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.success) {
                throw new Error('API returned error');
            }
            
            this.playersData = data.players;
            this.currentVersion = data.version;
            this.updateVersionDisplay();
            
        } catch (error) {
            console.error('Failed to load player data:', error);
            throw error;
        }
    }

    updateVersionDisplay() {
        const versionElement = document.getElementById('current-version');
        const totalPlayersElement = document.getElementById('total-players');
        
        if (this.currentVersion && versionElement) {
            const versionDate = new Date(this.currentVersion.version_date);
            const formattedDate = `${versionDate.getMonth() + 1}/${versionDate.getDate()}/${versionDate.getFullYear().toString().slice(-2)}`;
            versionElement.textContent = `v${this.currentVersion.version_number} - ${formattedDate}`;
        }
        
        if (totalPlayersElement) {
            const total = Object.values(this.playersData).reduce((sum, players) => sum + players.length, 0);
            totalPlayersElement.textContent = total;
        }
    }

    setupEventListeners() {
        // Add player buttons
        document.querySelectorAll('.add-player-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const position = e.target.dataset.position;
                this.addNewPlayer(position);
            });
        });

        // Update rankings button
        document.getElementById('update-rankings-btn').addEventListener('click', () => {
            this.updateRankings();
        });

        // Preview button
        document.getElementById('preview-btn').addEventListener('click', () => {
            window.open('/', '_blank');
        });

        // Handle beforeunload to warn about unsaved changes
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    renderPlayers() {
        ['QB', 'RB', 'WR', 'TE'].forEach(position => {
            const container = document.getElementById(`${position.toLowerCase()}-list`);
            container.innerHTML = '';
            
            const players = this.playersData[position] || [];
            players.forEach((player, index) => {
                const playerCard = this.createPlayerCard(player, index + 1);
                container.appendChild(playerCard);
            });

            this.setupDropZone(container, position);
        });
    }

    createPlayerCard(player, rank) {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.draggable = true;
        card.dataset.playerId = player.id;
        card.dataset.position = player.position;

        card.innerHTML = `
            <div class="player-header">
                <div class="player-rank">${rank}</div>
                <div class="player-controls">
                    <button class="control-btn" onclick="editRankings.movePlayerUp(${player.id})" title="Move Up">↑</button>
                    <button class="control-btn" onclick="editRankings.movePlayerDown(${player.id})" title="Move Down">↓</button>
                    <button class="control-btn danger" onclick="editRankings.deletePlayer(${player.id})" title="Delete">×</button>
                </div>
            </div>
            <div class="player-form">
                <div class="form-group">
                    <label class="form-label">Name</label>
                    <input type="text" class="form-input" value="${player.name}" 
                           onchange="editRankings.updatePlayerField(${player.id}, 'name', this.value)">
                </div>
                <div class="form-group">
                    <label class="form-label">NFL Team</label>
                    <select class="form-select" onchange="editRankings.updatePlayerField(${player.id}, 'nfl_team', this.value)">
                        ${this.getNFLTeamOptions(player.nfl_team)}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Position</label>
                    <select class="form-select" onchange="editRankings.updatePlayerPosition(${player.id}, this.value)">
                        ${this.getPositionOptions(player.position)}
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Bye Week</label>
                    <select class="form-select" onchange="editRankings.updatePlayerField(${player.id}, 'bye_week', this.value ? parseInt(this.value) : null)">
                        <option value="">Select Bye Week</option>
                        ${Array.from({length: 18}, (_, i) => i + 1).map(week => 
                            `<option value="${week}" ${player.bye_week === week ? 'selected' : ''}>${week}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group full-width">
                    <label class="form-label">News Copy</label>
                    <textarea class="form-textarea" placeholder="Recent news about this player..."
                              onchange="editRankings.updatePlayerField(${player.id}, 'news_copy', this.value)">${player.news_copy || ''}</textarea>
                </div>
                <div class="form-group">
                    <div class="form-checkbox">
                        <input type="checkbox" class="checkbox-input" id="bold-${player.id}" 
                               ${player.is_bold ? 'checked' : ''}
                               onchange="editRankings.updatePlayerField(${player.id}, 'is_bold', this.checked)">
                        <label for="bold-${player.id}" class="form-label">Bold (Target)</label>
                    </div>
                    <div class="form-checkbox">
                        <input type="checkbox" class="checkbox-input" id="italic-${player.id}" 
                               ${player.is_italic ? 'checked' : ''}
                               onchange="editRankings.updatePlayerField(${player.id}, 'is_italic', this.checked)">
                        <label for="italic-${player.id}" class="form-label">Italic (Fade)</label>
                    </div>
                </div>
                <div class="form-group">
                    <div class="tier-breaks">
                        <div class="form-checkbox">
                            <input type="checkbox" class="checkbox-input" id="small-tier-${player.id}" 
                                   ${player.small_tier_break ? 'checked' : ''}
                                   onchange="editRankings.updatePlayerField(${player.id}, 'small_tier_break', this.checked)">
                            <label for="small-tier-${player.id}" class="form-label">Small Tier Break</label>
                        </div>
                        <div class="form-checkbox">
                            <input type="checkbox" class="checkbox-input" id="big-tier-${player.id}" 
                                   ${player.big_tier_break ? 'checked' : ''}
                                   onchange="editRankings.updatePlayerField(${player.id}, 'big_tier_break', this.checked)">
                            <label for="big-tier-${player.id}" class="form-label">Big Tier Break</label>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupDragAndDrop(card);
        return card;
    }

    getNFLTeamOptions(selectedTeam) {
        const teams = [
            'ARZ', 'ATL', 'BLT', 'BUF', 'CAR', 'CHI', 'CIN', 'CLV', 'DAL', 'DEN',
            'DET', 'GB', 'HST', 'IND', 'JAX', 'KC', 'LA', 'LAC', 'MIA', 'MIN',
            'NE', 'NO', 'NYG', 'NYJ', 'OAK', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS', 'TBD'
        ];
        
        return teams.map(team => 
            `<option value="${team}" ${team === selectedTeam ? 'selected' : ''}>${team}</option>`
        ).join('');
    }

    getPositionOptions(selectedPosition) {
        const positions = ['QB', 'RB', 'WR', 'TE'];
        return positions.map(pos => 
            `<option value="${pos}" ${pos === selectedPosition ? 'selected' : ''}>${pos}</option>`
        ).join('');
    }

    setupDragAndDrop(card) {
        card.addEventListener('dragstart', (e) => {
            this.draggedElement = card;
            card.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        card.addEventListener('dragend', () => {
            card.classList.remove('dragging');
            this.draggedElement = null;
        });
    }

    setupDropZone(container, position) {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggedCard = this.draggedElement;
            
            if (draggedCard && draggedCard.dataset.position === position) {
                if (afterElement == null) {
                    container.appendChild(draggedCard);
                } else {
                    container.insertBefore(draggedCard, afterElement);
                }
            }
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            if (this.draggedElement && this.draggedElement.dataset.position === position) {
                this.reorderPlayers(position);
                this.markDirty();
            }
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.player-card:not(.dragging)')];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    reorderPlayers(position) {
        const container = document.getElementById(`${position.toLowerCase()}-list`);
        const cards = [...container.querySelectorAll('.player-card')];
        
        cards.forEach((card, index) => {
            const playerId = parseInt(card.dataset.playerId);
            const player = this.findPlayerById(playerId);
            if (player) {
                player.position_rank = index + 1;
                // Update the rank display
                const rankElement = card.querySelector('.player-rank');
                if (rankElement) {
                    rankElement.textContent = index + 1;
                }
            }
        });
    }

    findPlayerById(id) {
        for (const [position, players] of Object.entries(this.playersData)) {
            const player = players.find(p => p.id === id);
            if (player) return player;
        }
        return null;
    }

    updatePlayerField(playerId, field, value) {
        const player = this.findPlayerById(playerId);
        if (player) {
            player[field] = value;
            this.markDirty();
        }
    }

    updatePlayerPosition(playerId, newPosition) {
        const player = this.findPlayerById(playerId);
        if (!player || player.position === newPosition) return;

        // Remove from old position
        const oldPosition = player.position;
        this.playersData[oldPosition] = this.playersData[oldPosition].filter(p => p.id !== playerId);

        // Add to new position
        player.position = newPosition;
        player.position_rank = this.playersData[newPosition].length + 1;
        this.playersData[newPosition].push(player);

        // Re-render both affected positions
        this.renderPlayers();
        this.markDirty();
    }

    movePlayerUp(playerId) {
        const player = this.findPlayerById(playerId);
        if (!player || player.position_rank <= 1) return;

        const position = player.position;
        const players = this.playersData[position];
        const currentIndex = players.findIndex(p => p.id === playerId);
        
        if (currentIndex > 0) {
            // Swap with player above
            [players[currentIndex - 1], players[currentIndex]] = [players[currentIndex], players[currentIndex - 1]];
            
            // Update position ranks
            players[currentIndex - 1].position_rank = currentIndex;
            players[currentIndex].position_rank = currentIndex + 1;
            
            this.renderPlayers();
            this.markDirty();
        }
    }

    movePlayerDown(playerId) {
        const player = this.findPlayerById(playerId);
        if (!player) return;

        const position = player.position;
        const players = this.playersData[position];
        const currentIndex = players.findIndex(p => p.id === playerId);
        
        if (currentIndex < players.length - 1) {
            // Swap with player below
            [players[currentIndex], players[currentIndex + 1]] = [players[currentIndex + 1], players[currentIndex]];
            
            // Update position ranks
            players[currentIndex].position_rank = currentIndex + 1;
            players[currentIndex + 1].position_rank = currentIndex + 2;
            
            this.renderPlayers();
            this.markDirty();
        }
    }

    deletePlayer(playerId) {
        if (!confirm('Are you sure you want to delete this player?')) return;

        const player = this.findPlayerById(playerId);
        if (!player) return;

        const position = player.position;
        this.playersData[position] = this.playersData[position].filter(p => p.id !== playerId);

        // Re-rank remaining players
        this.playersData[position].forEach((p, index) => {
            p.position_rank = index + 1;
        });

        this.renderPlayers();
        this.markDirty();
    }

    addNewPlayer(position) {
        const newPlayer = {
            id: Date.now(), // Temporary ID for new players
            name: 'New Player',
            position: position,
            position_rank: this.playersData[position].length + 1,
            nfl_team: 'TBD',
            bye_week: null,
            is_bold: false,
            is_italic: false,
            small_tier_break: false,
            big_tier_break: false,
            news_copy: '',
            ranking_change: 0,
            isNew: true
        };

        this.playersData[position].push(newPlayer);
        this.renderPlayers();
        this.markDirty();
    }

    async updateRankings() {
        const notes = prompt('Enter version notes (optional):');
        if (notes === null) return; // User cancelled

        try {
            this.showLoading('Updating rankings...');

            const response = await fetch('/api/update-rankings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    players: this.playersData,
                    notes: notes
                })
            });

            if (!response.ok) {
                throw new Error(`Update failed: ${response.status}`);
            }

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message || 'Update failed');
            }

            this.showSuccess('Rankings updated successfully!');
            this.isDirty = false;
            
            // Reload data to get new version info
            await this.loadData();
            this.renderPlayers();

        } catch (error) {
            console.error('Update failed:', error);
            this.showError('Failed to update rankings: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    markDirty() {
        this.isDirty = true;
        const updateBtn = document.getElementById('update-rankings-btn');
        if (updateBtn && !updateBtn.textContent.includes('*')) {
            updateBtn.textContent = 'Update Rankings *';
        }
    }

    showLoading(message = 'Loading...') {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.textContent = message;
            loading.style.display = 'block';
        }
        
        document.getElementById('positions-container').style.display = 'none';
    }

    hideLoading() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('positions-container').style.display = 'grid';
    }

    showError(message) {
        const errorEl = document.getElementById('error-message');
        if (errorEl) {
            errorEl.textContent = message;
            errorEl.style.display = 'block';
            setTimeout(() => errorEl.style.display = 'none', 5000);
        }
    }

    showSuccess(message) {
        const successEl = document.getElementById('success-message');
        if (successEl) {
            successEl.textContent = message;
            successEl.style.display = 'block';
            setTimeout(() => successEl.style.display = 'none', 3000);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.editRankings = new EditRankings();
});