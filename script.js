document.addEventListener('DOMContentLoaded', () => {
    const INVENTORY_SIZE = 30;
    const NUM_CANDY_TYPES = 5;
    
    // State
    let inventory = new Array(INVENTORY_SIZE).fill(0); // 0 means empty, 1-5 means candy type
    let activeSlotIndex = null;
    
    // DOM Elements
    const gridEl = document.getElementById('inventory-grid');
    const tradesContainer = document.getElementById('trades-container');
    const calculateBtn = document.getElementById('calculate-btn');
    const resultsContent = document.getElementById('results-content');
    const clearInventoryBtn = document.getElementById('clear-inventory-btn');

    // Initialize Inventory Grid
    for (let i = 0; i < INVENTORY_SIZE; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot';
        slot.dataset.index = i;
        slot.addEventListener('click', () => {
            // Deselect previous
            if (activeSlotIndex !== null) {
                gridEl.children[activeSlotIndex].classList.remove('active');
            }
            
            // If clicking the same slot, toggle off
            if (activeSlotIndex === i) {
                activeSlotIndex = null;
            } else {
                activeSlotIndex = i;
                slot.classList.add('active');
            }
        });
        gridEl.appendChild(slot);
    }
    
    // Keyboard Handling for Inventory
    document.addEventListener('keydown', (e) => {
        if (activeSlotIndex === null) return;
        
        // Ignore if focus is in an input field
        if (e.target.tagName === 'INPUT') return;
        
        const key = e.key;
        if (['1', '2', '3', '4', '5'].includes(key)) {
            setSlotCandy(activeSlotIndex, parseInt(key));
            
            // Auto-advance to next slot
            gridEl.children[activeSlotIndex].classList.remove('active');
            activeSlotIndex = (activeSlotIndex + 1) % INVENTORY_SIZE;
            gridEl.children[activeSlotIndex].classList.add('active');
        } else if (key === '0' || key === 'Backspace' || key === 'Delete') {
            setSlotCandy(activeSlotIndex, 0);
        }
    });
    
    function setSlotCandy(index, candyType) {
        inventory[index] = candyType;
        const slot = gridEl.children[index];
        
        // Update visual
        slot.innerHTML = '';
        if (candyType > 0) {
            const img = document.createElement('img');
            img.src = `images/candy_image_${candyType}_psd.png`;
            slot.appendChild(img);
            slot.classList.add('filled');
        } else {
            slot.classList.remove('filled');
        }
    }

    if (clearInventoryBtn) {
        clearInventoryBtn.addEventListener('click', () => {
            for (let i = 0; i < INVENTORY_SIZE; i++) {
                setSlotCandy(i, 0);
            }
        });
    }
    
    // State for Trades: array of 4 trades, each has a 'give' array and 'get' array (storing candy types 1-5)
    let tradeStates = [
        { give: [], get: [] },
        { give: [], get: [] },
        { give: [], get: [] },
        { give: [], get: [] }
    ];

    // Target State
    let targetState = []; // array of candy types 1-5

    // Custom Recipes State
    let customRecipe = { give: 0, get: 0 }; // 0 means unset

    // Popup Element
    const popup = document.createElement('div');
    popup.className = 'candy-popup';
    popup.style.display = 'none';
    document.body.appendChild(popup);
    
    let activePopupAction = null; // { type: 'trade', index, side }, { type: 'target' }, or { type: 'custom_recipe_give/get', index }

    // Click outside popup to close it
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.candy-popup') && !e.target.closest('.add-candy-btn') && !e.target.closest('.custom-recipe-block') && !e.target.closest('.trade-candy-slot')) {
            popup.style.display = 'none';
        }
    });

    popup.addEventListener('click', (e) => {
        const clearPopupBtn = e.target.closest('.clear-popup-btn');
        
        if (clearPopupBtn) {
            if (activePopupAction.type === 'custom_recipe_give') {
                customRecipe.give = 0;
                renderCustomRecipes();
            } else if (activePopupAction.type === 'custom_recipe_get') {
                customRecipe.get = 0;
                renderCustomRecipes();
            }
            popup.style.display = 'none';
            return;
        }
        
        const btn = e.target.closest('.popup-candy') || e.target.closest('.popup-candy-row');
        if (!btn) return;
        const candyType = parseInt(btn.dataset.candy);
        
        if (activePopupAction.type === 'trade') {
            const { index, side } = activePopupAction;
            tradeStates[index][side].push(candyType);
            renderTrades();
        } else if (activePopupAction.type === 'target') {
            targetState.push(candyType);
            renderTarget();
        } else if (activePopupAction.type === 'custom_recipe_give') {
            customRecipe.give = candyType;
            renderCustomRecipes();
        } else if (activePopupAction.type === 'custom_recipe_get') {
            customRecipe.get = candyType;
            renderCustomRecipes();
        }
        popup.style.display = 'none';
    });

    function showPopup(e, action) {
        activePopupAction = action;
        
        // Rebuild popup contents based on action
        popup.innerHTML = '';
        popup.style.flexDirection = (action.type === 'custom_recipe_give') ? 'column' : 'row';
        
        for (let i = 1; i <= NUM_CANDY_TYPES; i++) {
            // Prevent selecting the same candy for both give and get in custom recipe
            if (action.type === 'custom_recipe_give' && customRecipe.get === i) continue;
            if (action.type === 'custom_recipe_get' && customRecipe.give === i) continue;
            
            if (action.type === 'custom_recipe_give') {
                const row = document.createElement('div');
                row.className = 'popup-candy-row';
                row.dataset.candy = i;
                
                // Count how many of type 'i' are in inventory
                let count = 0;
                for (let candy of inventory) {
                    if (candy === i) count++;
                }
                
                // Show 3 candies
                for (let j = 0; j < 3; j++) {
                    const img = document.createElement('img');
                    img.src = `images/candy_image_${i}_psd.png`;
                    if (j >= count) {
                        img.style.opacity = '0.2'; // Dimmed if not enough in inventory
                    }
                    row.appendChild(img);
                }
                popup.appendChild(row);
            } else {
                const candyBtn = document.createElement('div');
                candyBtn.className = 'popup-candy';
                candyBtn.dataset.candy = i;
                const img = document.createElement('img');
                img.src = `images/candy_image_${i}_psd.png`;
                candyBtn.appendChild(img);
                popup.appendChild(candyBtn);
            }
        }
        
        // Clear button
        const clearBtn = document.createElement('div');
        clearBtn.className = 'clear-popup-btn';
        clearBtn.innerHTML = '❌ Сбросить';
        clearBtn.title = 'Сбросить';
        clearBtn.dataset.action = 'clear';
        if (action.type === 'custom_recipe_give') {
            clearBtn.style.width = '100%';
            clearBtn.style.marginTop = '4px';
        } else {
            clearBtn.innerHTML = '❌';
        }
        popup.appendChild(clearBtn);
        
        const triggerEl = e.target.closest('.add-candy-btn, .custom-recipe-block, .trade-candy-slot');
        const rect = triggerEl ? triggerEl.getBoundingClientRect() : e.target.getBoundingClientRect();
        popup.style.display = 'flex';
        // Position slightly above the button
        popup.style.top = `${rect.top + window.scrollY - popup.offsetHeight - 10}px`;
        popup.style.left = `${rect.left + window.scrollX - (popup.offsetWidth / 2) + (rect.width / 2)}px`;
    }

    function renderTrades() {
        tradesContainer.innerHTML = '';
        tradeStates.forEach((trade, i) => {
            const row = document.createElement('div');
            row.className = 'trade-row';
            
            // Give side
            const giveSide = document.createElement('div');
            giveSide.className = 'trade-side give-side';
            trade.give.forEach((candy, idx) => {
                const slot = document.createElement('div');
                slot.className = 'trade-candy-slot filled';
                slot.innerHTML = `<img src="images/candy_image_${candy}_psd.png">`;
                slot.title = "Нажмите, чтобы удалить";
                slot.addEventListener('click', () => {
                    tradeStates[i].give.splice(idx, 1);
                    renderTrades();
                });
                giveSide.appendChild(slot);
            });
            const giveAdd = document.createElement('button');
            giveAdd.className = 'add-candy-btn';
            giveAdd.innerHTML = '+';
            giveAdd.addEventListener('click', (e) => showPopup(e, { type: 'trade', index: i, side: 'give' }));
            if (trade.give.length < 5) giveSide.appendChild(giveAdd); // max 5 per side

            const arrow = document.createElement('div');
            arrow.className = 'trade-arrow';
            arrow.innerHTML = '➔';

            // Get side
            const getSide = document.createElement('div');
            getSide.className = 'trade-side get-side';
            trade.get.forEach((candy, idx) => {
                const slot = document.createElement('div');
                slot.className = 'trade-candy-slot filled';
                slot.innerHTML = `<img src="images/candy_image_${candy}_psd.png">`;
                slot.title = "Нажмите, чтобы удалить";
                slot.addEventListener('click', () => {
                    tradeStates[i].get.splice(idx, 1);
                    renderTrades();
                });
                getSide.appendChild(slot);
            });
            const getAdd = document.createElement('button');
            getAdd.className = 'add-candy-btn';
            getAdd.innerHTML = '+';
            getAdd.addEventListener('click', (e) => showPopup(e, { type: 'trade', index: i, side: 'get' }));
            if (trade.get.length < 5) getSide.appendChild(getAdd);

            row.appendChild(giveSide);
            row.appendChild(arrow);
            row.appendChild(getSide);
            tradesContainer.appendChild(row);
        });
    }

    // Replace old Target logic to also use interactive slots
    const targetInputsContainer = document.querySelector('.target-inputs');
    targetInputsContainer.innerHTML = '';
    
    function renderTarget() {
        targetInputsContainer.innerHTML = '';
        targetState.forEach((candy, idx) => {
            const slot = document.createElement('div');
            slot.className = 'trade-candy-slot filled';
            slot.innerHTML = `<img src="images/candy_image_${candy}_psd.png">`;
            slot.title = "Нажмите, чтобы удалить";
            slot.addEventListener('click', () => {
                targetState.splice(idx, 1);
                renderTarget();
            });
            targetInputsContainer.appendChild(slot);
        });
        
        const targetAdd = document.createElement('button');
        targetAdd.className = 'add-candy-btn';
        targetAdd.innerHTML = '+';
        targetAdd.addEventListener('click', (e) => showPopup(e, { type: 'target' }));
        targetInputsContainer.appendChild(targetAdd);
    }

    function renderCustomRecipes() {
        const container = document.getElementById('custom-recipe-container');
        if (!container) return;
        
        container.innerHTML = '';
        
        const row = document.createElement('div');
        row.className = 'custom-recipe-row';
        
        // Give side (clickable block with 3 candies or empty slots)
        const giveSide = document.createElement('div');
        giveSide.className = 'custom-recipe-block';
        for (let j = 0; j < 3; j++) {
            const slot = document.createElement('div');
            slot.className = 'trade-candy-slot ' + (customRecipe.give > 0 ? 'filled' : '');
            slot.innerHTML = customRecipe.give > 0 
                ? `<img src="images/candy_image_${customRecipe.give}_psd.png">` 
                : ''; // empty slot
            giveSide.appendChild(slot);
        }
        const giveDropdown = document.createElement('span');
        giveDropdown.className = 'dropdown-icon';
        giveDropdown.innerHTML = '▼';
        giveSide.appendChild(giveDropdown);
        giveSide.addEventListener('click', (e) => showPopup(e, { type: 'custom_recipe_give' }));
        
        const arrow = document.createElement('div');
        arrow.className = 'trade-arrow';
        arrow.innerHTML = '➔';
        
        // Get side (clickable block with 1 candy or empty slot)
        const getSide = document.createElement('div');
        getSide.className = 'custom-recipe-block';
        const getSlot = document.createElement('div');
        getSlot.className = 'trade-candy-slot ' + (customRecipe.get > 0 ? 'filled' : '');
        getSlot.innerHTML = customRecipe.get > 0 
            ? `<img src="images/candy_image_${customRecipe.get}_psd.png">` 
            : '';
        getSide.appendChild(getSlot);
        const getDropdown = document.createElement('span');
        getDropdown.className = 'dropdown-icon';
        getDropdown.innerHTML = '▼';
        getSide.appendChild(getDropdown);
        getSide.addEventListener('click', (e) => showPopup(e, { type: 'custom_recipe_get' }));
        
        row.appendChild(giveSide);
        row.appendChild(arrow);
        row.appendChild(getSide);
        container.appendChild(row);
    }

    // Initialize Trades, Target, and Custom Recipes UI
    renderTrades();
    renderTarget();
    renderCustomRecipes();
    
    // BFS Algorithm
    calculateBtn.addEventListener('click', () => {
        // Parse current inventory
        const startState = [0, 0, 0, 0, 0];
        for (let candy of inventory) {
            if (candy > 0) startState[candy - 1]++;
        }
        
        // Parse target
        const target = [0, 0, 0, 0, 0];
        for (let candy of targetState) {
            target[candy - 1]++;
        }
        
        // Parse trades
        const trades = [];
        tradeStates.forEach((tradeState, index) => {
            const give = [0, 0, 0, 0, 0];
            const get = [0, 0, 0, 0, 0];
            let hasGive = false;
            let hasGet = false;

            tradeState.give.forEach(candy => {
                give[candy - 1]++;
                hasGive = true;
            });
            tradeState.get.forEach(candy => {
                get[candy - 1]++;
                hasGet = true;
            });

            if (hasGive || hasGet) {
                trades.push({ id: (index + 1).toString(), give, get });
            }
        });
        
        // Parse custom recipe
        if (customRecipe.give > 0 && customRecipe.get > 0 && customRecipe.give !== customRecipe.get) {
            const give = [0, 0, 0, 0, 0];
            const get = [0, 0, 0, 0, 0];
            give[customRecipe.give - 1] = 3;
            get[customRecipe.get - 1] = 1;
            trades.push({ id: `Свой рецепт`, give, get });
        } else if (customRecipe.give === 0 || customRecipe.get === 0) {
            // Auto-mode: add all possible custom recipes based on what's unset
            for (let i = 1; i <= 5; i++) {
                for (let j = 1; j <= 5; j++) {
                    if (i === j) continue;
                    // If give is set, only allow that give
                    if (customRecipe.give > 0 && customRecipe.give !== i) continue;
                    // If get is set, only allow that get
                    if (customRecipe.get > 0 && customRecipe.get !== j) continue;
                    
                    const give = [0, 0, 0, 0, 0];
                    const get = [0, 0, 0, 0, 0];
                    give[i - 1] = 3;
                    get[j - 1] = 1;
                    trades.push({ id: `Свой рецепт (Авто)`, give, get });
                }
            }
        }
        
        const path = findShortestPath(startState, target, trades);
        displayResults(path);
    });
    
    function findShortestPath(startState, target, trades) {
        // Check if already reached target
        if (meetsTarget(startState, target)) return { success: true, path: [] };
        
        const queue = [{ state: startState, path: [] }];
        const visited = new Set();
        visited.add(startState.join(','));
        
        let iterations = 0;
        const MAX_ITERATIONS = 50000; // safety limit to prevent browser freeze
        
        while (queue.length > 0 && iterations < MAX_ITERATIONS) {
            iterations++;
            const current = queue.shift();
            
            for (let trade of trades) {
                if (canApplyTrade(current.state, trade.give)) {
                    const newState = applyTrade(current.state, trade.give, trade.get);
                    
                    // Check max capacity constraint
                    const totalCandies = newState.reduce((sum, val) => sum + val, 0);
                    if (totalCandies > INVENTORY_SIZE) continue;
                    
                    const stateKey = newState.join(',');
                    if (!visited.has(stateKey)) {
                        const newPath = [...current.path, trade];
                        
                        if (meetsTarget(newState, target)) {
                            return { success: true, path: newPath };
                        }
                        
                        visited.add(stateKey);
                        queue.push({ state: newState, path: newPath });
                    }
                }
            }
        }
        
        if (iterations >= MAX_ITERATIONS) {
            return { success: false, error: 'Слишком сложный путь (достигнут лимит вычислений).' };
        }
        
        return { success: false, error: 'Невозможно достичь нужной награды с данными трейдами.' };
    }
    
    function meetsTarget(state, target) {
        for (let i = 0; i < NUM_CANDY_TYPES; i++) {
            if (state[i] < target[i]) return false;
        }
        return true;
    }
    
    function canApplyTrade(state, give) {
        for (let i = 0; i < NUM_CANDY_TYPES; i++) {
            if (state[i] < give[i]) return false;
        }
        return true;
    }
    
    function applyTrade(state, give, get) {
        const newState = [...state];
        for (let i = 0; i < NUM_CANDY_TYPES; i++) {
            newState[i] = newState[i] - give[i] + get[i];
        }
        return newState;
    }
    
    function displayResults(result) {
        resultsContent.innerHTML = '';
        
        if (!result.success) {
            resultsContent.innerHTML = `<p class="error-msg">${result.error}</p>`;
            return;
        }
        
        if (result.path.length === 0) {
            resultsContent.innerHTML = `<p class="placeholder-text" style="color: var(--text-accent);">У вас уже достаточно конфет для этой награды!</p>`;
            return;
        }
        
        const pathList = document.createElement('div');
        
        let currentState = [0, 0, 0, 0, 0];
        for (let candy of inventory) {
            if (candy > 0) currentState[candy - 1]++;
        }
        
        result.path.forEach((trade, index) => {
            currentState = applyTrade(currentState, trade.give, trade.get);
            
            const stepEl = document.createElement('div');
            stepEl.className = 'path-step';
            
            let giveImages = '';
            let getImages = '';
            
            for (let i = 0; i < NUM_CANDY_TYPES; i++) {
                for (let j = 0; j < trade.give[i]; j++) {
                    giveImages += `<img src="images/candy_image_${i+1}_psd.png">`;
                }
                for (let j = 0; j < trade.get[i]; j++) {
                    getImages += `<img src="images/candy_image_${i+1}_psd.png">`;
                }
            }
            
            const titleText = (typeof trade.id === 'string' && trade.id.startsWith('Свой')) ? trade.id : `Трейд #${trade.id}`;
            stepEl.innerHTML = `
                <div class="path-step-title">Шаг ${index + 1} (${titleText})</div>
                <div class="path-step-details">
                    Отдать: <div class="candy-mini-list">${giveImages}</div>
                    <span style="color: var(--text-accent); margin: 0 10px;">➔</span>
                    Получить: <div class="candy-mini-list">${getImages}</div>
                </div>
            `;
            
            pathList.appendChild(stepEl);
        });
        
        const summaryEl = document.createElement('p');
        summaryEl.style.marginTop = '15px';
        summaryEl.style.color = 'var(--text-accent)';
        summaryEl.style.fontWeight = 'bold';
        summaryEl.textContent = `Итого трейдов: ${result.path.length}`;
        pathList.appendChild(summaryEl);
        
        resultsContent.appendChild(pathList);
    }
});
