// Edit Rankings JavaScript - Simplified Design
class EditRankings {
    constructor() {
        this.playersData = null;
        this.currentVersion = null;
        this.isDirty = false;
        this.draggedElement = null;
        this.currentEditingPlayer = null;
        
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

        // Modal close events
        document.querySelector('.modal-close').addEventListener('click', () => {
            this.closeModal();
        });

        document.getElementById('edit-modal').addEventListener('click', (e) => {
            if (e.target.id === 'edit-modal') {
                this.closeModal();
            }
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
                const playerItem = this.createPlayerItem(player, index + 1);
                container.appendChild(playerItem);
                
                // Add tier breaks
                if (player.small_tier_break) {
                    const smallBreak = document.createElement('div');
                    smallBreak.className = 'tier-break small';
                    container.appendChild(smallBreak);
                }
                if (player.big_tier_break) {
                    const bigBreak = document.createElement('div');
                    bigBreak.className = 'tier-break big';
                    container.appendChild(bigBreak);
                }
            });

            this.setupDropZone(container, position);
        });
    }

    createPlayerItem(player, rank) {
        const item = document.createElement('div');
        item.className = 'player-item';
        item.draggable = true;
        item.dataset.playerId = player.id;
        item.dataset.position = player.position;

        // Build class names for styling
        let nameClasses = 'player-name';
        if (player.is_bold) nameClasses += ' bold';
        if (player.is_italic) nameClasses += ' italic';

        // Build indicators
        let indicators = '';
        if (player.is_bold || player.is_italic) {
            indicators = '<div class="player-indicators">';
            if (player.is_bold) indicators += '<div class="indicator bold" title="Target"></div>';
            if (player.is_italic) indicators += '<div class="indicator italic" title="Fade"></div>';
            indicators += '</div>';
        }

        item.innerHTML = `
            <div class="player-left">
                <div class="player-rank">${rank}</div>
                <div class="${nameClasses}">${player.name}</div>
                ${indicators}
            </div>
            <div class="player-controls">
                <button class="edit-btn" onclick="editRankings.editPlayer(${player.id})">Edit</button>
                <button class="delete-btn" onclick="editRankings.deletePlayer(${player.id})">×</button>
            </div>
        `;

        this.setupDragAndDrop(item);
        return item;
    }

    setupDragAndDrop(item) {
        item.addEventListener('dragstart', (e) => {
            this.draggedElement = item;
            item.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
        });

        item.addEventListener('dragend', () => {
            item.classList.remove('dragging');
            this.draggedElement = null;
        });
    }

    setupDropZone(container, position) {
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            const afterElement = this.getDragAfterElement(container, e.clientY);
            const draggedItem = this.draggedElement;
            
            if (draggedItem && draggedItem.dataset.position === position) {
                if (afterElement == null) {
                    container.appendChild(draggedItem);
                } else {
                    container.insertBefore(draggedItem, afterElement);
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
        const draggableElements = [...container.querySelectorAll('.player-item:not(.dragging)')];
        
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
        const items = [...container.querySelectorAll('.player-item')];
        
        // Update the order in our data
        const newOrder = [];
        items.forEach((item, index) => {
            const playerId = parseInt(item.dataset.playerId);
            const player = this.findPlayerById(playerId);
            if (player) {
                player.position_rank = index + 1;
                newOrder.push(player);
                
                // Update the rank display
                const rankElement = item.querySelector('.player-rank');
                if (rankElement) {
                    rankElement.textContent = index + 1;
                }
            }
        });
        
        // Update our data structure
        this.playersData[position] = newOrder;
    }

    findPlayerById(id) {
        for (const [position, players] of Object.entries(this.playersData)) {
            const player = players.find(p => p.id === id);
            if (player) return player;
        }
        return null;
    }

    editPlayer(playerId) {
        const player = this.findPlayerById(playerId);
        if (!player) return;

        this.currentEditingPlayer = player;
        
        // Populate form
        document.getElementById('edit-name').value = player.name || '';
        document.getElementById('edit-team').value = player.nfl_team || 'TBD';
        document.getElementById('edit-position').value = player.position || 'QB';
        document.getElementById('edit-bye-week').value = player.bye_week || '';
        document.getElementById('edit-news').value = player.news_copy || '';
        document.getElementById('edit-bold').checked = player.is_bold || false;
        document.getElementById('edit-italic').checked = player.is_italic || false;
        document.getElementById('edit-small-tier').checked = player.small_tier_break || false;
        document.getElementById('edit-big-tier').checked = player.big_tier_break || false;

        this.openModal();
    }

    openModal() {
        document.getElementById('edit-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('edit-modal').classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditingPlayer = null;
    }

    savePlayer() {
        if (!this.currentEditingPlayer) return;

        const oldPosition = this.currentEditingPlayer.position;
        
        // Update player data
        this.currentEditingPlayer.name = document.getElementById('edit-name').value;
        this.currentEditingPlayer.nfl_team = document.getElementById('edit-team').value;
        this.currentEditingPlayer.position = document.getElementById('edit-position').value;
        this.currentEditingPlayer.bye_week = document.getElementById('edit-bye-week').value ? parseInt(document.getElementById('edit-bye-week').value) : null;
        this.currentEditingPlayer.news_copy = document.getElementById('edit-news').value;
        this.currentEditingPlayer.is_bold = document.getElementById('edit-bold').checked;
        this.currentEditingPlayer.is_italic = document.getElementById('edit-italic').checked;
        this.currentEditingPlayer.small_tier_break = document.getElementById('edit-small-tier').checked;
        this.currentEditingPlayer.big_tier_break = document.getElementById('edit-big-tier').checked;

        // Handle position changes
        const newPosition = this.currentEditingPlayer.position;
        if (oldPosition !== newPosition) {
            // Remove from old position
            this.playersData[oldPosition] = this.playersData[oldPosition].filter(p => p.id !== this.currentEditingPlayer.id);
            
            // Re-rank remaining players in old position
            this.playersData[oldPosition].forEach((p, index) => {
                p.position_rank = index + 1;
            });

            // Add to new position
            this.currentEditingPlayer.position_rank = this.playersData[newPosition].length + 1;
            this.playersData[newPosition].push(this.currentEditingPlayer);
        }

        this.renderPlayers();
        this.closeModal();
        this.markDirty();
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
        
        // Auto-open edit modal for new player
        this.editPlayer(newPlayer.id);
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
            
            // Reset button text
            const updateBtn = document.getElementById('update-rankings-btn');
            updateBtn.textContent = 'Update Rankings';
            
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