(function() {
    // ====================
    // Section 1 - State Management
    // ====================
    const State = {
		assignments: [],
		week: 1,
		cycleNumber: 1,
		seed: 1,
		startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0], // Default to start of today
		siblings: ['Steve', 'Mary', 'Sue'],  // Default family members
		chores: ['Raking', 'Shoveling', 'Gardening'],  // Default chores
		personChores: {},
		history: {},
		showDates: true,  // Default to checked
    };
    
    // Initialize State
    const initializeState = () => {
        // Initialize personChores and history for each sibling
        State.siblings.forEach(sibling => {
            if (!State.personChores[sibling]) {
                State.personChores[sibling] = new Set();
            }
            if (!State.history[sibling]) {
                State.history[sibling] = [];
            }
        });

		// Initialize display settings if needed (e.g., from localStorage in the future)
		// For now, default is already set in State		

    };
	
	// State Management Utilities
	const StateManager = {
		resetState: () => {
			State.siblings.forEach(sibling => {
				State.personChores[sibling] = new Set();
				State.history[sibling] = [];
			});
			State.assignments = [];
		},
		
		updateCycleAndWeek: (cycle, week) => {
			const normalized = normalizeWeekAndCycle(cycle, week);
			State.cycleNumber = normalized.cycle;
			State.week = normalized.week;
		},
		
		validateAndNormalize: (cycle, week) => {
			if (cycle < 1 || week < 1) {
				displayMessage("Cycle and Week numbers must be positive integers.", "error", true);
				return null;
			}
			return normalizeWeekAndCycle(cycle, week);
		},

		clearCycleData: (sibling) => {
			State.personChores[sibling].clear();
			State.history[sibling] = [];
		},

		nextWeekCycle: () => {
			let nextWeek = State.week + 1;
			let nextCycle = State.cycleNumber;
			
			if (nextWeek > State.chores.length) {
				nextCycle += 1;
				nextWeek = 1;
			}
			
			return { cycle: nextCycle, week: nextWeek };
		},
		
	};
    
	// Reset System using StateManager
	const resetSystem = () => {
		if (confirm("Are you sure you want to reset the system?")) {
			StateManager.resetState();
			StateManager.updateCycleAndWeek(1, 1);
			State.seed = 1;
			
			updateUI();
			assignChores();
		}
	};
    
    // ====================
    // Section 2 - Configuration and Constants
    // ====================
    
    const UILabels = {
        done: 'Done',
    };
    
	// Date formatting utilities
	const formatDateForDisplay = (isoDate) => {
		// Create date and adjust for timezone
		const date = new Date(isoDate);
		date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
		
		const mm = String(date.getMonth() + 1).padStart(2, '0');
		const dd = String(date.getDate()).padStart(2, '0');
		const yy = String(date.getFullYear()).slice(-2);
		return `${mm}/${dd}/${yy}`;
	};

	// Helper function to format dates consistently across the app
	const formatDateSymbol = (date) => {
		const month = date.getMonth() + 1; // Months are zero-based
		const day = date.getDate();
		return `(⇲${month}/${day})`;
	};
	
	
	const parseDateFromDisplay = (displayDate) => {
		try {
			// Handle both MM/DD/YY and DD/MM/YY formats
			const parts = displayDate.split('/').map(part => part.trim());
			if (parts.length !== 3) throw new Error('Invalid date parts');

			let [first, second, yy] = parts;
			
			// If first number is greater than 12, assume it's DD-MM-YY and swap
			const mm = parseInt(first) > 12 ? second : first;
			const dd = parseInt(first) > 12 ? first : second;
			
			const year = '20' + yy;
			const date = new Date(`${year}-${mm}-${dd}T00:00:00`);
			date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
			
			if (isNaN(date.getTime())) throw new Error('Invalid date');
			
			return date.toISOString().split('T')[0];
		} catch (e) {
			throw new Error('Invalid date format');
		}
	};
	
    // Copy to Clipboard
    const copyToClipboard = () => {
        const textArea = document.getElementById('export-import-text');
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices
    
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                displayMessage('Settings copied to clipboard!', "success", true);
            } else {
                displayMessage('Failed to copy settings.', "error", true);
            }
        } catch (err) {
            displayMessage('Error copying to clipboard.', "error", true);
        }
    };
    
    // Apply Settings from Text Area
    const applySettings = () => {
        const text = document.getElementById('export-import-text').value.trim();
        if (!text) {
            displayMessage("Please enter settings to apply.", "error", true);
            return;
        }
    
        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
		if (lines.length !== 4) {
			displayMessage("Invalid format. Please ensure there are exactly four lines:\n1. Chores\n2. Names\n3. Cycle, Week, Seed\n4. Start Date", "error", true);
			return;
		}
    
        const [choresLine, namesLine, cycleWeekSeedLine,startDateLine] = lines;
    
        // Parse chores
        const parsedChores = choresLine.split(',').map(chore => chore.trim()).filter(chore => chore.length > 0);
        if (parsedChores.length === 0) {
            displayMessage("Invalid chores list. Please enter at least one chore.", "error", true);
            return;
        }
    
        // Parse names
        const parsedNames = namesLine.split(',').map(name => name.trim()).filter(name => name.length > 0);
        if (parsedNames.length === 0) {
            displayMessage("Invalid names list. Please enter at least one name.", "error", true);
            return;
        }
    
		// Parse cycle, week, seed
		const cycleWeekSeedParts = cycleWeekSeedLine.split(',').map(part => part.trim());
		if (cycleWeekSeedParts.length !== 3) {
			displayMessage("Invalid Cycle, Week, Seed line. Please enter three comma-separated numbers.", "error", true);
			return;
		}

        let isoDate;
        // Validate and convert the date
        try {
            isoDate = parseDateFromDisplay(startDateLine);
            const parsedDate = new Date(isoDate);
            if (isNaN(parsedDate.getTime())) {
                throw new Error("Invalid date");
            }
        } catch (e) {
            displayMessage(`Invalid date format. Please use MM/DD/YY format. Example: 11/05/24`, "error", true);
            return;
        }

        // Parse and validate cycle, week, seed
        const [parsedCycle, parsedWeek, parsedSeed] = cycleWeekSeedParts.map(part => Number(part));
        if (
            isNaN(parsedCycle) || parsedCycle < 1 ||
            isNaN(parsedWeek) || parsedWeek < 1 ||
            isNaN(parsedSeed)
        ) {
            displayMessage("Cycle and Week must be positive integers, and Seed must be a number.", "error", true);
            return;
        }
    
        // Apply all settings at once
        State.chores = parsedChores;
        State.siblings = parsedNames;
        State.seed = parsedSeed;
        State.startDate = isoDate;

        // Update the date picker with formatted date
        const startDateInput = document.getElementById('start-date');
        if (startDateInput) {
            startDateInput.value = formatDateForDisplay(isoDate);
        }
    
        // Reinitialize history and personChores
        initializeState();
    
        // Reset cycle and week
        State.cycleNumber = 1;
        State.week = 1;
    
		// Use the jump function instead of manual simulation
		jumpToWeekCycle(parsedCycle, parsedWeek);
    
        updateUI();
        displayMessage('Settings applied successfully!', "success", true);
    };
    
    // ====================
    // Section 3 - Utility Functions
    // ====================
    
    // Shuffle Array Based on Seed
    const shuffleArray = (array, seed) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = seededRandom(seed + i, i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };
    
    // Generate a seeded random number
    const seededRandom = (seed, max) => {
        const x = Math.sin(seed) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };
    
    // Display Message Function
    const displayMessage = (message, type, fixed = false) => {
        // Create a message div
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
    
        if (fixed) {
            // Remove existing message with the same text to re-trigger animation
            const existingMessage = Array.from(document.querySelectorAll('.fixed-message-container .message')).find(msg => msg.textContent === message);
            if (existingMessage) {
                // Trigger fade-out on the existing message
                existingMessage.classList.add('fade-out');
                existingMessage.addEventListener('animationend', () => {
                    existingMessage.remove();
                });
            }
    
            // Append to fixed message container
            const fixedContainer = document.querySelector('.fixed-message-container');
            fixedContainer.appendChild(messageDiv);
    
            // Add click event to remove the message on tap
            messageDiv.addEventListener('click', () => {
                messageDiv.classList.add('fade-out');
                messageDiv.addEventListener('animationend', () => {
                    messageDiv.remove();
                });
            });
            
            // Remove the message after 3 seconds with fade-out animation
            setTimeout(() => {
                messageDiv.classList.add('fade-out');
                messageDiv.addEventListener('animationend', () => {
                    messageDiv.remove();
                });
            }, 3000);
            
        } else {
            // Insert the message at the top of the container
            const container = document.querySelector('.container');
            container.insertBefore(messageDiv, container.firstChild);
    
            // Remove the message after 3 seconds with fade-out animation
            setTimeout(() => {
                messageDiv.classList.add('fade-out');
                messageDiv.addEventListener('animationend', () => {
                    messageDiv.remove();
                });
            }, 3000);
        }
    };

	/**
	 * Retrieves the cycle and week for a chore based on how many weeks back it was assigned.
	 * @param {number} weeksBack - Number of weeks back from the current week.
	 * @returns {object} - An object containing the adjusted cycle and week.
	 */
	const getPreviousCycleAndWeek = (weeksBack) => {
		let adjustedCycle = State.cycleNumber;
		let adjustedWeek = State.week - weeksBack;

		while (adjustedWeek < 1) {
			adjustedCycle -= 1;
			if (adjustedCycle < 1) {
				adjustedCycle = 1;
				adjustedWeek = 1;
				break;
			}
			adjustedWeek += State.chores.length;
		}

		return { cycle: adjustedCycle, week: adjustedWeek };
	};

	
	/*
	 * Calculates the end date for a chore based on the current cycle and week.
	 * @param {number} cycle - The current cycle number.
	 * @param {number} week - The current week number.
	 * @returns {Date} - The calculated end date.
	 */
	const calculateEndDate = (cycle, week) => {
		// Calculate the end date for the given cycle and week
		const weeksPerCycle = State.chores.length;
		const totalWeeks = (cycle - 1) * weeksPerCycle + (week - 1);
		const endDate = new Date(State.startDate);
		// Add 7 days times the number of weeks to get to the same day of next week
		endDate.setDate(endDate.getDate() + (totalWeeks + 1) * 7);
		return endDate;
	};

	/**
	 * Retrieves the end date for a specific chore in history.
	 * @param {string} sibling - The name of the sibling.
	 * @param {string} chore - The name of the chore.
	 * @returns {Date} - The end date of the chore.
	 */
	const getChoreEndDate = (sibling, chore) => {
		// Implement logic to retrieve the end date for the chore
		// For simplicity, assume it's the same as calculateEndDate()
		return calculateEndDate(State.cycleNumber, State.week);
	};

	/**
	 * Formats a Date object into (M/D) format.
	 * @param {Date} date - The date to format.
	 * @returns {string} - The formatted date string.
	 */
	const formatDate = (date) => {
		const month = date.getMonth() + 1; // Months are zero-based
		const day = date.getDate();
		return `⇲${month}/${day}`;
	};
    
    // ====================
    // Section 4 - People and Chore Management
    // ====================
    
    /**
     * Adds a new person to the chore rotation system.
     * @param {string} name - The name of the person to add.
     */
    const addPerson = (name) => {
        name = name.trim();
        if (name && !State.siblings.includes(name)) {
            State.siblings.push(name);
            State.personChores[name] = new Set();
            State.history[name] = [];
            updateUI();
        } else {
            displayMessage("Invalid or duplicate name.", "error", true);
        }
    };
    
    /**
     * Removes an existing person from the chore rotation system.
     * @param {string} name - The name of the person to remove.
     */
    const removePerson = (name) => {
        const index = State.siblings.indexOf(name);
        if (index !== -1) {
            State.siblings.splice(index, 1);
            delete State.personChores[name];
            delete State.history[name];
            updateUI();
        }
    };
    
    /**
     * Adds a new chore to the chore rotation system.
     * @param {string} chore - The chore to add.
     */
    const addChore = (chore) => {
        chore = chore.trim();
        if (chore && !State.chores.includes(chore)) {
            State.chores.push(chore);
            updateUI();
        } else {
            displayMessage("Invalid or duplicate chore.", "error", true);
        }
    };
    
    /**
     * Removes an existing chore from the chore rotation system.
     * @param {string} chore - The chore to remove.
     */
    const removeChore = (chore) => {
        const index = State.chores.indexOf(chore);
        if (index !== -1) {
            State.chores.splice(index, 1);
            // Also remove from personChores and history
            State.siblings.forEach(sibling => {
                State.personChores[sibling].delete(chore);
                State.history[sibling] = State.history[sibling].filter(item => item !== chore && item !== `${chore} (Shared Assignment)`);
            });
            updateUI();
        }
    };
    
    // ====================
    // Section 5 - Chore Assignment Logic
    // ====================
	
	/**
	 * Validates and constrains week numbers within valid ranges
	 * @param {number} week - The week number to validate
	 * @returns {number} - Returns a valid week number
	 */
	const validateWeekNumber = (week, cycle = State.cycleNumber) => {
		// If we're in a new cycle, we should allow all weeks up to chores length
		const isNewCycle = cycle !== State.cycleNumber;

		// If week is less than 1, set to 1
		if (week < 1) {
			displayMessage(`Week cannot be less than 1. Setting to week 1.`, "error", true);
			return 1;
		}
		// If week is greater than chores length, reset to 1
		if (week > State.chores.length) {
			// Only reset and show message if we're in the current cycle
			if (!isNewCycle) {
				displayMessage(`Week ${week} is invalid. Maximum week for this cycle is ${State.chores.length}. Resetting to week 1.`, "error", true);
				return 1;
			} else {
				// For new cycles, handle the overflow properly
				const adjustedWeek = ((week - 1) % State.chores.length) + 1;
				return adjustedWeek;
			}
		}
		return week;
	};
    /**
     * Checks if the current cycle is complete.
     * A cycle is complete when all chores have been assigned to all siblings.
     * @returns {boolean} - Returns true if the cycle is complete, otherwise false.
     */
    const isCycleComplete = () => {
        // A cycle is complete when the current cycle number has been reached
        // and the current week exceeds the number of chores
        return State.cycleNumber >= 1 && State.week > State.chores.length;
    };
    
    /**
     * Assigns chores to siblings based on the current state.
     * Ensures that chores are distributed fairly and without immediate repetition.
     */
    const assignChores = () => {
        // Validate that there are siblings and chores to assign
        if (State.siblings.length === 0 || State.chores.length === 0) {
            displayMessage("Please add at least one person and one chore in settings.", "error", true);
            return;
        }

        // Clear personChores at the start of each new cycle if it's week 1
        if (State.week === 1) {
            State.siblings.forEach(sibling => {
                State.personChores[sibling].clear();
            });
        }
    
        // Retrieve last week's chores to avoid immediate repetition
        const lastWeekChores = new Set(State.assignments.map(a => a.chore));
    
        // Initialize for new assignments
        const newAssignments = [];
        const usedChoresThisWeek = new Set();
        const weekSeed = State.seed + State.week + (State.cycleNumber * 1000);
    
        // Shuffle siblings based on the current seed to ensure fairness
        const shuffledSiblings = shuffleArray([...State.siblings], weekSeed);
    
        // Assign unique chores to siblings, avoiding repetition from the last week
        const unassignedSiblings = [];
        const maxAttempts = 10; // Prevent infinite loops in case of limited chore options
    
        shuffledSiblings.forEach(person => {
            let assigned = false;
            for (let attempt = 0; attempt < maxAttempts && !assigned; attempt++) {
                // Determine available chores for the current sibling
                const availableChores = State.chores.filter(chore =>
                    !State.personChores[person].has(chore) &&
                    !usedChoresThisWeek.has(chore) &&
                    !lastWeekChores.has(chore)
                );
    
                // If no chores are available without repetition, relax the constraints
                const choresToConsider = availableChores.length > 0
                    ? availableChores
                    : State.chores.filter(chore =>
                        !State.personChores[person].has(chore) &&
                        !usedChoresThisWeek.has(chore)
                    );
    
                if (choresToConsider.length > 0) {
                    // Select a chore based on the seeded random number
                    const selectedChore = choresToConsider[seededRandom(weekSeed + shuffledSiblings.indexOf(person) + attempt, choresToConsider.length)];
                    newAssignments.push({ sibling: person, chore: selectedChore, shared: false });
                    usedChoresThisWeek.add(selectedChore);
                    State.personChores[person].add(selectedChore);
                    State.history[person].push(selectedChore);
                    assigned = true;
                }
            }
    
            if (!assigned) {
                // If unable to assign a unique chore, mark the sibling for shared assignment
                unassignedSiblings.push(person);
            }
        });
    
        // Assign shared chores to siblings who couldn't receive a unique chore
        unassignedSiblings.forEach(person => {
            let assigned = false;
            for (let attempt = 0; attempt < maxAttempts && !assigned; attempt++) {
                // Determine available chores for shared assignment
                const availableChores = State.chores.filter(chore =>
                    !State.personChores[person].has(chore) &&
                    !lastWeekChores.has(chore)
                );
    
                // If no chores are available without repetition, allow any chore not yet assigned this week
                const choresToConsider = availableChores.length > 0
                    ? availableChores
                    : State.chores.filter(chore =>
                        !State.personChores[person].has(chore)
                    );
    
                if (choresToConsider.length > 0) {
                    // Select a chore based on the seeded random number
                    const selectedChore = choresToConsider[seededRandom(weekSeed + shuffledSiblings.indexOf(person) + attempt, choresToConsider.length)];
                    newAssignments.push({ sibling: person, chore: selectedChore, shared: true });
                    State.personChores[person].add(selectedChore);
                    State.history[person].push(`${selectedChore} (Shared Assignment)`);
                    assigned = true;
                }
            }
    
            if (!assigned) {
                // Display an error if unable to assign any chore
                displayMessage(`Unable to find suitable chore assignment for ${person}. Please check your chore distribution.`, "error", true);
            }
        });
    
        // Update the state with the new assignments
        State.assignments = newAssignments;
        updateUI();
    };
    
    /**
     * Calculates the current cycle and week based on a given date.
     * @param {Date} targetDate - The date to calculate from.
     * @returns {object|null} - Returns an object with cycle and week numbers or null if validation fails.
     */
    const calculateCycleAndWeekFromDate = (targetDate) => {
		// Prevent calculation if no chores or siblings
		if (State.siblings.length === 0 || State.chores.length === 0) {
			displayMessage("Please add at least one person and one chore in settings.", "error", true);
			return null;
		}

		// Convert MMDDYY to Date object
		const startDate = new Date(State.startDate);
		const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
		const totalWeeks = Math.floor(daysDiff / 7) + 1;
		
		// Calculate using number of chores as weeks per cycle
		const weeksPerCycle = State.chores.length;
		// Ensure we don't get zero or negative numbers
		const currentCycle = Math.max(1, Math.floor((totalWeeks - 1) / weeksPerCycle) + 1);
		const currentWeek = Math.max(1, ((totalWeeks - 1) % weeksPerCycle) + 1);

		// For debugging purposes
		console.log('Date calculation:', {
			daysSinceStart: daysDiff,
			totalWeeks: totalWeeks,
			weeksPerCycle: weeksPerCycle,
			calculatedCycle: currentCycle,
			calculatedWeek: currentWeek
		});

		return {
			cycle: currentCycle,
			week: currentWeek
		};
    };
    
    /**
     * Navigates the system to the current date's corresponding cycle and week.
     */
	const simulateAssignmentsUpTo = (targetCycle, targetWeek) => {
		StateManager.resetState();
		StateManager.updateCycleAndWeek(targetCycle, targetWeek);
		assignChores();
	};

	const goToToday = () => {
		const today = new Date();
		const result = calculateCycleAndWeekFromDate(today);

		if (result) {
			console.log('Navigating to:', {
				cycle: result.cycle,
				week: result.week
			});

			// Use jumpToWeekCycle instead of manual simulation
			jumpToWeekCycle(result.cycle, result.week);
		}
	};

/**
 * Calculates the actual cycle and week based on a given week number
 * @param {number} weekNum - The target week number
 * @returns {object} - Returns normalized cycle and week numbers
 */
const normalizeWeekAndCycle = (targetCycle, targetWeek) => {
    if (targetWeek > State.chores.length) {
        const additionalCycles = Math.floor((targetWeek - 1) / State.chores.length);
        return {
            cycle: targetCycle + additionalCycles,
            week: ((targetWeek - 1) % State.chores.length) + 1
        };
    }
    return { cycle: targetCycle, week: targetWeek };
};

/**
 * Resets the system state for a fresh simulation
 */
const resetSystemState = () => {
    State.siblings.forEach(sibling => {
        State.personChores[sibling] = new Set();
        State.history[sibling] = [];
    });
    State.assignments = [];
};

/**
 * Simulates chore assignments up to a target point
 * @param {number} targetCycle - The target cycle to reach
 * @param {number} targetWeek - The target week to reach
 */
const simulateAssignmentsToTarget = (targetCycle, targetWeek) => {
    let currentCycle = 1;
    let currentWeek = 1;

	// Clear initial state
	StateManager.resetState();

    // Simulate each week's assignments up to the target
    while (currentCycle < targetCycle || (currentCycle === targetCycle && currentWeek < targetWeek)) {
        // Set the current state
        State.cycleNumber = currentCycle;
        State.week = currentWeek;

        // Clear personChores at the start of each new cycle
        if (currentWeek === 1) {
            State.siblings.forEach(sibling => {
                State.personChores[sibling].clear();
            });
        }

        // Make assignments for this week
        assignChores();

        // Move to next week/cycle
        currentWeek++;
        if (currentWeek > State.chores.length) {
            currentCycle++;
            currentWeek = 1;
        }
    }

    // Final state setup
    State.cycleNumber = targetCycle;
    State.week = targetWeek;
};

/**
 * Jumps to a specific week and cycle, handling all necessary state updates
 * @param {number} targetCycle - The cycle to jump to
 * @param {number} targetWeek - The week to jump to
 */
const jumpToWeekCycle = (targetCycle, targetWeek) => {
    console.log('Jumping to:', { targetCycle, targetWeek });
    
    if (targetCycle < 1 || targetWeek < 1) {
        displayMessage("Cycle and Week numbers must be positive integers.", "error", true);
        return;
    }

    // Normalize the week and cycle numbers
    const { cycle: actualCycle, week: actualWeek } = normalizeWeekAndCycle(targetCycle, targetWeek);

    // Simulate all assignments up to target
    simulateAssignmentsToTarget(actualCycle, actualWeek);
    
    // Make the current week's assignments
    assignChores();
    
    // Update the UI
    updateUI();
};
    
    // ====================
    // Section 6 - UI Update and Rendering
    // ====================
    
    /**
     * Updates the entire User Interface to reflect the current state.
     */
    const updateUI = () => {
        updateWeekAndCycleInputs();
        updateSeedInput();
        updateHistory();
        updateCompletedChores();
        updatePeopleList();
        updateChoresList();
        updateExportImportText();
		
		// Update the "Show dates on chores" checkbox state
		const showDatesCheckbox = document.getElementById('show-dates-checkbox');
		if (showDatesCheckbox) {
			showDatesCheckbox.checked = State.showDates;
		}
		
    };
    
    /**
     * Updates the Week and Cycle input fields with the current state values.
     */
    const updateWeekAndCycleInputs = () => {
        const cycleInput = document.getElementById('set-cycle');
        const weekInput = document.getElementById('set-week');
        if (cycleInput && weekInput) {
            cycleInput.value = State.cycleNumber;
            weekInput.value = State.week;
        }
    };
    
    /**
     * Updates the Seed input field with the current seed value.
     */
    const updateSeedInput = () => {
        const seedInput = document.getElementById('seed-input');
        if (seedInput) {
            seedInput.value = State.seed;
        }
    };
    
    /**
     * Updates the Recent History section in the UI.
     */
    const updateHistory = () => {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        historyList.innerHTML = '';
    
        State.siblings.forEach(sibling => {
            const div = document.createElement('div');
            div.className = 'history-item';
            const recentHistory = State.history[sibling].slice(-7);
            let historyText = `<strong>${sibling}:</strong> `;
    
            if (recentHistory.length === 0) {
                historyText += 'No history yet.';
            } else {
                historyText += recentHistory.map((chore, index) => {
					const isCurrentAssignment = index === recentHistory.length - 1 &&
						State.assignments.some(a => a.sibling === sibling && a.chore === chore.replace(' (Shared Assignment)', ''));
					
					let displayChore = chore;

					if (State.showDates) {
						// Calculate how many weeks back this chore was assigned
						const weeksBack = recentHistory.length - index - 1;
						const { cycle, week } = getPreviousCycleAndWeek(weeksBack);
						const endDate = calculateEndDate(cycle, week);
						displayChore += formatDateSymbol(endDate);
					}

					if (isCurrentAssignment) {
						return `<span class="current-assignment">${displayChore}</span>`;
					} else {
						return `<span class="previous-assignment">${displayChore}</span>`;
					}
                }).join(' → ');
            }
    
            div.innerHTML = historyText;
            historyList.appendChild(div);
        });
    };
    
    /**
     * Updates the Completed Chores section in the UI.
     */
    const updateCompletedChores = () => {
        const completedChoresList = document.getElementById('completed-chores-list');
        if (!completedChoresList) return;
        completedChoresList.innerHTML = '';
    
        const table = document.createElement('table');
        table.className = 'completed-chores-table';
    
        // Create header row
        const headerRow = document.createElement('tr');
        State.chores.forEach(chore => {
            const th = document.createElement('th');
            th.textContent = chore;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
    
        // Create rows for each sibling
        State.siblings.forEach(sibling => {
            const row = document.createElement('tr');
    
            State.chores.forEach(chore => {
                const td = document.createElement('td');
                if (State.personChores[sibling].has(chore)) {
                    const isCurrentWeekChore = State.assignments.some(a =>
                        a.sibling === sibling && a.chore === chore
                    );
					if (isCurrentWeekChore) {
						// For current assignments, show name and date if enabled
						if (State.showDates) {
							const endDate = calculateEndDate(State.cycleNumber, State.week);
							td.textContent = `${sibling}${formatDateSymbol(endDate)}`;
						} else {
							td.textContent = sibling;
						}
						td.className = 'assigned';
					} else {
						td.textContent = UILabels.done;
						td.className = 'done';
					}
				}
				row.appendChild(td);
			});

			table.appendChild(row);
		});

		completedChoresList.appendChild(table);
	};
    
    /**
     * Updates the People list in the UI.
     */
    const updatePeopleList = () => {
        const peopleCount = document.getElementById('people-count');
        if (peopleCount) {
            peopleCount.textContent = State.siblings.length;
        }
    
        const peopleList = document.getElementById('people-list');
        if (!peopleList) return;
        peopleList.innerHTML = '';
    
        State.siblings.forEach(person => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = person;
    
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-tag';
            removeBtn.textContent = '×';
    
            tag.appendChild(removeBtn);
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the parent click
                removePerson(person);
            });
    
            peopleList.appendChild(tag);
        });
    };
    
    /**
     * Updates the Chores list in the UI.
     */
    const updateChoresList = () => {
        const choresCount = document.getElementById('chores-count');
        if (choresCount) {
            choresCount.textContent = State.chores.length;
        }
    
        const choresListElement = document.getElementById('chores-list');
        if (!choresListElement) return;
        choresListElement.innerHTML = '';
    
        State.chores.forEach(chore => {
            const tag = document.createElement('span');
            tag.className = 'tag';
            tag.textContent = chore;
    
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-tag';
            removeBtn.textContent = '×';
    
            tag.appendChild(removeBtn);
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent triggering the parent click
                removeChore(chore);
            });
    
            choresListElement.appendChild(tag);
        });
    };
    
    /**
     * Updates the Export/Import textarea with the current settings.
     */
    const updateExportImportText = () => {
		const exportImportText = `${State.chores.join(', ')}\n${State.siblings.join(', ')}\n${State.cycleNumber},${State.week},${State.seed}\n${formatDateForDisplay(State.startDate)}`;
		const startDateInput = document.getElementById('start-date');
		if (startDateInput) {
			startDateInput.value = State.startDate;
		}
        const exportImportTextarea = document.getElementById('export-import-text');
        if (exportImportTextarea) {
            exportImportTextarea.value = exportImportText;
        }
    };
    
    // ====================
    // Section 7 - Event Listeners and Handlers
    // ====================
    
    /**
     * Sets up all necessary event listeners for user interactions.
     */
    const setupEventListeners = () => {
        // Add Person Button
        const addPersonButton = document.getElementById('add-person-button');
        if (addPersonButton) {
            addPersonButton.addEventListener('click', () => {
                const nameInput = document.getElementById('new-person');
                if (nameInput) {
                    addPerson(nameInput.value);
                    nameInput.value = '';
                }
            });
        }
    
        // Add Chore Button
        const addChoreButton = document.getElementById('add-chore-button');
        if (addChoreButton) {
            addChoreButton.addEventListener('click', () => {
                const choreInput = document.getElementById('new-chore');
                if (choreInput) {
                    addChore(choreInput.value);
                    choreInput.value = '';
                }
            });
        }
    
        // Assign Chores Button
		const assignButton = document.getElementById('assign-button');
		assignButton.addEventListener('click', () => {
			// Calculate next week/cycle
			let nextWeek = State.week + 1;
			let nextCycle = State.cycleNumber;
			
			if (nextWeek > State.chores.length) {
				nextCycle += 1;
				nextWeek = 1;
			}
			
			// Use our existing functions to handle the state update
			jumpToWeekCycle(nextCycle, nextWeek);
		});
		
		// Event Listener for "Show dates on chores" checkbox
		const showDatesCheckbox = document.getElementById('show-dates-checkbox');
		if (showDatesCheckbox) {
			showDatesCheckbox.addEventListener('change', (e) => {
				State.showDates = e.target.checked;
				updateCompletedChores(); // Re-render the completed chores section
				updateHistory();        // Re-render the history section
			});
		}
			
		// Start Date Input Change
		const startDateInput = document.getElementById('start-date');
		if (startDateInput) {
			startDateInput.value = State.startDate;
			startDateInput.addEventListener('change', (e) => {
				State.startDate = e.target.value;
				// Reset to Cycle 1, Week 1
				StateManager.resetState();
				StateManager.updateCycleAndWeek(1, 1);
				assignChores();
				displayMessage("Start date changed. Reset to Cycle 1, Week 1.", "success", true);
			});
		}
		
        // Reset Button
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', resetSystem);
        }
    
        // Seed Input Change
        const seedInput = document.getElementById('seed-input');
        if (seedInput) {
            seedInput.addEventListener('change', (e) => {
                const newSeed = Number(e.target.value);
                if (!isNaN(newSeed)) {
                    State.seed = newSeed;
                    jumpToWeekCycle(State.cycleNumber, State.week);
                } else {
                    displayMessage("Seed must be a valid number.", "error", true);
                }
            });
        }
    
		// Cycle Input Change
		const cycleInput = document.getElementById('set-cycle');
		if (cycleInput) {
			cycleInput.addEventListener('change', (e) => {
				const targetCycle = Number(e.target.value);
				
				// Validate cycle number
				if (isNaN(targetCycle) || targetCycle < 1) {
					displayMessage("Cycle must be a positive number.", "error", true);
					e.target.value = State.cycleNumber; // Reset to current cycle
					return;
				}

				// When changing cycles, always start at week 1 of the new cycle
				const targetWeek = 1;
				
				// Clear all person chores before simulating
				State.siblings.forEach(sibling => {
					State.personChores[sibling].clear();
				});

				// Reset history for a clean simulation
				State.siblings.forEach(sibling => {
					State.history[sibling] = [];
				});

				// Simulate all assignments from cycle 1 up to the target cycle
				State.cycleNumber = 1;
				State.week = 1;
				State.assignments = [];

				// Update the week input value
				const weekInput = document.getElementById('set-week');
				if (weekInput) {
					weekInput.value = targetWeek;
				}

				// Jump to the new cycle and week
				jumpToWeekCycle(targetCycle, targetWeek);
			});
		}
		
		// Week Input Change
		const weekInput = document.getElementById('set-week');
		if (weekInput) {
			weekInput.addEventListener('change', (e) => {
				const targetCycleInput = document.getElementById('set-cycle');
				const targetCycle = targetCycleInput ? Number(targetCycleInput.value) : 1;
				const targetWeek = validateWeekNumber(Number(e.target.value), targetCycle);

				if (isNaN(targetCycle) || isNaN(targetWeek)) {
					displayMessage("Please enter valid numbers for Cycle and Week.", "error", true);
					return;
				}

				// Set the validated week value
				e.target.value = targetWeek;
				
				// Set max attribute to prevent invalid inputs
				e.target.max = State.chores.length;
				
				// Always clear personChores when jumping to a new cycle
				if (targetCycle !== State.cycleNumber) {
					State.siblings.forEach(sibling => {
						State.personChores[sibling].clear();
					});
				}
				
				// Jump to the validated position
				jumpToWeekCycle(targetCycle, targetWeek);
			});

			// Set initial max attribute
			weekInput.max = State.chores.length;
			weekInput.min = 1;
		}
    
        // Copy to Clipboard Button
        const copyButton = document.getElementById('copy-button');
        if (copyButton) {
            copyButton.addEventListener('click', copyToClipboard);
        }
    
        // Apply Button
        const applyButton = document.getElementById('apply-button');
        if (applyButton) {
            applyButton.addEventListener('click', applySettings);
        }
    
        // Today Button
        const todayButton = document.getElementById('today-button');
        if (todayButton) {
            todayButton.addEventListener('click', goToToday);
        }
    
        // Instructions Toggle Button
        const toggleInstructionsButton = document.getElementById('toggle-instructions');
        if (toggleInstructionsButton) {
            toggleInstructionsButton.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent the default anchor behavior
                
                const content = document.querySelector('.instructions-content');
                const button = document.getElementById('toggle-instructions');
                if (!content || !button) return;
    
                const isHidden = content.style.display === 'none' || !content.style.display;
    
                if (isHidden) {
                    content.style.display = 'block';
                    button.innerHTML = 'Instructions ▼';
                } else {
                    content.style.display = 'none';
                    button.innerHTML = 'Instructions ▲';
                }
            });
        }
    };
    
    // ====================
    // Initialize Application
    // ====================
    const init = () => {
        // Create fixed message container if it doesn't exist
        if (!document.querySelector('.fixed-message-container')) {
            const fixedMessageContainer = document.createElement('div');
            fixedMessageContainer.className = 'fixed-message-container';
            document.body.appendChild(fixedMessageContainer);
        }
    
        initializeState();
        setupEventListeners();
        assignChores();  // Immediately assign chores after initialization
        updateUI();
    };
    
    // Start the application
    document.addEventListener('DOMContentLoaded', init);
})();
