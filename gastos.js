// gastos.js - Cole na mesma pasta do gastos.html

const SUPABASE_URL = 'https://qqxttxwxrakhbpzyubsc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFxeHR0eHd4cmFraGJwenl1YnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ2OTg1MzMsImV4cCI6MjA4MDI3NDUzM30.naV_3GuPkuq1FandcZPYhSNzXLLlV9dCEc0Lf2AXiYo';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let allExpenses = [];
let filteredExpenses = [];
let currentPage = 1;
const itemsPerPage = 10;

// ===== AUTENTICAÇÃO =====
function checkAuth() {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
        window.location.href = 'index.html';
        return null;
    }
    currentUser = JSON.parse(userStr);
    return currentUser;
}

function logout() {
    if (confirm('Deseja realmente sair?')) {
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }
}

// ===== SIDEBAR =====
function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('-translate-x-full');
}

// ===== MODO ESCURO =====
function toggleDarkMode() {
    const html = document.documentElement;
    const moonIcon = document.getElementById('moonIconSidebar');
    const sunIcon = document.getElementById('sunIconSidebar');
    const text = document.getElementById('darkModeText');
    
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    
    if (isDark) {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
        text.textContent = 'Modo Claro';
    } else {
        moonIcon.classList.remove('hidden');
        sunIcon.classList.add('hidden');
        text.textContent = 'Modo Escuro';
    }
    
    localStorage.setItem('darkMode', isDark.toString());
}

function initDarkMode() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.documentElement.classList.add('dark');
        document.getElementById('moonIconSidebar').classList.add('hidden');
        document.getElementById('sunIconSidebar').classList.remove('hidden');
        document.getElementById('darkModeText').textContent = 'Modo Claro';
    }
}

// ===== BANCO DE DADOS =====
async function loadExpenses() {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('date', { ascending: false });

        if (error) throw error;

        allExpenses = data.map(expense => ({
            id: expense.id,
            description: expense.description,
            amount: parseFloat(expense.amount),
            category: expense.category,
            date: expense.date
        }));

        filteredExpenses = [...allExpenses];
        updateStatistics();
        applyFilters();
        return allExpenses;
    } catch (error) {
        console.error('Erro ao carregar gastos:', error);
        return [];
    }
}

async function saveExpense(expense) {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .insert([{
                user_id: currentUser.id,
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date
            }])
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao salvar gasto:', error);
        return { success: false, error };
    }
}

async function updateExpense(id, expense) {
    try {
        const { data, error } = await supabase
            .from('expenses')
            .update({
                description: expense.description,
                amount: expense.amount,
                category: expense.category,
                date: expense.date
            })
            .eq('id', id)
            .eq('user_id', currentUser.id)
            .select()
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Erro ao atualizar gasto:', error);
        return { success: false, error };
    }
}

async function deleteExpense(id) {
    try {
        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar gasto:', error);
        return { success: false, error };
    }
}

// ===== ESTATÍSTICAS =====
function updateStatistics() {
    const total = allExpenses.length;
    const valorTotal = allExpenses.reduce((sum, e) => sum + e.amount, 0);
    const media = total > 0 ? valorTotal / total : 0;
    const maior = total > 0 ? Math.max(...allExpenses.map(e => e.amount)) : 0;

    document.getElementById('totalGastos').textContent = total;
    document.getElementById('valorTotal').textContent = `R$ ${valorTotal.toFixed(2).replace('.', ',')}`;
    document.getElementById('mediaGasto').textContent = `R$ ${media.toFixed(2).replace('.', ',')}`;
    document.getElementById('maiorGasto').textContent = `R$ ${maior.toFixed(2).replace('.', ',')}`;
}

// ===== ADICIONAR GASTO =====
document.getElementById('expenseForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const description = document.getElementById('description').value.trim();
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    if (!description || isNaN(amount) || amount <= 0 || !category || !date) {
        alert('Por favor, preencha todos os campos corretamente!');
        return;
    }

    const btn = this.querySelector('button[type="submit"]');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Salvando...';
    btn.disabled = true;

    const expense = { description, amount, category, date };
    const result = await saveExpense(expense);

    if (result.success) {
        allExpenses.unshift({
            id: result.data.id,
            ...expense
        });
        
        filteredExpenses = [...allExpenses];
        updateStatistics();
        applyFilters();
        this.reset();
        
        const today = new Date();
        document.getElementById('date').value = today.toISOString().split('T')[0];
        
        btn.innerHTML = '✓ Adicionado!';
        btn.classList.remove('from-indigo-600', 'to-purple-600');
        btn.classList.add('from-green-600', 'to-green-700');
        
        setTimeout(() => {
            btn.innerHTML = originalText;
            btn.classList.remove('from-green-600', 'to-green-700');
            btn.classList.add('from-indigo-600', 'to-purple-600');
            btn.disabled = false;
        }, 2000);
    } else {
        alert('Erro ao salvar gasto. Tente novamente.');
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// ===== FILTROS =====
function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const categoryFilter = document.getElementById('filterCategory').value;
    const periodFilter = document.getElementById('filterPeriod').value;
    const sortBy = document.getElementById('sortBy').value;

    // Aplicar filtros
    filteredExpenses = allExpenses.filter(expense => {
        // Busca por descrição
        const matchesSearch = expense.description.toLowerCase().includes(searchTerm);
        
        // Filtro de categoria
        const matchesCategory = !categoryFilter || expense.category === categoryFilter;
        
        // Filtro de período
        let matchesPeriod = true;
        if (periodFilter !== 'all') {
            const expenseDate = new Date(expense.date + 'T00:00:00');
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (periodFilter === 'today') {
                matchesPeriod = expenseDate.toDateString() === today.toDateString();
            } else if (periodFilter === 'week') {
                const weekAgo = new Date(today);
                weekAgo.setDate(today.getDate() - 7);
                matchesPeriod = expenseDate >= weekAgo && expenseDate <= today;
            } else if (periodFilter === 'month') {
                matchesPeriod = expenseDate.getMonth() === today.getMonth() && 
                               expenseDate.getFullYear() === today.getFullYear();
            } else if (periodFilter === 'year') {
                matchesPeriod = expenseDate.getFullYear() === today.getFullYear();
            }
        }

        return matchesSearch && matchesCategory && matchesPeriod;
    });

    // Ordenar
    filteredExpenses.sort((a, b) => {
        switch(sortBy) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'amount-desc':
                return b.amount - a.amount;
            case 'amount-asc':
                return a.amount - b.amount;
            case 'category':
                return a.category.localeCompare(b.category);
            default:
                return 0;
        }
    });

    currentPage = 1;
    renderExpenses();
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterCategory').value = '';
    document.getElementById('filterPeriod').value = 'all';
    document.getElementById('sortBy').value = 'date-desc';
    applyFilters();
}

// Event listeners para filtros
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterCategory').addEventListener('change', applyFilters);
document.getElementById('filterPeriod').addEventListener('change', applyFilters);
document.getElementById('sortBy').addEventListener('change', applyFilters);

// ===== RENDERIZAR LISTA =====
function renderExpenses() {
    const container = document.getElementById('expensesList');
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    const paginatedExpenses = filteredExpenses.slice(start, end);

    if (filteredExpenses.length === 0) {
        container.innerHTML = `
            <div class="text-center py-12">
                <p class="text-gray-600 dark:text-gray-300 text-xl font-semibold mb-2">Nenhum gasto encontrado</p>
                <p class="text-gray-500 dark:text-gray-400">Tente ajustar os filtros ou adicionar um novo gasto</p>
            </div>
        `;
        document.getElementById('pagination').innerHTML = '';
        return;
    }

    container.innerHTML = paginatedExpenses.map(expense => {
        const categoryColors = {
            'Alimentação': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
            'Transporte': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
            'Saúde': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            'Lazer': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            'Educação': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
            'Moradia': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300',
            'Outros': 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
        };

        return `
            <div class="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 hover:shadow-lg transition-all duration-300 border-2 border-transparent hover:border-indigo-300 dark:hover:border-indigo-600">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-3 mb-2">
                            <h4 class="text-lg font-bold text-gray-900 dark:text-white">${expense.description}</h4>
                            <span class="px-3 py-1 rounded-full text-xs font-bold ${categoryColors[expense.category] || categoryColors['Outros']}">
                                ${expense.category}
                            </span>
                        </div>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            ${new Date(expense.date + 'T00:00:00').toLocaleDateString('pt-BR', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}
                        </p>
                    </div>
                    <div class="flex items-center gap-4">
                        <span class="text-2xl font-bold text-red-600 dark:text-red-400">
                            R$ ${expense.amount.toFixed(2).replace('.', ',')}
                        </span>
                        <div class="flex gap-2">
                            <button onclick="openEditModal('${expense.id}')" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 font-semibold transition-all duration-300 hover:scale-105"
                                    title="Editar">
                                Editar
                            </button>
                            <button onclick="confirmDelete('${expense.id}')" 
                                    class="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 font-semibold transition-all duration-300 hover:scale-105"
                                    title="Excluir">
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    renderPagination();
}

// ===== PAGINAÇÃO =====
function renderPagination() {
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    const pagination = document.getElementById('pagination');

    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }

    let html = '';

    // Botão Anterior
    html += `
        <button onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}
                class="px-4 py-2 rounded-lg font-semibold ${currentPage === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} transition-all duration-300">
            Anterior
        </button>
    `;

    // Páginas
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            html += `
                <button onclick="changePage(${i})" 
                        class="px-4 py-2 rounded-lg font-semibold ${i === currentPage ? 'bg-indigo-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600'} transition-all duration-300">
                    ${i}
                </button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            html += `<span class="px-2 text-gray-600 dark:text-gray-400">...</span>`;
        }
    }

    // Botão Próximo
    html += `
        <button onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}
                class="px-4 py-2 rounded-lg font-semibold ${currentPage === totalPages ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 text-white'} transition-all duration-300">
            Próximo
        </button>
    `;

    pagination.innerHTML = html;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderExpenses();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== EDITAR =====
function openEditModal(id) {
    const expense = allExpenses.find(e => e.id === id);
    if (!expense) return;

    document.getElementById('editId').value = expense.id;
    document.getElementById('editDescription').value = expense.description;
    document.getElementById('editAmount').value = expense.amount;
    document.getElementById('editCategory').value = expense.category;
    document.getElementById('editDate').value = expense.date;

    document.getElementById('editModal').classList.remove('hidden');
}

function closeEditModal() {
    document.getElementById('editModal').classList.add('hidden');
}

document.getElementById('editForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const id = document.getElementById('editId').value;
    const expense = {
        description: document.getElementById('editDescription').value.trim(),
        amount: parseFloat(document.getElementById('editAmount').value),
        category: document.getElementById('editCategory').value,
        date: document.getElementById('editDate').value
    };

    const result = await updateExpense(id, expense);

    if (result.success) {
        const index = allExpenses.findIndex(e => e.id === id);
        if (index !== -1) {
            allExpenses[index] = { id, ...expense };
        }

        filteredExpenses = [...allExpenses];
        updateStatistics();
        applyFilters();
        closeEditModal();
        
        alert('Gasto atualizado com sucesso!');
    } else {
        alert('Erro ao atualizar gasto. Tente novamente.');
    }
});

// ===== DELETAR =====
async function confirmDelete(id) {
    if (!confirm('Deseja realmente excluir este gasto?')) return;

    const result = await deleteExpense(id);

    if (result.success) {
        allExpenses = allExpenses.filter(e => e.id !== id);
        filteredExpenses = filteredExpenses.filter(e => e.id !== id);
        updateStatistics();
        renderExpenses();
    } else {
        alert('Erro ao deletar gasto. Tente novamente.');
    }
}

// ===== EXPORTAR CSV =====
function exportToCSV() {
    if (filteredExpenses.length === 0) {
        alert('Nenhum gasto para exportar!');
        return;
    }

    const headers = ['Data', 'Descrição', 'Categoria', 'Valor'];
    const rows = filteredExpenses.map(e => [
        new Date(e.date + 'T00:00:00').toLocaleDateString('pt-BR'),
        e.description,
        e.category,
        `R$ ${e.amount.toFixed(2).replace('.', ',')}`
    ]);

    let csv = headers.join(';') + '\n';
    rows.forEach(row => {
        csv += row.join(';') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `gastos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ===== INICIALIZAÇÃO =====
window.addEventListener('DOMContentLoaded', async function() {
    if (!checkAuth()) return;
    
    document.getElementById('sidebarUserName').textContent = currentUser.name;
    document.getElementById('sidebarUserEmail').textContent = currentUser.email;
    
    initDarkMode();
    
    const today = new Date();
    document.getElementById('date').value = today.toISOString().split('T')[0];
    
    await loadExpenses();
    
    // Fechar modal ao clicar fora
    document.getElementById('editModal').addEventListener('click', function(e) {
        if (e.target === this) closeEditModal();
    });
});
