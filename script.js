          // /Users/antoniocliment/Documents/GESTION RESPIRALL/script.js

// ===================================================================================
// ESTADO GLOBAL Y CONFIGURACIÓN
// ===================================================================================

// Clave de datos del usuario actual. Se establece después del inicio de sesión.
let currentUserDataKey = null;

// El estado inicial de la aplicación. Si no hay datos guardados para un usuario,
// se usará esta estructura por defecto.
const initialState = {
    products: [],
    catalog: {
        categories: [
            { id: 'cat-1', name: 'Bebidas', icon: '🥤' },
            { id: 'cat-2', name: 'Comida', icon: '🍔' },
            { id: 'cat-3', name: 'Limpieza', icon: '🧼' },
            { id: 'cat-4', name: 'Postres', icon: '🍰' }
        ],
        products: [
            { id: 'cat-prod-1', categoryId: 'cat-1', name: 'Coca-Cola' },
            { id: 'cat-prod-2', categoryId: 'cat-1', name: 'Cerveza' },
            { id: 'cat-prod-3', categoryId: 'cat-2', name: 'Patatas Fritas' }
        ]
    },
    filters: {
        category: 'all',
        sortBy: 'name'
    }
};

let state = {};

// ===================================================================================
// FUNCIONES DE GESTIÓN DE DATOS (GUARDADO Y CARGA)
// ===================================================================================

/**
 * Guarda el estado actual del inventario en localStorage.
 */
function saveState() {
    if (!currentUserDataKey) {
        console.error("No se puede guardar el estado: no hay un usuario activo.");
        return;
    }
    localStorage.setItem(currentUserDataKey, JSON.stringify(state));
    console.log(`Datos guardados para el usuario en la clave: ${currentUserDataKey}`);
}

/**
 * Carga el estado del inventario desde localStorage.
 */
function loadState() {
    if (!currentUserDataKey) {
        console.error("No se puede cargar el estado: no hay un usuario activo. Se usará el estado inicial.");
        state = JSON.parse(JSON.stringify(initialState));
        return;
    }
    const savedData = localStorage.getItem(currentUserDataKey);
    if (savedData) {
        try {
            state = JSON.parse(savedData);
            // Aseguramos que la estructura del estado es consistente
            if (!state.products) state.products = [];
            if (!state.catalog) state.catalog = initialState.catalog;
            // Aseguramos que los iconos existan en categorías antiguas
            state.catalog.categories.forEach((cat, index) => {
                if (!cat.icon) cat.icon = initialState.catalog.categories[index]?.icon || '📦';
            });
            if (!state.filters) state.filters = initialState.filters;
            console.log(`Datos cargados desde localStorage para la clave: ${currentUserDataKey}`);
        } catch (e) {
            console.error("Error al parsear los datos guardados, se usará el estado inicial.", e);
            state = JSON.parse(JSON.stringify(initialState)); // Copia profunda
        }
    } else {
        // Si no hay datos, usamos el estado inicial.
        console.log('No se encontraron datos guardados. Usando estado inicial.');
        state = JSON.parse(JSON.stringify(initialState)); // Copia profunda
    }
}

// ===================================================================================
// LÓGICA DE RENDERIZADO (MOSTRAR DATOS EN LA PANTALLA)
// ===================================================================================

// (El resto de las funciones de renderizado y lógica de la aplicación permanecen aquí)
// ... (Aquí iría todo tu código de renderDashboard, renderProductTable, etc.)
// Por simplicidad, he reconstruido las funciones más importantes basándome en tu HTML.

/**
 * Función principal que se llama para redibujar toda la interfaz.
 */
function renderAll() {
    if (!state || !state.products) return;
    renderCategoryFilters();
    renderDashboard();
    renderProductTable();
    renderManagementPanel();
    saveState(); // ¡CLAVE! Guardamos el estado en cada renderizado para asegurar persistencia.
}

/**
 * Renderiza los filtros de categoría.
 */
function renderCategoryFilters() {
    const container = document.getElementById('category-filters');
    container.innerHTML = '';
    
    const allBtn = document.createElement('button');
    allBtn.className = `category-filter-btn ${state.filters.category === 'all' ? 'active' : ''}`;
    // Añadimos un icono para "Todas" y usamos innerHTML para estructurarlo
    allBtn.innerHTML = `<span class="filter-icon">🌐</span><span>Todas</span>`;
    allBtn.onclick = () => {
        state.filters.category = 'all';
        renderAll(); // Esto redibuja y guarda el estado
    };
    container.appendChild(allBtn);

    state.catalog.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-filter-btn ${state.filters.category === cat.id ? 'active' : ''}`;
        // Usamos innerHTML para añadir el icono y el texto por separado
        // El '|| '📦'' es un icono por defecto si no se define uno.
        btn.innerHTML = `<span class="filter-icon">${cat.icon || '📦'}</span><span>${cat.name}</span>`;
        btn.onclick = () => {
            state.filters.category = cat.id;
            renderAll(); // Esto redibuja y guarda el estado
        };
        container.appendChild(btn);
    });
}

/**
 * Filtra y ordena los productos según los filtros activos.
 * @returns {Array} La lista de productos filtrada y ordenada.
 */
function getFilteredAndSortedProducts() {
    let products = [...state.products];

    // Filtrado por categoría
    if (state.filters.category !== 'all') {
        products = products.filter(p => p.categoryId === state.filters.category);
    }

    // Ordenación
    switch (state.filters.sortBy) {
        case 'stock_desc':
            products.sort((a, b) => calculateTotalStock(b) - calculateTotalStock(a));
            break;
        case 'stock_asc':
            products.sort((a, b) => calculateTotalStock(a) - calculateTotalStock(b));
            break;
        case 'name':
        default:
            products.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }
    return products;
}

/**
 * Renderiza las tarjetas de producto en el dashboard.
 */
function renderDashboard() {
    const container = document.getElementById('dashboard-container');
    container.innerHTML = '';
    const productsToRender = getFilteredAndSortedProducts();

    if (productsToRender.length === 0) {
        container.innerHTML = '<p>No hay productos en esta categoría. ¡Añade uno desde el panel de gestión!</p>';
        return;
    }

    productsToRender.forEach(product => {
        const totalStock = calculateTotalStock(product);
        const category = state.catalog.categories.find(c => c.id === product.categoryId);
        const isLowStock = totalStock <= product.minStock;
        const hasExpiringBatch = product.batches.some(batch => isExpiringSoon(batch.expiration, 7));

        const card = document.createElement('div');
        card.className = `product-card ${isLowStock ? 'low-stock' : ''} ${hasExpiringBatch ? 'expiring-soon' : ''}`;
        card.dataset.productId = product.id;

        card.innerHTML = `
            <div class="card-header">
                <span class="product-category-tag">${category ? category.name : 'Sin Categoría'}</span>
                ${hasExpiringBatch ? '<span class="expiring-icon" title="¡Un lote caduca pronto!">⚠️</span>' : ''}
            </div>
            <div class="card-body">
                <h3>${product.name}</h3>
                <div class="stock-display">
                    <span class="total-stock">${totalStock}</span>
                    <span class="stock-unit">${product.unit}</span>
                </div>
                <div class="stock-progress-bar">
                    <div class="stock-progress" style="width: ${Math.min((totalStock / (product.minStock * 2)) * 100, 100)}%;"></div>
                </div>
                <small class="min-stock-label">Mínimo: ${product.minStock} ${product.unit}</small>
            </div>
            <div class="card-footer">
                <div class="stock-controls">
                    <button class="stock-btn remove-stock" data-product-id="${product.id}" title="Quitar 1 unidad del lote más antiguo">-</button>
                    <button class="stock-btn add-batch" data-product-id="${product.id}" title="Añadir nuevo lote">+</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/**
 * Renderiza la tabla detallada de productos y lotes.
 */
function renderProductTable() {
    const tbody = document.getElementById('product-table-body');
    tbody.innerHTML = '';
    const productsToRender = getFilteredAndSortedProducts();

    if (productsToRender.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay productos que mostrar.</td></tr>';
        return;
    }

    productsToRender.forEach(product => {
        const totalStock = calculateTotalStock(product);
        const isLowStock = totalStock <= product.minStock;

        // Fila del producto principal
        const productRow = document.createElement('tr');
        productRow.className = `product-header-row ${isLowStock ? 'low-stock-row' : ''}`;
        productRow.innerHTML = `
            <td class="col-product"><strong>${product.name}</strong></td>
            <td><strong>${totalStock} ${product.unit}</strong></td>
            <td colspan="3"></td>
        `;
        tbody.appendChild(productRow);

        // Filas para cada lote
        if (product.batches.length > 0) {
            product.batches.sort((a, b) => {
                if (!a.expiration) return 1;
                if (!b.expiration) return -1;
                return new Date(a.expiration) - new Date(b.expiration);
            }).forEach(batch => {
                const batchRow = document.createElement('tr');
                const isBatchExpiring = isExpiringSoon(batch.expiration, 7);
                if (isBatchExpiring) {
                    batchRow.classList.add('expiring-soon-row');
                }

                batchRow.innerHTML = `
                    <td class="col-product" data-label="Lote" style="padding-left: 30px;">↳ Lote</td>
                    <td data-label="Stock Lote">${batch.quantity} ${product.unit}</td>
                    <td data-label="Fecha Compra">${new Date(batch.purchaseDate).toLocaleDateString()}</td>
                    <td data-label="Fecha Caducidad">${batch.expiration ? new Date(batch.expiration).toLocaleDateString() : 'N/A'}</td>
                    <td data-label="Acciones" class="actions-cell">
                        <button class="edit-batch-btn" title="Editar Lote" data-product-id="${product.id}" data-batch-id="${batch.id}">✏️</button>
                        <button class="delete-batch-btn" title="Eliminar Lote" data-product-id="${product.id}" data-batch-id="${batch.id}">🗑️</button>
                    </td>
                `;
                tbody.appendChild(batchRow);
            });
        } else {
            const noBatchRow = document.createElement('tr');
            noBatchRow.innerHTML = `<td colspan="5" style="padding-left: 30px; font-style: italic;">No hay lotes para este producto.</td>`;
            tbody.appendChild(noBatchRow);
        }
    });
}

/**
 * Renderiza el contenido dinámico del panel de gestión.
 */
function renderManagementPanel() {
    // Renderizar lista de categorías para eliminar
    const categoryListContainer = document.getElementById('category-list-management');
    categoryListContainer.innerHTML = '';
    state.catalog.categories.forEach(cat => {
        const item = document.createElement('div');
        item.className = 'management-list-item';
        item.innerHTML = `
            <span>${cat.name}</span>
            <button class="delete-btn" data-category-id="${cat.id}" title="Eliminar categoría">🗑️</button>
        `;
        categoryListContainer.appendChild(item);
    });

    // Renderizar select de categorías en el formulario de añadir producto al catálogo
    const categorySelect = document.getElementById('new-product-category');
    categorySelect.innerHTML = '';
    state.catalog.categories.forEach(cat => {
        const option = document.createElement('option');
        option.value = cat.id;
        option.textContent = cat.name;
        categorySelect.appendChild(option);
    });

    // Renderizar lista de productos del catálogo para eliminar
    const catalogProductListContainer = document.getElementById('catalog-product-list-management');
    catalogProductListContainer.innerHTML = '';
    state.catalog.categories.forEach(cat => {
        const group = document.createElement('div');
        group.className = 'category-group';
        group.innerHTML = `<h4>${cat.name}</h4>`;
        
        const productsInCategory = state.catalog.products.filter(p => p.categoryId === cat.id);
        if (productsInCategory.length > 0) {
            productsInCategory.forEach(prod => {
                const item = document.createElement('div');
                item.className = 'management-list-item';
                item.innerHTML = `
                    <span>${prod.name}</span>
                    <button class="delete-btn" data-catalog-product-id="${prod.id}" title="Eliminar producto del catálogo">🗑️</button>
                `;
                group.appendChild(item);
            });
        } else {
            group.innerHTML += '<p style="font-style: italic; padding-left: 10px;">No hay productos en esta categoría.</p>';
        }
        catalogProductListContainer.appendChild(group);
    });
}

// ===================================================================================
// FUNCIONES DE UTILIDAD
// ===================================================================================

function calculateTotalStock(product) {
    return product.batches.reduce((total, batch) => total + batch.quantity, 0);
}

/**
 * Comprueba si una fecha de caducidad está dentro de un umbral de días.
 * @param {string} expirationDate - La fecha en formato YYYY-MM-DD.
 * @param {number} days - El número de días para el umbral.
 * @returns {boolean} - True si la fecha está próxima a caducar.
 */
function isExpiringSoon(expirationDate, days = 7) {
    if (!expirationDate) return false;
    const today = new Date();
    const expiry = new Date(expirationDate);
    const threshold = new Date();
    threshold.setDate(today.getDate() + days);

    // Normalizamos las fechas a medianoche para comparar solo los días
    today.setHours(0, 0, 0, 0);
    expiry.setHours(0, 0, 0, 0);
    threshold.setHours(0, 0, 0, 0);

    return expiry >= today && expiry <= threshold;
}

function showToast(message) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function generateId(prefix) {
    return `${prefix}-${Date.now()}`;
}

// ===================================================================================
// INICIALIZACIÓN Y EVENT LISTENERS
// ===================================================================================

/**
 * Configura todos los event listeners de la aplicación.
 */
function setupEventListeners() {
    const DELETION_PASSWORD = 'respirall'; // Contraseña para acciones destructivas

    // Listener para el selector de ordenación
    document.getElementById('sort-by').addEventListener('change', (e) => {
        state.filters.sortBy = e.target.value;
        renderAll();
    });

    // Listener para exportar datos
    document.getElementById('export-data-btn').addEventListener('click', () => {
        const dataStr = JSON.stringify(state, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.download = `inventario_backup_${new Date().toISOString().split('T')[0]}.json`;
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        showToast('Datos exportados con éxito.');
    });

    // Listener para el botón de importar
    document.getElementById('import-data-btn').addEventListener('click', () => {
        document.getElementById('import-file-input').click();
    });

    // Listener para el input de archivo
    document.getElementById('import-file-input').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedState = JSON.parse(e.target.result);
                // Validar que el estado importado tiene la estructura mínima
                if (importedState && importedState.products && importedState.catalog) {
                    if (confirm('¿Estás seguro? Esto reemplazará TODOS tus datos actuales.')) {
                        state = importedState;
                        renderAll();
                        showToast('Datos importados correctamente.');
                    }
                } else {
                    showToast('Error: El archivo no tiene el formato correcto.');
                }
            } catch (error) {
                console.error('Error al importar el archivo:', error);
                showToast('Error: El archivo JSON no es válido.');
            }
        };
        reader.readAsText(file);
        event.target.value = ''; // Reset input
    });

    // --- Listeners y funciones para el Modal de Lotes ---
    const batchModal = document.getElementById('batch-modal');
    const closeBatchModalBtn = document.getElementById('close-batch-modal-btn');
    const batchForm = document.getElementById('batch-form');
    const batchModalTitle = document.getElementById('batch-modal-title');
    const batchProductIdInput = document.getElementById('batch-product-id');
    const batchIdInput = document.getElementById('batch-id');
    const batchQuantityInput = document.getElementById('batch-quantity');
    const batchExpirationInput = document.getElementById('batch-expiration');
    const batchNoExpirationCheckbox = document.getElementById('batch-no-expiration');

    function openBatchModal({ productId, batchId = null }) {
        const product = state.products.find(p => p.id === productId);
        if (!product) return;

        batchForm.reset();
        batchProductIdInput.value = productId;
        batchIdInput.value = batchId || '';
        
        if (batchId) {
            const batch = product.batches.find(b => b.id === batchId);
            if (!batch) return;
            batchModalTitle.textContent = `Editar Lote de ${product.name}`;
            batchQuantityInput.value = batch.quantity;

            // Lógica para manejar la fecha de caducidad o su ausencia
            if (batch.expiration) {
                batchExpirationInput.value = batch.expiration;
                batchNoExpirationCheckbox.checked = false;
            } else {
                batchExpirationInput.value = '';
                batchNoExpirationCheckbox.checked = true;
            }
            // Disparamos el evento 'change' para actualizar el estado del input de fecha
            batchNoExpirationCheckbox.dispatchEvent(new Event('change'));

        } else {
            batchModalTitle.textContent = `Añadir Nuevo Lote a ${product.name}`;
            // Reseteamos el checkbox para un lote nuevo
            batchNoExpirationCheckbox.checked = false;
            batchNoExpirationCheckbox.dispatchEvent(new Event('change'));
        }
        batchModal.style.display = 'flex';
    }

    closeBatchModalBtn.addEventListener('click', () => {
        batchModal.style.display = 'none';
    });

    batchModal.addEventListener('click', (e) => {
        // Cierra el modal si se hace clic fuera del contenido
        if (e.target === batchModal) {
            batchModal.style.display = 'none';
        }
    });

    // Listener para el checkbox "No caduca" del modal de lotes
    batchNoExpirationCheckbox.addEventListener('change', () => {
        const isChecked = batchNoExpirationCheckbox.checked;
        batchExpirationInput.disabled = isChecked;
        // Un lote debe tener fecha a menos que se marque "no caduca"
        batchExpirationInput.required = !isChecked;
        if (isChecked) {
            batchExpirationInput.value = '';
        }
    });

    // Listener para el checkbox "No caduca" del wizard de añadir producto
    const catalogExpirationInput = document.getElementById('catalog-expiration');
    const catalogNoExpirationCheckbox = document.getElementById('catalog-no-expiration');
    catalogNoExpirationCheckbox.addEventListener('change', () => {
        catalogExpirationInput.disabled = catalogNoExpirationCheckbox.checked;
        if (catalogNoExpirationCheckbox.checked) catalogExpirationInput.value = '';
    });


    // --- Listeners del Panel de Gestión ---

    const openPanelBtn = document.getElementById('open-management-panel-btn');
    const closePanelBtn = document.getElementById('close-panel-btn');
    const managementPanel = document.getElementById('management-panel');
    const panelNavBtns = document.querySelectorAll('.panel-nav-btn');
    const panelViews = document.querySelectorAll('.panel-view');

    openPanelBtn.addEventListener('click', () => {
        managementPanel.style.display = 'flex';
        // Asegurarse de que el wizard se renderiza al abrir
        renderWizard();
    });

    closePanelBtn.addEventListener('click', () => managementPanel.style.display = 'none');

    panelNavBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            panelNavBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const targetViewId = btn.dataset.target;
            panelViews.forEach(view => {
                view.classList.remove('active');
                if (view.id === targetViewId) {
                    view.classList.add('active');
                }
            });
        });
    });

    // --- Listeners del Wizard para añadir producto ---

    const addFromCatalogForm = document.getElementById('add-from-catalog-form');
    const wizardSteps = document.querySelectorAll('.wizard-step');
    const backBtns = document.querySelectorAll('.wizard-back-btn');
    let selectedCatalogProductInfo = { categoryId: null, productId: null };

    function goToStep(stepNumber) {
        wizardSteps.forEach(step => step.classList.remove('active-step'));
        document.getElementById(`wizard-step-${stepNumber}`).classList.add('active-step');
    }

    backBtns.forEach(btn => {
        btn.addEventListener('click', () => goToStep(btn.dataset.targetStep));
    });

    // Rellenar el wizard
    function renderWizard() {
        const categoryGrid = document.getElementById('catalog-category-grid');
        categoryGrid.innerHTML = '';
        state.catalog.categories.forEach(cat => {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'category-card-btn';
            // Usamos innerHTML para poder añadir el icono y el texto por separado.
            // El '|| '📦'' es un icono por defecto si no se define uno.
            card.innerHTML = `
                <span class="category-icon">${cat.icon || '📦'}</span>
                <span>${cat.name}</span>
            `;
            card.onclick = () => {
                selectedCatalogProductInfo.categoryId = cat.id;
                document.getElementById('summary-category-name').textContent = cat.name;
                renderProductSelectionStep(cat.id);
                goToStep(2);
            };
            categoryGrid.appendChild(card);
        });
    }

    function renderProductSelectionStep(categoryId) {
        const productGrid = document.getElementById('catalog-product-grid');
        productGrid.innerHTML = '';
        const productsInCategory = state.catalog.products.filter(p => p.categoryId === categoryId);
        productsInCategory.forEach(prod => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'catalog-product-btn';
            btn.textContent = prod.name;
            btn.onclick = () => {
                selectedCatalogProductInfo.productId = prod.id;
                document.getElementById('summary-product-name').textContent = prod.name;
                goToStep(3);
            };
            productGrid.appendChild(btn);
        });
    }

    // El wizard se renderiza cada vez que se abre el panel
    openPanelBtn.addEventListener('click', renderWizard);

    addFromCatalogForm.addEventListener('submit', e => {
        e.preventDefault();
        const catalogProduct = state.catalog.products.find(p => p.id === selectedCatalogProductInfo.productId);
        if (!catalogProduct) return;

        if (state.products.some(p => p.name.toLowerCase() === catalogProduct.name.toLowerCase())) {
            showToast(`El producto "${catalogProduct.name}" ya existe en el inventario.`);
            return;
        }

        const initialStock = parseInt(document.getElementById('catalog-stock').value, 10) || 0;
        const minStock = parseInt(document.getElementById('catalog-min-stock').value, 10) || 0;
        const unit = document.getElementById('catalog-unit').value;
        const expiration = document.getElementById('catalog-expiration').value;

        const newProduct = {
            id: generateId('prod'),
            name: catalogProduct.name,
            categoryId: catalogProduct.categoryId,
            minStock: minStock,
            unit: unit,
            batches: []
        };

        if (initialStock > 0) {
            newProduct.batches.push({
                id: generateId('batch'),
                quantity: initialStock,
                purchaseDate: new Date().toISOString().split('T')[0],
                expiration: expiration || null
            });
        }

        state.products.push(newProduct);
        showToast(`Producto "${newProduct.name}" añadido al inventario.`);
        addFromCatalogForm.reset();
        goToStep(1);
        managementPanel.style.display = 'none';
        renderAll();
    });

    // --- Listeners para la gestión del catálogo ---

    document.getElementById('add-category-form').addEventListener('submit', e => {
        e.preventDefault();
        const input = document.getElementById('new-category-name');
        const newCategoryName = input.value.trim();
        if (newCategoryName) {
            state.catalog.categories.push({ id: generateId('cat'), name: newCategoryName });
            input.value = '';
            showToast('Categoría añadida.');
            renderAll();
        }
    });

    batchForm.addEventListener('submit', e => {
        e.preventDefault();
        const productId = batchProductIdInput.value;
        const batchId = batchIdInput.value;
        const quantity = parseInt(batchQuantityInput.value, 10);
        const expiration = batchExpirationInput.value;
        const noExpiration = batchNoExpirationCheckbox.checked;

        const product = state.products.find(p => p.id === productId);

        // --- VALIDACIÓN MEJORADA ---
        if (!product) {
            showToast('Error: Producto no encontrado.');
            return;
        }
        if (isNaN(quantity) || quantity <= 0) {
            showToast('La cantidad debe ser un número mayor que 0.');
            batchQuantityInput.focus();
            return;
        }
        if (!noExpiration && !expiration) {
            showToast('Debes indicar una fecha de caducidad o marcar "No caduca".');
            batchExpirationInput.focus();
            return;
        }
        // --- FIN VALIDACIÓN ---

        if (batchId) {
            const batch = product.batches.find(b => b.id === batchId);
            if (batch) {
                batch.quantity = quantity;
                batch.expiration = noExpiration ? null : expiration;
                showToast('Lote actualizado.');
            }
        } else {
            product.batches.push({
                id: generateId('batch'),
                quantity: quantity,
                purchaseDate: new Date().toISOString().split('T')[0],
                expiration: noExpiration ? null : expiration
            });
            showToast('Nuevo lote añadido.');
        }
        batchModal.style.display = 'none';
        renderAll();
    });
    document.getElementById('add-product-to-catalog-form').addEventListener('submit', e => {
        e.preventDefault();
        const categoryId = document.getElementById('new-product-category').value;
        const nameInput = document.getElementById('new-product-name');
        const newProductName = nameInput.value.trim();

        if (categoryId && newProductName) {
            state.catalog.products.push({ id: generateId('cat-prod'), categoryId, name: newProductName });
            nameInput.value = '';
            showToast('Producto añadido al catálogo.');
            renderAll();
        }
    });

    // --- Delegación de eventos para acciones dinámicas ---

    document.body.addEventListener('click', e => {
        // Eliminar categoría del catálogo
        const deleteCatBtn = e.target.closest('.management-list-item .delete-btn[data-category-id]');
        if (deleteCatBtn) {
            const catId = deleteCatBtn.dataset.categoryId;
            const productsUsingCategory = state.products.filter(p => p.categoryId === catId);
            
            let confirmationMessage = '¿Seguro que quieres eliminar esta categoría y sus productos asociados del catálogo?';
            if (productsUsingCategory.length > 0) {
                confirmationMessage = `¡Atención! ${productsUsingCategory.length} producto(s) en tu inventario usan esta categoría. Si la eliminas, quedarán como "Sin Categoría".\n\n¿Deseas continuar?`;
            }

            if (confirm(confirmationMessage)) {
                const password = prompt('Para confirmar la eliminación, introduce la contraseña de seguridad:');
                if (password === DELETION_PASSWORD) {
                    // Marcar productos del inventario como "Sin Categoría" para evitar datos huérfanos
                    productsUsingCategory.forEach(p => { p.categoryId = null; });

                    // Eliminar la categoría y sus productos del catálogo
                    state.catalog.categories = state.catalog.categories.filter(c => c.id !== catId);
                    state.catalog.products = state.catalog.products.filter(p => p.categoryId !== catId);
                    
                    showToast('Categoría eliminada.');
                    renderAll();
                } else if (password !== null) { // Si el usuario escribió algo pero es incorrecto
                    showToast('Contraseña incorrecta. Eliminación cancelada.');
                }
            }
        }

        // Eliminar producto del catálogo
        const deleteProdBtn = e.target.closest('.management-list-item .delete-btn[data-catalog-product-id]');
        if (deleteProdBtn) {
            const prodId = deleteProdBtn.dataset.catalogProductId;
            if (confirm('¿Seguro que quieres eliminar este producto del catálogo?')) {
                const password = prompt('Para confirmar la eliminación, introduce la contraseña de seguridad:');
                if (password === DELETION_PASSWORD) {
                    state.catalog.products = state.catalog.products.filter(p => p.id !== prodId);
                    showToast('Producto del catálogo eliminado.');
                    renderAll();
                } else if (password !== null) {
                    showToast('Contraseña incorrecta. Eliminación cancelada.');
                }
            }
        }

        // --- Acciones de Stock y Lotes ---

        // Añadir nuevo lote desde la tarjeta de producto
        const addBatchBtn = e.target.closest('.add-batch');
        if (addBatchBtn) {
            const productId = addBatchBtn.dataset.productId;
            openBatchModal({ productId });
        }

        // Quitar stock desde la tarjeta de producto
        const removeStockBtn = e.target.closest('.remove-stock');
        if (removeStockBtn) {
            const productId = removeStockBtn.dataset.productId;
            const product = state.products.find(p => p.id === productId);
            if (product && product.batches.length > 0) {
                // Ordenar lotes por fecha de caducidad (los más antiguos primero)
                // Los que no tienen fecha van al final
                product.batches.sort((a, b) => {
                    if (!a.expiration) return 1;
                    if (!b.expiration) return -1;
                    return new Date(a.expiration) - new Date(b.expiration);
                });

                const oldestBatch = product.batches[0];
                if (oldestBatch.quantity > 0) {
                    oldestBatch.quantity -= 1;
                    if (oldestBatch.quantity <= 0) {
                        product.batches.shift(); // Si el lote se queda sin stock, se elimina
                        showToast('Lote agotado y eliminado.');
                    } else {
                        showToast(`-1 ${product.unit} de ${product.name}`);
                    }
                    renderAll();
                }
            } else {
                showToast('No hay lotes para quitar stock.');
            }
        }

        // Editar lote desde la tabla
        const editBatchBtn = e.target.closest('.edit-batch-btn');
        if (editBatchBtn) {
            openBatchModal({ productId: editBatchBtn.dataset.productId, batchId: editBatchBtn.dataset.batchId });
        }

        // Eliminar lote desde la tabla
        const deleteBatchBtn = e.target.closest('.delete-batch-btn');
        if (deleteBatchBtn) {
            const product = state.products.find(p => p.id === deleteBatchBtn.dataset.productId);
            if (product && confirm('¿Estás seguro de que quieres eliminar este lote por completo?')) {
                product.batches = product.batches.filter(b => b.id !== deleteBatchBtn.dataset.batchId);
                showToast('Lote eliminado.');
                renderAll();
            }
        }
    });
}

/**
 * Función que arranca la aplicación para un usuario específico.
 * @param {string} username - El nombre del usuario que ha iniciado sesión.
 */
function initializeAppForUser(username) {
    console.log(`Iniciando aplicación para el usuario: ${username}`);
    // La función getUserDataKey está definida en auth.js y es global.
    // Genera la clave única para este usuario (ej: 'inventory_data_antonio').
    currentUserDataKey = getUserDataKey(username);
    if (!currentUserDataKey) {
        console.error("No se pudo generar la clave de datos para el usuario. La aplicación no puede continuar.");
        // Podríamos mostrar un error al usuario aquí.
        return;
    }
    loadState();
    setupEventListeners();
    renderAll();
}

// ===================================================================================
// PUNTO DE ENTRADA - CONTROLADO POR LA AUTENTICACIÓN
// ===================================================================================

// La aplicación ya no se inicia en 'DOMContentLoaded'.
// En su lugar, espera el evento personalizado que 'auth.js' dispara cuando el login es exitoso.
document.addEventListener('app:userLoggedIn', (event) => {
    const { user } = event.detail;
    initializeAppForUser(user);
});
