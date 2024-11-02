// State Management
let chores = ['Raking', 'Shoveling', 'Gardening', 'Exercising', 'Sweeping', 'Vacuuming'];
let siblings = ['Steve', 'Mary', 'Sue']; // Adjust initial siblings as needed
let assignments = [];
let history = {};
let personChores = {};
let week = 1;
let cycleNumber = 1;
let seed = 1;

// Initialize history and personChores
function initializeState() {
    history = {};
    personChores = {};
    siblings.forEach(sibling => {
        history[sibling] = [];
        personChores[sibling] = new Set();
    });
}

// Seeded Random Function
function seededRandom(seed, max) {
    const x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * max);
}

// Add Person
function addPerson(name) {
    name = name.trim();
    if (name && !siblings.includes(name)) {
        siblings.push(name);
        history[name] = [];
        personChores[name] = new Set();
        updateUI();
    }
}

// Remove Person
function removePerson(name) {
    siblings = siblings.filter(person => person !== name);
    delete history[name];
    delete personChores[name];
    updateUI();
}

// Add Chore
function addChore(name) {
    name = name.trim();
    if (name && !chores.includes(name)) {
        chores.push(name);
        updateUI();
    }
}

// Remove Chore
function removeChore(name) {
    chores = chores.filter(chore => chore !== name);
    // Also remove from personChores
    siblings.forEach(sibling => {
        personChores[sibling].delete(name);
    });
    updateUI();
}

// Check if Cycle is Complete
function isCycleComplete() {
    return siblings.every(sibling => 
        chores.every(chore => personChores[sibling].has(chore))
    );
}

// Assign Chores with Shared Assignments
function assignChores() {
    if (siblings.length === 0 || chores.length === 0) {
        alert("Please add at least one person and one chore in settings.");
        return;
    }

    // Check if cycle is complete
    if (isCycleComplete()) {
        // Reset for new cycle
        siblings.forEach(sibling => {
            personChores[sibling].clear();
        });
        cycleNumber += 1;
        week = 1;
    }

    // Make new assignments
    const newAssignments = [];
    const usedChoresThisWeek = new Set();
    const weekSeed = seed + week + (cycleNumber * 1000);

    // Shuffle siblings based on seed
    let shuffledSiblings = [...siblings];
    for (let i = shuffledSiblings.length - 1; i > 0; i--) {
        const j = seededRandom(weekSeed + i, i + 1);
        [shuffledSiblings[i], shuffledSiblings[j]] = [shuffledSiblings[j], shuffledSiblings[i]];
    }

    // First Pass: Assign unique chores
    const unassignedSiblings = [];

    for (const person of shuffledSiblings) {
        // Available chores: not done in cycle and not used this week
        let availableChores = chores.filter(chore => 
            !personChores[person].has(chore) &&
            !usedChoresThisWeek.has(chore)
        );

        if (availableChores.length > 0) {
            // Select a random available chore
            const choreIndex = seededRandom(weekSeed + shuffledSiblings.indexOf(person), availableChores.length);
            const selectedChore = availableChores[choreIndex];

            newAssignments.push({ sibling: person, chore: selectedChore, shared: false });

            // Mark chore as used this week
            usedChoresThisWeek.add(selectedChore);

            // Update person's completed chores for this cycle
            personChores[person].add(selectedChore);

            // Update history
            history[person].push(selectedChore);
        } else {
            // No unique chore available, mark as needing shared assignment
            unassignedSiblings.push(person);
        }
    }

    // Second Pass: Assign shared chores to unassigned siblings
    for (const person of unassignedSiblings) {
        // Available chores: not done in cycle
        let availableChores = chores.filter(chore => 
            !personChores[person].has(chore)
        );

        if (availableChores.length === 0) {
            alert(`No available chores for ${person}. Please add more chores or reset.`);
            return;
        }

        // Select a random chore to share
        const choreIndex = seededRandom(weekSeed + shuffledSiblings.indexOf(person), availableChores.length);
        const selectedChore = availableChores[choreIndex];

        newAssignments.push({ sibling: person, chore: selectedChore, shared: true });

        // Update person's completed chores for this cycle
        personChores[person].add(selectedChore);

        // Update history with shared assignment notation
        history[person].push(`${selectedChore} (Shared Assignment)`);
    }

    // Update state
    assignments = newAssignments;
    week += 1;

    updateUI();
}

// Update UI
function updateUI() {
    // Update Week and Cycle
    document.getElementById('week-number').innerText = week;
    document.getElementById('cycle-number').innerText = cycleNumber;

    // Update Seed
    document.getElementById('seed-input').value = seed;

    // Update Assignments
    const assignmentsList = document.getElementById('assignments-list');
    assignmentsList.innerHTML = '';
    if (assignments.length === 0) {
        assignmentsList.innerHTML = '<p>Click "Assign New Chores" to generate assignments for the week.</p>';
    } else {
        assignments.forEach(assign => {
            const div = document.createElement('div');
            div.className = 'assignment';
            
            if (assign.shared) {
                div.innerHTML = `<strong>${assign.sibling}</strong>: ${assign.chore} <em>(Shared)</em>`;
            } else {
                div.innerHTML = `<strong>${assign.sibling}</strong>: ${assign.chore}`;
            }

            assignmentsList.appendChild(div);
        });
    }

    // Update History
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    siblings.forEach(sibling => {
        const div = document.createElement('div');
        div.className = 'history-item';
        const recentHistory = history[sibling].slice(-10);
        let historyText = `<strong>${sibling}:</strong> `;
        
        if (recentHistory.length === 0) {
            historyText += 'No history yet.';
        } else {
            historyText += recentHistory.map((chore, index) => {
                const isCurrentAssignment = index === recentHistory.length - 1 && 
                    assignments.some(a => a.sibling === sibling && a.chore === chore.replace(' (Shared Assignment)', ''));
                if (isCurrentAssignment) {
                    return `<span class="current-assignment">${chore}</span>`;
                }
                return chore;
            }).join(' → ');
        }
        div.innerHTML = historyText;
        historyList.appendChild(div);
    });

    // Update Completed Chores
    const completedChoresList = document.getElementById('completed-chores-list');
    completedChoresList.innerHTML = '';
    
    // Create table
    const table = document.createElement('table');
    table.className = 'completed-chores-table';
    
    // Create header row
    const headerRow = document.createElement('tr');
    const nameHeader = document.createElement('th');
    nameHeader.textContent = 'Name';
    headerRow.appendChild(nameHeader);
    
    chores.forEach(chore => {
        const th = document.createElement('th');
        th.textContent = chore;
        headerRow.appendChild(th);
    });
    table.appendChild(headerRow);
    
    // Create rows for each sibling
    siblings.forEach(sibling => {
        const row = document.createElement('tr');
        const nameCell = document.createElement('td');
        nameCell.textContent = sibling;
        row.appendChild(nameCell);
        
        chores.forEach(chore => {
            const td = document.createElement('td');
            if (personChores[sibling].has(chore)) {
                const isCurrentWeekChore = assignments.some(a => 
                    a.sibling === sibling && a.chore === chore
                );
                td.style.textDecoration = 'line-through';
                td.style.color = isCurrentWeekChore ? 'blue' : 'green';
                td.textContent = '✓';
            }
            row.appendChild(td);
        });
        table.appendChild(row);
    });
    
    completedChoresList.appendChild(table);

    // Update People Count and List
    document.getElementById('people-count').innerText = siblings.length;
    const peopleList = document.getElementById('people-list');
    peopleList.innerHTML = '';
    siblings.forEach(person => {
        const li = document.createElement('li');
        li.textContent = person;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';
        removeBtn.onclick = () => removePerson(person);
        li.appendChild(removeBtn);
        peopleList.appendChild(li);
    });

    // Update Chores Count and List
    document.getElementById('chores-count').innerText = chores.length;
    const choresListElement = document.getElementById('chores-list');
    choresListElement.innerHTML = '';
    chores.forEach(chore => {
        const li = document.createElement('li');
        li.textContent = chore;
        const removeBtn = document.createElement('button');
        removeBtn.textContent = 'X';
        removeBtn.onclick = () => removeChore(chore);
        li.appendChild(removeBtn);
        choresListElement.appendChild(li);
    });

    // Update Export/Import Text Area
    updateExportImportText();
}

// Reset System
function resetSystem() {
    if (confirm("Are you sure you want to reset the system?")) {
        week = 1;
        cycleNumber = 1;
        initializeState();
        assignments = [];
        updateUI();
    }
}

// Jump to Specific Week and Cycle
function jumpToWeekCycle(targetCycle, targetWeek) {
    if (targetCycle < 1 || targetWeek < 1) {
        alert("Cycle and Week numbers must be positive integers.");
        return;
    }

    // Reset state
    week = 1;
    cycleNumber = 1;
    initializeState();
    assignments = [];

    // Assign chores up to the targetCycle and targetWeek
    while (cycleNumber < targetCycle || (cycleNumber === targetCycle && week < targetWeek)) {
        assignChores();
        if (cycleNumber > targetCycle + 100 || week > targetWeek + 100) {
            alert("Error in assigning chores. Please check your inputs.");
            return;
        }
    }

    updateUI();
}

// Event Listeners
document.getElementById('add-person-button').addEventListener('click', () => {
    const name = document.getElementById('new-person').value;
    addPerson(name);
    document.getElementById('new-person').value = '';
});

document.getElementById('add-chore-button').addEventListener('click', () => {
    const name = document.getElementById('new-chore').value;
    addChore(name);
    document.getElementById('new-chore').value = '';
});

document.getElementById('assign-button').addEventListener('click', assignChores);
document.getElementById('reset-button').addEventListener('click', resetSystem);

// Handle Seed Change
document.getElementById('seed-input').addEventListener('change', (e) => {
    seed = Number(e.target.value);
    resetSystem();
});

// Handle Jump to Specific Week and Cycle
document.getElementById('go-button').addEventListener('click', () => {
    const targetCycle = Number(document.getElementById('set-cycle').value);
    const targetWeek = Number(document.getElementById('set-week').value);
    if (isNaN(targetCycle) || isNaN(targetWeek)) {
        alert("Please enter valid numbers for Cycle and Week.");
        return;
    }
    jumpToWeekCycle(targetCycle, targetWeek);
});

// Export/Import Functionality

// Serialize core components into the new three-line format
function updateExportImportText() {
    const exportImportText = `${chores.join(', ')}\n${siblings.join(', ')}\n${cycleNumber},${week},${seed}`;
    document.getElementById('export-import-text').value = exportImportText;
}

// Copy to Clipboard
function copyToClipboard() {
    const textArea = document.getElementById('export-import-text');
    textArea.select();
    textArea.setSelectionRange(0, 99999); // For mobile devices

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            alert('Settings copied to clipboard!');
        } else {
            alert('Failed to copy settings.');
        }
    } catch (err) {
        alert('Error copying to clipboard.');
    }
}

// Apply Settings from Text Area
function applySettings() {
    const text = document.getElementById('export-import-text').value.trim();
    if (!text) {
        alert("Please enter settings to apply.");
        return;
    }

    const lines = text.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    if (lines.length !== 3) {
        alert("Invalid format. Please ensure there are exactly three lines:\n1. Chores\n2. Names\n3. Cycle, Week, Seed");
        return;
    }

    const [choresLine, namesLine, cycleWeekSeedLine] = lines;

    // Parse chores
    const parsedChores = choresLine.split(',').map(chore => chore.trim()).filter(chore => chore.length > 0);
    if (parsedChores.length === 0) {
        alert("Invalid chores list. Please enter at least one chore.");
        return;
    }

    // Parse names
    const parsedNames = namesLine.split(',').map(name => name.trim()).filter(name => name.length > 0);
    if (parsedNames.length === 0) {
        alert("Invalid names list. Please enter at least one name.");
        return;
    }

    // Parse cycle, week, seed
    const cycleWeekSeedParts = cycleWeekSeedLine.split(',').map(part => part.trim());
    if (cycleWeekSeedParts.length !== 3) {
        alert("Invalid Cycle, Week, Seed line. Please enter three comma-separated numbers.");
        return;
    }

    const [parsedCycle, parsedWeek, parsedSeed] = cycleWeekSeedParts.map(part => Number(part));
    if (
        isNaN(parsedCycle) || parsedCycle < 1 ||
        isNaN(parsedWeek) || parsedWeek < 1 ||
        isNaN(parsedSeed)
    ) {
        alert("Cycle and Week must be positive integers, and Seed must be a number.");
        return;
    }

    // Apply settings
    chores = parsedChores;
    siblings = parsedNames;
    seed = parsedSeed;

    // Reinitialize history and personChores
    initializeState();

    // Reset cycle and week
    cycleNumber = 1;
    week = 1;

    // Assign chores up to the targetCycle and targetWeek
    while (cycleNumber < parsedCycle || (cycleNumber === parsedCycle && week < parsedWeek)) {
        assignChores();
        if (cycleNumber > parsedCycle + 100 || week > parsedWeek + 100) {
            alert("Error in assigning chores. Please check your inputs.");
            return;
        }
    }

    updateUI();
    alert('Settings applied successfully!');
}

// Event Listeners for Export/Import
document.getElementById('copy-button').addEventListener('click', copyToClipboard);
document.getElementById('apply-button').addEventListener('click', applySettings);

// Initialize history and personChores
initializeState();
updateUI();