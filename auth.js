// auth.js - Sistem Login Lengkap dengan Profile Dropdown
// SEMUA MENU TETAP MUNCUL BAIK LOGIN MAUPUN LOGOUT

// Konfigurasi storage keys
const AUTH_STORAGE_KEY = 'dgames_auth';
const USERS_STORAGE_KEY = 'dgames_users';

// ==================== FUNGSI UTAMA AUTH ====================

// Mendapatkan user yang sedang login
function getCurrentUser() {
    try {
        const authData = localStorage.getItem(AUTH_STORAGE_KEY);
        if (authData) {
            return JSON.parse(authData);
        }
    } catch (e) {
        console.error('Error reading auth data:', e);
    }
    return null;
}

// Mendapatkan daftar semua user
function getAllUsers() {
    try {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        if (users) {
            return JSON.parse(users);
        }
    } catch (e) {
        console.error('Error reading users:', e);
    }
    return [];
}

// Menyimpan user baru
function saveUser(userData) {
    const users = getAllUsers();
    const existing = users.find(u => u.email === userData.email);
    if (existing) {
        return false;
    }
    users.push(userData);
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    return true;
}

// Login function
function loginUser(email, password) {
    const users = getAllUsers();
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        const initial = user.name.charAt(0).toUpperCase();
        
        const sessionUser = {
            id: user.id || Date.now(),
            name: user.name,
            email: user.email,
            avatar: user.avatar || initial,
            isLoggedIn: true,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionUser));
        
        updateAllAuthUI();
        window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { isLoggedIn: true, user: sessionUser } }));
        
        return { success: true, user: sessionUser };
    }
    
    return { success: false, message: 'Email atau password salah!' };
}

// Register function
function registerUser(name, email, password) {
    const users = getAllUsers();
    const existingUser = users.find(u => u.email === email);
    
    if (existingUser) {
        return { success: false, message: 'Email sudah terdaftar!' };
    }
    
    if (password.length < 4) {
        return { success: false, message: 'Password minimal 4 karakter!' };
    }
    
    const newUser = {
        id: Date.now(),
        name: name.trim(),
        email: email.trim(),
        password: password,
        avatar: name.charAt(0).toUpperCase(),
        createdAt: new Date().toISOString()
    };
    
    const saved = saveUser(newUser);
    if (!saved) {
        return { success: false, message: 'Gagal menyimpan user!' };
    }
    
    return loginUser(email, password);
}

// Logout function
function logoutUser() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    updateAllAuthUI();
    showAuthToast('👋 Anda telah logout', 'info');
    
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { isLoggedIn: false, user: null } }));
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 500);
}

// Cek status login
function isLoggedIn() {
    const user = getCurrentUser();
    return user !== null && user.isLoggedIn === true;
}

// ==================== UI UPDATE FUNCTIONS ====================

function updateAllAuthUI() {
    updateLoginButton();
    // HAPUS atau KOMENTARI pemanggilan updateNavbarAuthLinks() agar menu tidak hilang
    // updateNavbarAuthLinks();  // <-- DIKOMENTAR AGAR MENU TIDAK HILANG
    updateProtectedContent();
    updateCartBadgeFromStorage();
    updateMobileMenuForAuth();
}

// Fungsi ini DINONAKTIFKAN agar menu Library tetap muncul
function updateNavbarAuthLinks() {
    // KOSONGKAN - tidak melakukan apa-apa agar menu tetap muncul
    // Jika ingin menu Library tetap muncul meskipun logout, biarkan fungsi ini kosong
    console.log('Navbar links tetap muncul semua');
}

function updateLoginButton() {
    const loginButton = document.getElementById('loginButton');
    if (!loginButton) return;
    
    const user = getCurrentUser();
    const loggedIn = isLoggedIn();
    
    if (loggedIn && user) {
        const firstName = user.name.split(' ')[0];
        const avatarText = (user.avatar || user.name.charAt(0)).toUpperCase();
        
        loginButton.innerHTML = `
            <div class="flex items-center gap-2">
                <div class="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                    ${avatarText}
                </div>
                <span class="hidden sm:inline text-sm font-medium text-white">${firstName}</span>
                <i class="bi bi-chevron-down text-xs text-gray-300"></i>
            </div>
        `;
        
        loginButton.classList.remove('bg-blue-500/20', 'text-blue-300', 'border-blue-500/30');
        loginButton.classList.add('bg-transparent', 'hover:bg-white/10', 'px-2', 'py-1', 'rounded-full');
        
        createOrUpdateUserDropdown(loginButton, user);
    } else {
        loginButton.innerHTML = `<i class="bi bi-person-check-fill mr-1"></i> Login`;
        loginButton.classList.remove('bg-transparent', 'hover:bg-white/10', 'px-2', 'py-1', 'rounded-full');
        loginButton.classList.add('bg-blue-500/20', 'text-blue-300', 'border', 'border-blue-500/30', 'px-3', 'py-1.5', 'rounded-full');
        
        const existingDropdown = document.getElementById('userDropdown');
        if (existingDropdown) existingDropdown.remove();
        
        loginButton.onclick = (e) => {
            e.preventDefault();
            window.location.href = 'login.html';
        };
    }
}

function createOrUpdateUserDropdown(loginButton, user) {
    const existingDropdown = document.getElementById('userDropdown');
    if (existingDropdown) existingDropdown.remove();
    
    const avatarText = (user.avatar || user.name.charAt(0)).toUpperCase();
    
    const dropdown = document.createElement('div');
    dropdown.id = 'userDropdown';
    dropdown.className = 'hidden absolute top-full right-0 mt-2 w-64 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden';
    dropdown.style.position = 'absolute';
    
    dropdown.innerHTML = `
        <div class="px-4 py-3 border-b border-gray-800 bg-gradient-to-r from-gray-800/50 to-gray-900/50">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow-md">
                    ${avatarText}
                </div>
                <div class="flex-1">
                    <p class="text-white font-semibold text-sm">${user.name}</p>
                    <p class="text-gray-400 text-xs truncate">${user.email}</p>
                </div>
            </div>
        </div>
        <div class="py-2">
            <a href="profile.html" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition group">
                <i class="bi bi-person text-blue-400 group-hover:text-blue-300"></i>
                <span>My Profile</span>
            </a>
            <a href="library.html" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition group">
                <i class="bi bi-journal-bookmark-fill text-green-400 group-hover:text-green-300"></i>
                <span>My Library</span>
            </a>
            <a href="cart.html" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition group">
                <i class="bi bi-cart-fill text-orange-400 group-hover:text-orange-300"></i>
                <span>My Cart</span>
            </a>
            <a href="#" id="wishlistLink" class="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-300 hover:bg-white/10 transition group">
                <i class="bi bi-heart-fill text-red-400 group-hover:text-red-300"></i>
                <span>Wishlist</span>
            </a>
            <hr class="border-gray-800 my-1">
            <button id="logoutBtn" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition group">
                <i class="bi bi-box-arrow-right"></i>
                <span>Logout</span>
            </button>
        </div>
    `;
    
    loginButton.style.position = 'relative';
    loginButton.appendChild(dropdown);
    
    const toggleDropdown = (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('hidden');
    };
    loginButton.removeEventListener('click', toggleDropdown);
    loginButton.addEventListener('click', toggleDropdown);
    
    document.addEventListener('click', (e) => {
        if (!loginButton.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });
    
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            logoutUser();
        });
    }
    
    const wishlistLink = document.getElementById('wishlistLink');
    if (wishlistLink) {
        wishlistLink.addEventListener('click', (e) => {
            e.preventDefault();
            showAuthToast('❤️ Wishlist feature coming soon!', 'info');
            dropdown.classList.add('hidden');
        });
    }
}

// MENU MOBILE - TETAP MUNCUL SEMUA
function updateMobileMenuForAuth() {
    const mobileMenu = document.getElementById('mobile-nav-links');
    if (!mobileMenu) return;
    
    const user = getCurrentUser();
    const loggedIn = isLoggedIn();
    
    const existingProfileLink = mobileMenu.querySelector('.mobile-profile-link');
    const existingLogoutLink = mobileMenu.querySelector('.mobile-logout-link');
    if (existingProfileLink) existingProfileLink.remove();
    if (existingLogoutLink) existingLogoutLink.remove();
    
    if (loggedIn && user) {
        const profileItem = document.createElement('a');
        profileItem.href = 'profile.html';
        profileItem.className = 'mobile-profile-link block px-3 py-2 rounded-lg text-gray-300 hover:bg-white/10 border-t border-white/10 mt-2 pt-3';
        profileItem.innerHTML = '<i class="bi bi-person-circle mr-2"></i> My Profile';
        mobileMenu.appendChild(profileItem);
        
        const logoutItem = document.createElement('a');
        logoutItem.href = '#';
        logoutItem.className = 'mobile-logout-link block px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 mt-1';
        logoutItem.innerHTML = '<i class="bi bi-box-arrow-right mr-2"></i> Logout';
        logoutItem.onclick = (e) => {
            e.preventDefault();
            logoutUser();
        };
        mobileMenu.appendChild(logoutItem);
    }
}

function updateProtectedContent() {
    const loggedIn = isLoggedIn();
    const user = getCurrentUser();
    
    const claimButtons = document.querySelectorAll('.btn-epic a');
    claimButtons.forEach(btn => {
        if (btn && btn.textContent && btn.textContent.includes('CLAIM')) {
            if (loggedIn) {
                btn.innerHTML = '<i class="bi bi-gift-fill"></i> CLAIM FREE GAME';
                btn.href = '#';
                btn.onclick = (e) => {
                    e.preventDefault();
                    showAuthToast(`🎮 Free game added to your library, ${user?.name?.split(' ')[0]}!`, 'success');
                };
            } else {
                btn.href = 'login.html';
                btn.onclick = null;
            }
        }
    });
    
    const notifDot = document.getElementById('notifDot');
    if (notifDot) {
        notifDot.style.display = loggedIn ? 'block' : 'none';
    }
}

function updateCartBadgeFromStorage() {
    let cartCount = 0;
    try {
        const cartStorage = localStorage.getItem('shopping_cart') || localStorage.getItem('keranjang');
        if (cartStorage) {
            const cartArr = JSON.parse(cartStorage);
            if (Array.isArray(cartArr)) {
                cartCount = cartArr.reduce((total, item) => total + (item.quantity || item.jumlah || 1), 0);
            }
        }
    } catch(e) {}
    
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        if (cartCount > 0) {
            badge.textContent = cartCount;
            badge.style.display = 'flex';
            badge.classList.add('pop');
            setTimeout(() => badge.classList.remove('pop'), 300);
        } else {
            badge.style.display = 'none';
        }
    });
}

function showAuthToast(message, type = 'success') {
    const oldToast = document.querySelector('.auth-toast');
    if (oldToast) oldToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'auth-toast';
    
    let icon = '✅';
    let bgColor = '#10b981';
    if (type === 'error') {
        icon = '❌';
        bgColor = '#ef4444';
    } else if (type === 'info') {
        icon = 'ℹ️';
        bgColor = '#3b82f6';
    }
    
    toast.innerHTML = `<div class="flex items-center gap-3"><span class="text-xl">${icon}</span><span class="text-sm font-medium">${message}</span></div>`;
    
    toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${bgColor};
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
        font-family: 'Inter', system-ui, sans-serif;
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => { if (toast && toast.parentNode) toast.remove(); }, 3000);
}

function setupDemoUser() {
    const users = getAllUsers();
    if (users.length === 0) {
        const demoUsers = [
            { id: 1, name: 'Denis Ganteng', email: 'denis@dgames.com', password: 'denis123', avatar: 'D' },
            { id: 2, name: 'Kelompok 5', email: 'kelompok5@dgames.com', password: 'kelompok5', avatar: 'K' },
            { id: 3, name: 'Gamer Pro', email: 'gamer@dgames.com', password: 'gamer123', avatar: 'G' },
            { id: 4, name: 'Yizreel Heliano', email: 'tongamsihombing14@gmail.com', password: 'yizreel123', avatar: 'Y' }
        ];
        demoUsers.forEach(user => saveUser(user));
        console.log('Demo users created successfully');
    }
}

function initAuthSystem() {
    setupDemoUser();
    updateAllAuthUI();
    
    window.addEventListener('storage', (e) => {
        if (e.key === AUTH_STORAGE_KEY || e.key === USERS_STORAGE_KEY) {
            setTimeout(() => updateAllAuthUI(), 100);
        }
    });
    
    const protectedPages = ['profile.html', 'library.html'];
    const currentPage = window.location.pathname.split('/').pop();
    if (protectedPages.includes(currentPage) && !isLoggedIn()) {
        sessionStorage.setItem('redirectAfterLogin', currentPage);
        window.location.href = 'login.html';
    }
    
    const redirectUrl = sessionStorage.getItem('redirectAfterLogin');
    if (redirectUrl && isLoggedIn()) {
        sessionStorage.removeItem('redirectAfterLogin');
        window.location.href = redirectUrl;
    }
}

// Jalankan saat halaman dimuat
document.addEventListener('DOMContentLoaded', () => {
    initAuthSystem();
    
    // Handle login form
    const loginForm = document.getElementById('loginFormMain');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('loginEmail')?.value.trim();
            const password = document.getElementById('loginPassword')?.value;
            
            if (!email || !password) {
                showAuthToast('Please enter email and password!', 'error');
                return;
            }
            
            const result = loginUser(email, password);
            if (result.success) {
                showAuthToast(`Welcome back, ${result.user.name.split(' ')[0]}!`, 'success');
                setTimeout(() => window.location.href = 'index.html', 1000);
            } else {
                showAuthToast(result.message, 'error');
            }
        });
    }
    
    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const fullName = document.getElementById('fullName')?.value.trim();
            const email = document.getElementById('regEmail')?.value.trim();
            const password = document.getElementById('regPassword')?.value;
            const confirmPwd = document.getElementById('confirmPassword')?.value;
            const termsCheckbox = document.getElementById('termsCheckbox');
            
            if (!fullName || fullName.length < 3) {
                showAuthToast('Full name must be at least 3 characters', 'error');
                return;
            }
            if (!email || !email.includes('@')) {
                showAuthToast('Please enter a valid email address', 'error');
                return;
            }
            if (!password || password.length < 4) {
                showAuthToast('Password must be at least 4 characters', 'error');
                return;
            }
            if (password !== confirmPwd) {
                showAuthToast('Passwords do not match', 'error');
                return;
            }
            if (termsCheckbox && !termsCheckbox.checked) {
                showAuthToast('You must agree to the Terms & Conditions', 'error');
                return;
            }
            
            const result = registerUser(fullName, email, password);
            if (result.success) {
                showAuthToast(`Registration successful! Welcome, ${fullName.split(' ')[0]}!`, 'success');
                setTimeout(() => window.location.href = 'index.html', 1500);
            } else {
                showAuthToast(result.message, 'error');
            }
        });
    }
});

// Animations style
if (!document.querySelector('#auth-animation-style')) {
    const style = document.createElement('style');
    style.id = 'auth-animation-style';
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes badgePop {
            0% { transform: scale(1); }
            50% { transform: scale(1.3); }
            100% { transform: scale(1); }
        }
        @keyframes fadeInDown {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .auth-toast { animation: slideInRight 0.3s ease; }
        #userDropdown { animation: fadeInDown 0.2s ease; }
        .cart-badge.pop { animation: badgePop 0.3s ease; }
    `;
    document.head.appendChild(style);
}

// Export functions
window.getCurrentUser = getCurrentUser;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logoutUser = logoutUser;
window.isLoggedIn = isLoggedIn;
window.updateAllAuthUI = updateAllAuthUI;
window.showAuthToast = showAuthToast;
window.initAuthSystem = initAuthSystem;

console.log('Auth.js loaded successfully - SEMUA MENU TETAP MUNCUL');