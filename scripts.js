(() => {
    // State Management
    const State = {
        chores: ['Raking', 'Shoveling', 'Gardening', 'Exercising', 'Sweeping', 'Vacuuming'],
        siblings: ['Steve', 'Mary', 'Sue'], // Initial siblings
        assignments: [],
        history: {},
        personChores: {},
        week: 1,
        cycleNumber: 1,
        seed: 1,
    };

    // UILabels
    const UILabels = {
        done: "Done"
    };

    // Initialize history and personChores
    const initializeState = () => {
        State.history = {};
        State.personChores = {};
        State.siblings.forEach(sibling => {
            State.history[sibling] = [];
            State.personChores[sibling] = new Set();
        });
    };

    // Seeded Random Function
    const seededRandom = (seed, max) => {
        const x = Math.sin(seed) * 10000;
        return Math.floor((x - Math.floor(x)) * max);
    };

    // Utility Functions
    const addItem = (list, item) => {
        const trimmedItem = item.trim();
        if (trimmedItem && !list.includes(trimmedItem)) {
            list.push(trimmedItem);
            return true;
        }
        return false;
    };

    const removeItem = (list, item) => {
        const index = list.indexOf(item);
        if (index !== -1) {
            list.splice(index, 1);
            return true;
        }
        return false;
    };

    // People Management
    const addPerson = (name) => {
        if (addItem(State.siblings, name)) {
            State.history[name] = [];
            State.personChores[name] = new Set();
            updateUI();
        }
    };

    const removePerson = (name) => {
        if (removeItem(State.siblings, name)) {
            delete State.history[name];
            delete State.personChores[name];
            updateUI();
        }
    };

    // Chore Management
    const addChore = (name) => {
        if (addItem(State.chores, name)) {
            updateUI();
        }
    };

    const removeChore = (name) => {
        if (removeItem(State.chores, name)) {
            // Remove chore from all personChores
            Object.values(State.personChores).forEach(choresSet => choresSet.delete(name));
            updateUI();
        }
    };

    // Check if Cycle is Complete
    const isCycleComplete = () => {
        return State.siblings.every(sibling =>
            State.chores.every(chore => State.personChores[sibling].has(chore))
        );
    };

    // Assign Chores with Enhanced Logic
const assignChores = () => {
    if (State.siblings.length === 0 || State.chores.length === 0) {
        displayMessage("Please add at least one person and one chore in settings.", "error");
        return;
    }

    // First increment the week unless we're just starting
    if (State.assignments.length > 0) {
        State.week += 1;
    }

    // Then check if cycle is complete
    if (isCycleComplete()) {
        State.cycleNumber += 1;
        State.week = 1;
        State.siblings.forEach(sibling => {
            State.personChores[sibling].clear();
        });
    }

    // Get last week's chores to avoid repetition
    const lastWeekChores = new Set(State.assignments.map(a => a.chore));

    // Prepare for new assignments
    const newAssignments = [];
    const usedChoresThisWeek = new Set();
    const weekSeed = State.seed + State.week + (State.cycleNumber * 1000);

        // Shuffle siblings based on seed
        const shuffledSiblings = shuffleArray([...State.siblings], weekSeed);

        // First Pass: Assign unique chores avoiding last week's chores
        const unassignedSiblings = [];
        const maxAttempts = 10; // Prevent infinite loops

        shuffledSiblings.forEach(person => {
            let assigned = false;
            for (let attempt = 0; attempt < maxAttempts && !assigned; attempt++) {
                const availableChores = State.chores.filter(chore =>
                    !State.personChores[person].has(chore) &&
                    !usedChoresThisWeek.has(chore) &&
                    !lastWeekChores.has(chore)
                );

                const choresToConsider = availableChores.length > 0
                    ? availableChores
                    : State.chores.filter(chore =>
                        !State.personChores[person].has(chore) &&
                        !usedChoresThisWeek.has(chore)
                    );

                if (choresToConsider.length > 0) {
                    const selectedChore = choresToConsider[seededRandom(weekSeed + shuffledSiblings.indexOf(person) + attempt, choresToConsider.length)];
                    newAssignments.push({ sibling: person, chore: selectedChore, shared: false });
                    usedChoresThisWeek.add(selectedChore);
                    State.personChores[person].add(selectedChore);
                    State.history[person].push(selectedChore);
                    assigned = true;
                }
            }

            if (!assigned) {
                unassignedSiblings.push(person);
            }
        });

        // Second Pass: Assign shared chores to unassigned siblings
        unassignedSiblings.forEach(person => {
            let assigned = false;
            for (let attempt = 0; attempt < maxAttempts && !assigned; attempt++) {
                const availableChores = State.chores.filter(chore =>
                    !State.personChores[person].has(chore) &&
                    !lastWeekChores.has(chore)
                );

                const choresToConsider = availableChores.length > 0
                    ? availableChores
                    : State.chores.filter(chore =>
                        !State.personChores[person].has(chore)
                    );

                if (choresToConsider.length > 0) {
                    const selectedChore = choresToConsider[seededRandom(weekSeed + shuffledSiblings.indexOf(person) + attempt, choresToConsider.length)];
                    newAssignments.push({ sibling: person, chore: selectedChore, shared: true });
                    State.personChores[person].add(selectedChore);
                    State.history[person].push(`${selectedChore} (Shared Assignment)`);
                    assigned = true;
                }
            }

            if (!assigned) {
                displayMessage(`Unable to find suitable chore assignment for ${person}. Please check your chore distribution.`, "error");
            }
        });

    // Update state and UI
    State.assignments = newAssignments;
    updateUI();
};
    // Shuffle Array Based on Seed
    const shuffleArray = (array, seed) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = seededRandom(seed + i, i + 1);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    // Calculate Cycle and Week from a given date
    const calculateCycleAndWeekFromDate = (targetDate) => {
        const startDate = new Date(2024, 0, 1); // Jan 1, 2024
        const daysDiff = Math.floor((targetDate - startDate) / (1000 * 60 * 60 * 24));
        const totalWeeks = Math.floor(daysDiff / 7) + 1;

        if (State.siblings.length === 0 || State.chores.length === 0) {
            displayMessage("Please add at least one person and one chore in settings.", "error");
            return null;
        }

        const weeksPerCycle = State.chores.length;
        const currentCycle = Math.floor((totalWeeks - 1) / weeksPerCycle) + 1;
        const currentWeek = ((totalWeeks - 1) % weeksPerCycle) + 1;

        return {
            cycle: currentCycle,
            week: currentWeek,
            debug: {
                daysSinceStart: daysDiff,
                totalWeeks: totalWeeks,
                weeksPerCycle: weeksPerCycle,
            },
        };
    };

    // Go To Today Function
    const goToToday = () => {
        const today = new Date();
        const result = calculateCycleAndWeekFromDate(today);

        if (result) {
            console.log('Date calculation debug:', {
                date: today,
                ...result.debug,
                resultingCycle: result.cycle,
                resultingWeek: result.week,
            });

            // Update the input fields
            document.getElementById('set-cycle').value = result.cycle;
            document.getElementById('set-week').value = result.week;

            // Jump to the calculated week and cycle
            jumpToWeekCycle(result.cycle, result.week);
        }
    };

    // Update UI
    const updateUI = () => {
        updateWeekAndCycleInputs();
        updateSeedInput();
        updateHistory();
        updateCompletedChores();
        updatePeopleList();
        updateChoresList();
        updateExportImportText();
    };

    // Update Week and Cycle Inputs
    const updateWeekAndCycleInputs = () => {
        document.getElementById('set-cycle').value = State.cycleNumber;
        document.getElementById('set-week').value = State.week;
    };

    // Update Seed Input
    const updateSeedInput = () => {
        document.getElementById('seed-input').value = State.seed;
    };

    // Update History Section
    const updateHistory = () => {
        const historyList = document.getElementById('history-list');
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
                    const isPreviousAssignment = index === recentHistory.length - 2;

                    if (isCurrentAssignment) {
                        return `<span class="current-assignment">${chore}</span>`;
                    } else if (isPreviousAssignment) {
                        return `<span class="previous-assignment">${chore}</span>`;
                    }
                    return chore;
                }).join(' → ');
            }

            div.innerHTML = historyText;
            historyList.appendChild(div);
        });
    };

    // Update Completed Chores Section
    const updateCompletedChores = () => {
        const completedChoresList = document.getElementById('completed-chores-list');
        completedChoresList.innerHTML = '';

        const table = document.createElement('table');
        table.className = 'completed-chores-table';

        // Create header row without "Name" column
        const headerRow = document.createElement('tr');
        // Removed the "Name" header
        State.chores.forEach(chore => {
            const th = document.createElement('th');
            th.textContent = chore;
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);

        // Create rows for each sibling without the "Name" cell
        State.siblings.forEach(sibling => {
            const row = document.createElement('tr');

            State.chores.forEach(chore => {
                const td = document.createElement('td');
                if (State.personChores[sibling].has(chore)) {
                    const isCurrentWeekChore = State.assignments.some(a =>
                        a.sibling === sibling && a.chore === chore
                    );
                    if (isCurrentWeekChore) {
                        td.textContent = sibling; // Display the person's name instead of "Assigned"
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

    // Update People List
    const updatePeopleList = () => {
        const peopleCount = document.getElementById('people-count');
        peopleCount.textContent = State.siblings.length;

        const peopleList = document.getElementById('people-list');
        peopleList.innerHTML = '';

        State.siblings.forEach(person => {
            const li = document.createElement('li');
            li.textContent = person;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.className = 'remove-btn';
            removeBtn.onclick = () => removePerson(person);

            li.appendChild(removeBtn);
            peopleList.appendChild(li);
        });
    };

    // Update Chores List
    const updateChoresList = () => {
        const choresCount = document.getElementById('chores-count');
        choresCount.textContent = State.chores.length;

        const choresListElement = document.getElementById('chores-list');
        choresListElement.innerHTML = '';

        State.chores.forEach(chore => {
            const li = document.createElement('li');
            li.textContent = chore;

            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'X';
            removeBtn.className = 'remove-btn';
            removeBtn.onclick = () => removeChore(chore);

            li.appendChild(removeBtn);
            choresListElement.appendChild(li);
        });
    };

    // Reset System
    const resetSystem = () => {
        if (confirm("Are you sure you want to reset the system?")) {
            State.week = 1;
            State.cycleNumber = 1;
            State.seed = 1;
            initializeState();
            State.assignments = [];
            updateUI();
            assignChores();  // Add this line to immediately assign chores after reset
        }
    };

    // Jump to Specific Week and Cycle
const jumpToWeekCycle = (targetCycle, targetWeek) => {
    if (targetCycle < 1 || targetWeek < 1) {
        displayMessage("Cycle and Week numbers must be positive integers.", "error");
        return;
    }

    // Reset state
    State.week = 1;
    State.cycleNumber = 1;
    initializeState();
    State.assignments = [];

    // If we're going to Week 1, we need to do one assignment without incrementing
    if (targetCycle === 1 && targetWeek === 1) {
        assignChores();
        return;
    }

    // For other weeks, process normally
    while (State.cycleNumber < targetCycle || (State.cycleNumber === targetCycle && State.week < targetWeek)) {
        assignChores();
        // Prevent infinite loops
        if (State.cycleNumber > targetCycle + 100 || State.week > targetWeek + 100) {
            displayMessage("Error in assigning chores. Please check your inputs.", "error");
            return;
        }
    }

    updateUI();
};

    // Event Listeners
    const setupEventListeners = () => {
        // Add Person
        document.getElementById('add-person-button').addEventListener('click', () => {
            const nameInput = document.getElementById('new-person');
            addPerson(nameInput.value);
            nameInput.value = '';
        });

        // Add Chore
        document.getElementById('add-chore-button').addEventListener('click', () => {
            const choreInput = document.getElementById('new-chore');
            addChore(choreInput.value);
            choreInput.value = '';
        });

        // Assign Chores
        document.getElementById('assign-button').addEventListener('click', assignChores);

        // Reset System
        document.getElementById('reset-button').addEventListener('click', resetSystem);

        // Seed Change
        document.getElementById('seed-input').addEventListener('change', (e) => {
            const newSeed = Number(e.target.value);
            if (!isNaN(newSeed)) {
                State.seed = newSeed;
                jumpToWeekCycle(State.cycleNumber, State.week);
            } else {
                displayMessage("Seed must be a valid number.", "error");
            }
        });

document.getElementById('set-cycle').addEventListener('change', (e) => {
    const targetCycle = Number(e.target.value);
    const targetWeek = Number(document.getElementById('set-week').value);
    if (isNaN(targetCycle) || isNaN(targetWeek)) {
        displayMessage("Please enter valid numbers for Cycle and Week.", "error");
        return;
    }
    jumpToWeekCycle(targetCycle, targetWeek);
});

document.getElementById('set-week').addEventListener('change', (e) => {
    const targetWeek = Number(e.target.value);
    const targetCycle = Number(document.getElementById('set-cycle').value);
    if (isNaN(targetCycle) || isNaN(targetWeek)) {
        displayMessage("Please enter valid numbers for Cycle and Week.", "error");
        return;
    }
    jumpToWeekCycle(targetCycle, targetWeek);
});

        // Export/Import Functionality
        document.getElementById('copy-button').addEventListener('click', copyToClipboard);
        document.getElementById('apply-button').addEventListener('click', applySettings);

        // Today Button
        document.getElementById('today-button').addEventListener('click', goToToday);

        // Instructions Toggle
        document.querySelector('.instructions-section > a').addEventListener('click', (e) => {
            e.preventDefault();
            const content = document.querySelector('.instructions-content');
            content.classList.toggle('show');
            e.target.textContent = content.classList.contains('show') ? 'Instructions ▼' : 'Instructions ▲';
        });
    };

    // Export/Import Functionality

    // Serialize core components into the new three-line format
    const updateExportImportText = () => {
        const exportImportText = `${State.chores.join(', ')}\n${State.siblings.join(', ')}\n${State.cycleNumber},${State.week},${State.seed}`;
        document.getElementById('export-import-text').value = exportImportText;
    };

    // Copy to Clipboard
    const copyToClipboard = () => {
        const textArea = document.getElementById('export-import-text');
        textArea.select();
        textArea.setSelectionRange(0, 99999); // For mobile devices

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                displayMessage('Settings copied to clipboard!', "success");
            } else {
                displayMessage('Failed to copy settings.', "error");
            }
        } catch (err) {
            displayMessage('Error copying to clipboard.', "error");
        }
    };

    // Apply Settings from Text Area
    const applySettings = () => {
        const text = document.getElementById('export-import-text').value.trim();
        if (!text) {
            displayMessage("Please enter settings to apply.", "error");
            return;
        }

        const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
        if (lines.length !== 3) {
            displayMessage("Invalid format. Please ensure there are exactly three lines:\n1. Chores\n2. Names\n3. Cycle, Week, Seed", "error");
            return;
        }

        const [choresLine, namesLine, cycleWeekSeedLine] = lines;

        // Parse chores
        const parsedChores = choresLine.split(',').map(chore => chore.trim()).filter(chore => chore.length > 0);
        if (parsedChores.length === 0) {
            displayMessage("Invalid chores list. Please enter at least one chore.", "error");
            return;
        }

        // Parse names
        const parsedNames = namesLine.split(',').map(name => name.trim()).filter(name => name.length > 0);
        if (parsedNames.length === 0) {
            displayMessage("Invalid names list. Please enter at least one name.", "error");
            return;
        }

        // Parse cycle, week, seed
        const cycleWeekSeedParts = cycleWeekSeedLine.split(',').map(part => part.trim());
        if (cycleWeekSeedParts.length !== 3) {
            displayMessage("Invalid Cycle, Week, Seed line. Please enter three comma-separated numbers.", "error");
            return;
        }

        const [parsedCycle, parsedWeek, parsedSeed] = cycleWeekSeedParts.map(part => Number(part));
        if (
            isNaN(parsedCycle) || parsedCycle < 1 ||
            isNaN(parsedWeek) || parsedWeek < 1 ||
            isNaN(parsedSeed)
        ) {
            displayMessage("Cycle and Week must be positive integers, and Seed must be a number.", "error");
            return;
        }

        // Apply settings
        State.chores = parsedChores;
        State.siblings = parsedNames;
        State.seed = parsedSeed;

        // Reinitialize history and personChores
        initializeState();

        // Reset cycle and week
        State.cycleNumber = 1;
        State.week = 1;

        // Assign chores up to the targetCycle and targetWeek
        while (State.cycleNumber < parsedCycle || (State.cycleNumber === parsedCycle && State.week < parsedWeek)) {
            assignChores();
            // Prevent infinite loops
            if (State.cycleNumber > parsedCycle + 100 || State.week > parsedWeek + 100) {
                displayMessage("Error in assigning chores. Please check your inputs.", "error");
                return;
            }
        }

        updateUI();
        displayMessage('Settings applied successfully!', "success");
    };

    // Display Messages to User
    const displayMessage = (message, type) => {
        // Create a message div
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        // Insert the message at the top of the container
        const container = document.querySelector('.container');
        container.insertBefore(messageDiv, container.firstChild);

        // Remove the message after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    };

    // Initialize Application
const init = () => {
    initializeState();
    setupEventListeners();
    assignChores();  // Add this line
    updateUI();
};

    // Start the application
    document.addEventListener('DOMContentLoaded', init);
})();
