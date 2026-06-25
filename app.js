let currentUser = null;
let personalChart = null;
let comparisonChart = null;

// Initialize Lucide Icons
lucide.createIcons();

// Helper to calculate remaining days until deadline
function getDaysRemaining(deadlineStr) {
    if (!deadlineStr) return null;
    const deadline = new Date(deadlineStr);
    const today = new Date();
    // Set deadline to the end of the day, and today to the start of the day
    deadline.setHours(23, 59, 59, 999);
    today.setHours(0, 0, 0, 0);
    const diffTime = deadline - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// DOM Elements
const screens = {
    auth: document.getElementById('auth-section'),
    dashboard: document.getElementById('dashboard-section'),
    admin: document.getElementById('admin-section')
};

const forms = {
    login: document.getElementById('login-form'),
    register: document.getElementById('register-form')
};

// --- Screen Management ---
function showScreen(screenKey) {
    Object.keys(screens).forEach(key => {
        screens[key].classList.remove('active');
    });
    screens[screenKey].classList.add('active');
    
    // Pequeno delay para garantir que o scroll reseta após a renderização
    setTimeout(() => window.scrollTo(0, 0), 10);
}

function toggleAuthForm(formKey) {
    Object.values(forms).forEach(form => form.classList.remove('active'));
    forms[formKey].classList.add('active');
}

// --- UI Updates ---
async function updateDashboardUI() {
    if (!currentUser) return;

    const latestWeight = currentUser.history[currentUser.history.length - 1].weight;
    const remaining = Math.max(0, latestWeight - currentUser.targetWeight).toFixed(1);
    const lostSoFar = currentUser.goalStartWeight - latestWeight;
    const totalToLose = currentUser.goalStartWeight - currentUser.targetWeight;
    const progressPct = totalToLose > 0 
        ? Math.min(100, Math.max(0, (lostSoFar / totalToLose) * 100)).toFixed(0)
        : '0';

    // Header
    document.getElementById('user-display-name').textContent = currentUser.name;
    document.getElementById('user-first-name').textContent = currentUser.name.split(' ')[0];

    // Stats
    document.getElementById('stat-current-weight').textContent = `${latestWeight.toFixed(1)} kg`;
    document.getElementById('stat-target-weight').textContent = `${currentUser.targetWeight.toFixed(1)} kg`;
    document.getElementById('stat-remaining').textContent = `${remaining} kg`;
    document.getElementById('stat-progress-pct').textContent = `${progressPct}%`;

    // Update Target KPI Label
    const isInitial4Pct = Math.abs(currentUser.targetWeight - (currentUser.initialWeight * 0.96)) < 0.01;
    const targetLabel = document.getElementById('kpi-target-label');
    if (targetLabel) {
        if (isInitial4Pct) {
            targetLabel.textContent = 'Meta (-4%)';
        } else {
            const diffKg = (currentUser.goalStartWeight - currentUser.targetWeight).toFixed(1);
            targetLabel.textContent = `Meta (-${diffKg} kg)`;
        }
    }

    // Goal Message and Deadline
    const daysRemaining = getDaysRemaining(currentUser.goalDeadline);
    let deadlineText = '';
    if (daysRemaining !== null) {
        if (daysRemaining > 1) {
            deadlineText = ` • ${daysRemaining} dias restantes`;
        } else if (daysRemaining === 1) {
            deadlineText = ` • Último dia!`;
        } else if (daysRemaining === 0) {
            deadlineText = ` • Hoje é o prazo limite!`;
        } else {
            deadlineText = ` • Prazo encerrado (${Math.abs(daysRemaining)} dias atrás)`;
        }
    }

    const goalMsg = document.getElementById('goal-status-msg');
    if (latestWeight <= currentUser.targetWeight) {
        goalMsg.innerHTML = `<span class="success-text">🎉 PARABÉNS! Você atingiu sua meta!${deadlineText}</span>`;
        goalMsg.style.color = 'var(--success)';
    } else {
        goalMsg.textContent = `Vamos atingir essa meta juntos.${deadlineText}`;
        goalMsg.style.color = 'var(--text-muted)';
    }

    renderPersonalChart();
    await renderComparisonChart();
}

// --- Charts ---
function renderPersonalChart() {
    const ctx = document.getElementById('personalChart').getContext('2d');
    
    const labels = currentUser.history.map(h => {
        const d = new Date(h.date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
    });
    const data = currentUser.history.map(h => h.weight);

    if (personalChart) personalChart.destroy();

    personalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Seu Peso (kg)',
                data: data,
                borderColor: '#8b5cf6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#8b5cf6',
                pointRadius: 5
            }, {
                label: 'Meta',
                data: Array(labels.length).fill(currentUser.targetWeight),
                borderColor: '#f43f5e',
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true, labels: { color: '#94a3b8' } }
            },
            scales: {
                y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

async function renderComparisonChart() {
    const canvas = document.getElementById('comparisonChart');
    if (!canvas) return;
    
    const allUsers = await Store.getAllUsers();
    if (allUsers.length === 0) return;

    // Sort users by % lost
    const sortedUsers = allUsers.map(u => {
        const lastW = u.history[u.history.length - 1].weight;
        const pctLost = ((u.initialWeight - lastW) / u.initialWeight) * 100;
        return { name: u.name.split(' ')[0], pctLost: Math.max(0, pctLost) };
    }).sort((a, b) => b.pctLost - a.pctLost);

    if (comparisonChart) comparisonChart.destroy();

    comparisonChart = new Chart(canvas.getContext('2d'), {
        type: 'bar',
        data: {
            labels: sortedUsers.map(u => u.name),
            datasets: [{
                label: '% de Peso Perdido',
                data: sortedUsers.map(u => u.pctLost),
                backgroundColor: sortedUsers.map((_, i) => i === 0 ? '#10b981' : '#3b82f6'),
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            indexAxis: 'y',
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: { 
                    max: 10,
                    grid: { color: 'rgba(255,255,255,0.05)' }, 
                    ticks: { color: '#94a3b8', callback: v => v + '%' } 
                },
                y: { grid: { display: false }, ticks: { color: '#94a3b8' } }
            }
        }
    });
}

// --- Admin Logic ---
async function renderAdminDashboard() {
    const tableBody = document.getElementById('admin-users-table-body');
    const allUsers = await Store.getAllUsers();
    
    tableBody.innerHTML = '';
    
    allUsers.forEach(user => {
        const lastW = user.history[user.history.length - 1].weight;
        const isGoalMet = lastW <= user.targetWeight;
        const lostSoFar = user.goalStartWeight - lastW;
        const totalToLose = user.goalStartWeight - user.targetWeight;
        const activeProgressPct = totalToLose > 0 
            ? Math.min(100, Math.max(0, (lostSoFar / totalToLose) * 100))
            : 0;

        const daysRemaining = getDaysRemaining(user.goalDeadline);
        let deadlineCell = 'Sem prazo';
        if (daysRemaining !== null) {
            if (daysRemaining > 1) {
                deadlineCell = `${daysRemaining} dias`;
            } else if (daysRemaining === 1) {
                deadlineCell = `Último dia`;
            } else if (daysRemaining === 0) {
                deadlineCell = `Hoje`;
            } else {
                deadlineCell = `Expirado (${Math.abs(daysRemaining)}d)`;
            }
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.initialWeight.toFixed(1)} kg</td>
            <td>${lastW.toFixed(1)} kg</td>
            <td>${user.targetWeight.toFixed(1)} kg</td>
            <td>
                <span class="progress-pill ${isGoalMet ? 'success' : 'pending'}" title="Progresso da meta ativa">
                    ${activeProgressPct.toFixed(0)}%
                </span>
            </td>
            <td>${deadlineCell}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-icon" onclick="handleEditUser('${user.email}')" title="Editar">
                        <i data-lucide="edit-2" style="width: 16px;"></i>
                    </button>
                    <button class="btn-delete" onclick="handleDeleteUser('${user.email}')">Remover</button>
                </div>
            </td>
        `;
        tableBody.appendChild(tr);
    });
    lucide.createIcons();
}

async function handleEditUser(email) {
    const user = await Store.getUserByEmail(email);
    if (!user) return;

    document.getElementById('edit-user-name').textContent = user.name;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-weight').value = user.initialWeight;
    document.getElementById('edit-modal').classList.add('active');
}

async function handleDeleteUser(email) {
    if (confirm(`Tem certeza que deseja remover o usuário ${email}?`)) {
        await Store.deleteUser(email);
        await renderAdminDashboard();
        showToast('Usuário removido com sucesso.');
    }
}

window.handleDeleteUser = handleDeleteUser;
window.handleEditUser = handleEditUser;

// --- Feedback ---
function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.add('active');
    setTimeout(() => toast.classList.remove('active'), 4000);
}

// --- Event Listeners ---

// Auth Navigation
document.getElementById('go-to-register').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthForm('register');
});

document.getElementById('go-to-login').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthForm('login');
});

// Register
document.getElementById('btn-register').addEventListener('click', async () => {
    const name = document.getElementById('reg-name').value;
    const email = document.getElementById('reg-email').value;
    const weight = document.getElementById('reg-weight').value;

    if (!name || !email || !weight) {
        alert('Preencha todos os campos!');
        return;
    }

    try {
        currentUser = await Store.registerUser(name, email, weight);
        showToast('Conta criada com sucesso!');
        await updateDashboardUI();
        showScreen('dashboard');
    } catch (err) {
        alert(err.message);
    }
});

// Register Enter key listener
['reg-name', 'reg-email', 'reg-weight'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            document.getElementById('btn-register').click();
        }
    });
});

// Login
document.getElementById('btn-login').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value;
    if (!email) return;

    if (Store.isAdmin(email)) {
        showScreen('admin');
        await renderAdminDashboard();
        showToast('Acesso master concedido.');
        return;
    }

    const user = await Store.getUserByEmail(email);
    if (user) {
        currentUser = user;
        await updateDashboardUI();
        showScreen('dashboard');
    } else {
        alert('Usuário não encontrado!');
    }
});

// Login Enter key listener
document.getElementById('login-email').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        document.getElementById('btn-login').click();
    }
});

// Logout
const handleLogout = () => {
    currentUser = null;
    showScreen('auth');
    document.querySelectorAll('input').forEach(input => input.value = '');
};

document.getElementById('btn-logout').addEventListener('click', handleLogout);
document.getElementById('btn-logout-admin').addEventListener('click', handleLogout);

// Modal Logic
const modal = document.getElementById('entry-modal');
document.getElementById('open-entry-modal').addEventListener('click', () => {
    modal.classList.add('active');
    document.getElementById('new-weight').value = currentUser.history[currentUser.history.length - 1].weight;
});

document.getElementById('close-modal').addEventListener('click', () => {
    modal.classList.remove('active');
});

document.getElementById('btn-save-weight').addEventListener('click', async () => {
    const weight = document.getElementById('new-weight').value;
    if (!weight) return;

    currentUser = await Store.addWeightEntry(currentUser.email, weight);
    await updateDashboardUI();
    modal.classList.remove('active');
    showToast('Peso registrado com sucesso!');
});

// Admin Edit Modal
const editModal = document.getElementById('edit-modal');
document.getElementById('close-edit-modal').addEventListener('click', () => {
    editModal.classList.remove('active');
});

document.getElementById('btn-update-weight').addEventListener('click', async () => {
    const email = document.getElementById('edit-user-email').value;
    const newWeight = document.getElementById('edit-weight').value;
    
    if (newWeight) {
        await Store.updateInitialWeight(email, newWeight);
        await renderAdminDashboard();
        editModal.classList.remove('active');
        showToast('Dados atualizados e meta recalculada!');
    }
});

// Close modal on overlay click
modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('active');
});

editModal.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.classList.remove('active');
});

// Goal Modal Logic
const goalModal = document.getElementById('goal-modal');
const openGoalModalBtn = document.getElementById('open-goal-modal');
const closeGoalModalBtn = document.getElementById('close-goal-modal');
const saveGoalBtn = document.getElementById('btn-save-goal');
const reset4PctBtn = document.getElementById('btn-reset-4pct');

openGoalModalBtn.addEventListener('click', () => {
    goalModal.classList.add('active');
    document.getElementById('goal-weight-loss').value = '';
    document.getElementById('goal-duration').value = '';
});

closeGoalModalBtn.addEventListener('click', () => {
    goalModal.classList.remove('active');
});

saveGoalBtn.addEventListener('click', async () => {
    const kgToLose = parseFloat(document.getElementById('goal-weight-loss').value);
    const durationDays = parseInt(document.getElementById('goal-duration').value);

    if (isNaN(kgToLose) || kgToLose <= 0) {
        alert('Por favor, insira uma quantidade de peso válida para perder!');
        return;
    }
    if (isNaN(durationDays) || durationDays <= 0) {
        alert('Por favor, insira um prazo em dias válido!');
        return;
    }

    try {
        const latestWeight = currentUser.history[currentUser.history.length - 1].weight;
        const newTargetWeight = latestWeight - kgToLose;
        
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + durationDays);

        currentUser = await Store.updateUserGoal(
            currentUser.email,
            newTargetWeight,
            latestWeight,
            deadline.toISOString()
        );

        await updateDashboardUI();
        goalModal.classList.remove('active');
        showToast('Nova meta configurada com sucesso!');
    } catch (err) {
        alert('Erro ao atualizar meta: ' + err.message);
    }
});

reset4PctBtn.addEventListener('click', async () => {
    if (confirm('Tem certeza que deseja redefinir sua meta para o desafio padrão de 4% de perda de peso? Isso começará o prazo de 30 dias a partir de agora.')) {
        try {
            const latestWeight = currentUser.history[currentUser.history.length - 1].weight;
            const newTargetWeight = latestWeight * 0.96;
            
            const deadline = new Date();
            deadline.setDate(deadline.getDate() + 30);

            currentUser = await Store.updateUserGoal(
                currentUser.email,
                newTargetWeight,
                latestWeight,
                deadline.toISOString()
            );

            await updateDashboardUI();
            goalModal.classList.remove('active');
            showToast('Desafio padrão de 4% redefinido!');
        } catch (err) {
            alert('Erro ao resetar meta: ' + err.message);
        }
    }
});

// Close goal modal on overlay click
goalModal.addEventListener('click', (e) => {
    if (e.target === goalModal) goalModal.classList.remove('active');
});
