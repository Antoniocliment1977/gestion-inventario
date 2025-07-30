/**
 * Obtiene el usuario actual desde sessionStorage.
 * @returns {string|null} El nombre del usuario o null si no hay sesión.
 */
function getCurrentUser() {
    return sessionStorage.getItem('currentUser');
}

/**
 * Genera la clave única para guardar los datos de un usuario en localStorage.
 * @param {string} username - El nombre del usuario.
 * @returns {string|null} La clave para localStorage o null si no hay usuario.
 */
function getUserDataKey(username) {
    if (!username) return null;
    return `inventory_data_${username.toLowerCase().trim()}`;
}

// Este código se ejecuta cuando el HTML está listo.
document.addEventListener('DOMContentLoaded', () => {
    // Seleccionamos los elementos del DOM que necesitamos.
    const loginModal = document.getElementById('login-modal');
    const loginForm = document.getElementById('login-form');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const mainContent = document.querySelector('main');
    const fab = document.getElementById('open-management-panel-btn');
    const userDisplay = document.getElementById('user-display');
    const logoutBtn = document.getElementById('logout-btn');

    const currentUser = getCurrentUser();

    if (currentUser) {
        // Si ya hay un usuario en la sesión (p.ej. recargó la página):
        loginModal.style.display = 'none';
        mainContent.style.display = 'block';
        fab.style.display = 'block';
        userDisplay.textContent = `Usuario: ${currentUser}`;
        userDisplay.style.display = 'block';

        // Lanzamos un evento personalizado para avisar a script.js que puede empezar a cargar los datos.
        document.dispatchEvent(new CustomEvent('app:userLoggedIn', { detail: { user: currentUser } }));
    } else {
        // Si no hay usuario, nos aseguramos de que el modal de login se vea.
        loginModal.style.display = 'flex';
    }

    // Event listener para el formulario de login.
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;
        const LOGIN_PASSWORD = 'respirall';

        // Primero, validamos la contraseña
        if (password !== LOGIN_PASSWORD) {
            alert('Contraseña incorrecta.');
            passwordInput.value = ''; // Limpiamos el campo
            passwordInput.focus(); // Devolvemos el foco
            return; // Detenemos la ejecución
        }

        // Si la contraseña es correcta, procedemos con el usuario
        if (username && username.trim() !== '') {
            // Guardamos el usuario en la sesión del navegador.
            sessionStorage.setItem('currentUser', username.trim());
            // Recargamos la página para que el nuevo estado de sesión se aplique.
            window.location.reload();
        }
    });

    // Event listener para el botón de cerrar sesión.
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('¿Estás seguro de que quieres cerrar la sesión?')) {
                sessionStorage.removeItem('currentUser'); // Borramos el usuario de la sesión.
                window.location.reload(); // Recargamos para volver al modal de login.
            }
        });
    }
});