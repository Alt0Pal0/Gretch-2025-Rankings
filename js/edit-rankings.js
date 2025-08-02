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
        // Update version in header if header is loaded
        setTimeout(() => {
            const versionElement = document.querySelector('.header-version');
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
        }, 100); // Small delay to ensure header is loaded
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

        // Download button - opens homepage in new tab and triggers print dialog
        document.getElementById('download-btn').addEventListener('click', () => {
            this.downloadPDF();
        });

        // Preview button - opens homepage in new tab to see how rankings look
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

        // Update ranking max value when position changes in modal
        setTimeout(() => {
            const positionSelect = document.getElementById('edit-position');
            if (positionSelect) {
                positionSelect.addEventListener('change', (e) => {
                    this.updateRankingMaxValue(e.target.value);
                });
            }

            // Set up download button (in case header loads after this script)
            const downloadBtn = document.getElementById('download-btn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', () => {
                    this.downloadPDF();
                });
            }
        }, 100);
    }

    renderPlayers() {
        ['QB', 'RB', 'WR', 'TE'].forEach(position => {
            const container = document.getElementById(`${position.toLowerCase()}-list`);
            let html = '';
            
            const players = this.playersData[position] || [];
            players.forEach((player, index) => {
                // Create player HTML - use same structure as homepage
                const rank = player.position_rank;
                const boldClass = player.is_bold ? ' bold' : '';
                const italicClass = player.is_italic ? ' italic' : '';
                
                html += `
                    <div class="player-item" draggable="true" data-player-id="${player.id}" data-position="${player.position}">
                        <div class="player-rank">${rank}</div>
                        <div class="player-name${boldClass}${italicClass}">${player.name}</div>
                        <a href="#" class="edit-link" onclick="editRankings.editPlayer(${player.id}); return false;">edit</a>
                    </div>
                `;
                
                // Add tier breaks after player - exactly like homepage
                if (player.small_tier_break) {
                    html += this.createTierBreakHTML('small');
                }
                if (player.big_tier_break) {
                    html += this.createTierBreakHTML('big');
                }
            });
            
            container.innerHTML = html;
            
            // Set up drag and drop for all player items
            container.querySelectorAll('.player-item').forEach(item => {
                this.setupDragAndDrop(item);
            });

            this.setupDropZone(container, position);
        });
    }



    // Function to create tier break HTML - exact copy from homepage
    createTierBreakHTML(type) {
        const breakType = type === 'big' ? 'big' : 'small';
        const breakText = type === 'big' ? 'Big Tier Break' : 'Small Tier Break';
        
        return `
            <div class="tier-break ${breakType}">
                <span class="tier-break-text">${breakText}</span>
            </div>
        `;
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
        document.getElementById('edit-rank').value = player.position_rank || 1;
        document.getElementById('edit-team').value = player.nfl_team || 'TBD';
        document.getElementById('edit-position').value = player.position || 'QB';
        document.getElementById('edit-bye-week').value = player.bye_week || '';
        document.getElementById('edit-news').value = player.news_copy || '';
        
        // Set formatting radio button
        if (player.is_bold) {
            document.getElementById('edit-bold').checked = true;
        } else if (player.is_italic) {
            document.getElementById('edit-italic').checked = true;
        } else {
            document.getElementById('edit-plain').checked = true;
        }
        
        // Set tier break radio button
        if (player.small_tier_break) {
            document.getElementById('edit-small-tier').checked = true;
        } else if (player.big_tier_break) {
            document.getElementById('edit-big-tier').checked = true;
        } else {
            document.getElementById('edit-no-tier').checked = true;
        }

        // Set max ranking based on current position
        this.updateRankingMaxValue(player.position);

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
        const oldRank = this.currentEditingPlayer.position_rank;
        
        // Update player data
        this.currentEditingPlayer.name = document.getElementById('edit-name').value;
        this.currentEditingPlayer.nfl_team = document.getElementById('edit-team').value;
        this.currentEditingPlayer.position = document.getElementById('edit-position').value;
        this.currentEditingPlayer.bye_week = document.getElementById('edit-bye-week').value ? parseInt(document.getElementById('edit-bye-week').value) : null;
        this.currentEditingPlayer.news_copy = document.getElementById('edit-news').value;
        
        // Get new rank from form
        const newRank = parseInt(document.getElementById('edit-rank').value) || 1;
        const newPosition = this.currentEditingPlayer.position;
        
        // Get formatting from radio buttons
        const formattingRadio = document.querySelector('input[name="formatting"]:checked');
        this.currentEditingPlayer.is_bold = formattingRadio?.value === 'bold';
        this.currentEditingPlayer.is_italic = formattingRadio?.value === 'italic';
        
        // Get tier break from radio buttons
        const tierBreakRadio = document.querySelector('input[name="tier-break"]:checked');
        this.currentEditingPlayer.small_tier_break = tierBreakRadio?.value === 'small';
        this.currentEditingPlayer.big_tier_break = tierBreakRadio?.value === 'big';

        // Handle position and/or ranking changes
        if (oldPosition !== newPosition) {
            // Position changed - move to new position
            this.movePlayerToNewPosition(oldPosition, newPosition, newRank);
        } else if (oldRank !== newRank) {
            // Same position, different rank - reorder within position
            this.reorderPlayerWithinPosition(newPosition, oldRank, newRank);
        }

        this.renderPlayers();
        this.closeModal();
        this.markDirty();
    }

    movePlayerToNewPosition(oldPosition, newPosition, newRank) {
        // Remove from old position
        this.playersData[oldPosition] = this.playersData[oldPosition].filter(p => p.id !== this.currentEditingPlayer.id);
        
        // Re-rank remaining players in old position
        this.playersData[oldPosition].forEach((p, index) => {
            p.position_rank = index + 1;
        });

        // Insert into new position at specified rank
        const maxRank = this.playersData[newPosition].length + 1;
        const targetRank = Math.max(1, Math.min(newRank, maxRank));
        
        // Insert player at target position
        this.playersData[newPosition].splice(targetRank - 1, 0, this.currentEditingPlayer);
        
        // Update all position_rank values for new position
        this.playersData[newPosition].forEach((p, index) => {
            p.position_rank = index + 1;
        });
    }

    reorderPlayerWithinPosition(position, oldRank, newRank) {
        const players = this.playersData[position];
        const maxRank = players.length;
        const targetRank = Math.max(1, Math.min(newRank, maxRank));
        
        if (targetRank === oldRank) return; // No change needed
        
        // Remove player from current position
        const playerIndex = players.findIndex(p => p.id === this.currentEditingPlayer.id);
        if (playerIndex === -1) return;
        
        players.splice(playerIndex, 1);
        
        // Insert at new position
        players.splice(targetRank - 1, 0, this.currentEditingPlayer);
        
        // Update all position_rank values
        players.forEach((p, index) => {
            p.position_rank = index + 1;
        });
    }

    updateRankingMaxValue(position) {
        const rankInput = document.getElementById('edit-rank');
        if (rankInput && this.playersData[position]) {
            const maxRank = this.playersData[position].length;
            rankInput.max = maxRank;
            // If current value is higher than max, reset to max
            if (parseInt(rankInput.value) > maxRank) {
                rankInput.value = maxRank;
            }
        }
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

    downloadPDF() {
        // Open homepage in a new window and trigger print dialog
        const printWindow = window.open('/', '_blank');
        
        if (printWindow) {
            // Use a more reliable approach to detect when page is loaded
            const checkLoaded = () => {
                if (printWindow.document.readyState === 'complete') {
                    setTimeout(() => {
                        printWindow.print();
                    }, 1000); // Longer delay to ensure everything is rendered
                } else {
                    setTimeout(checkLoaded, 100);
                }
            };
            
            // Start checking after a brief delay
            setTimeout(checkLoaded, 500);
        } else {
            // Fallback if popup is blocked
            alert('Please allow popups for this site to download PDF, or use Preview button to open the page and print manually.');
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