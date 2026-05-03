// ==================== KERANJANG TERPUSAT ====================
const CART_STORAGE_KEY = 'shopping_cart';

function getCart() {
    const stored = localStorage.getItem(CART_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveCart(cart) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    updateCartBadge();
}

function updateCartBadge() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        if (totalItems > 0) {
            badge.textContent = totalItems;
            badge.style.display = 'flex';
            badge.classList.add('pop');
            setTimeout(() => badge.classList.remove('pop'), 200);
        } else {
            badge.style.display = 'none';
        }
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #1f2937;
        color: white;
        padding: 10px 20px;
        border-radius: 12px;
        border-left: 4px solid #3b82f6;
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
}

function addToCart(id, name, price, image) {
    let cart = getCart();
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ id, name, price, image, quantity: 1 });
    }
    saveCart(cart);
    showToast(`✅ ${name} ditambahkan ke keranjang`);
}

// ========== OTOMATIS ATTACH KE SEMUA TOMBOL ==========
function attachCartEvents() {
    // Cari semua card dengan class 'group'
    const cards = document.querySelectorAll('.group');
    cards.forEach(card => {
        // Cari tombol dengan class bg-blue-600 atau bg-blue-500
        const btn = card.querySelector('.bg-blue-600, .bg-blue-500');
        if (!btn || btn.hasAttribute('data-cart-attached')) return;

        // Ambil data dari card
        const nameEl = card.querySelector('h3');
        const priceEl = card.querySelector('.text-green-400, .text-orange-400');
        const imgEl = card.querySelector('img');
        if (!nameEl || !priceEl || !imgEl) return;

        const gameName = nameEl.innerText.trim();
        let priceText = priceEl.innerText.trim();
        let priceValue = (priceText === 'Free') ? 0 : parseFloat(priceText.replace('$', ''));
        const gameImage = imgEl.src;
        const gameId = gameName.toLowerCase().replace(/\s/g, '_');

        // Simpan data ke tombol
        btn.setAttribute('data-game-id', gameId);
        btn.setAttribute('data-game-name', gameName);
        btn.setAttribute('data-game-price', priceValue);
        btn.setAttribute('data-game-image', gameImage);
        btn.setAttribute('data-cart-attached', 'true');

        // Clone & replace untuk clean event
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const id = newBtn.getAttribute('data-game-id');
            const name = newBtn.getAttribute('data-game-name');
            const price = parseFloat(newBtn.getAttribute('data-game-price'));
            const image = newBtn.getAttribute('data-game-image');
            addToCart(id, name, price, image);
        });
    });
}

// Jalankan saat halaman siap
document.addEventListener('DOMContentLoaded', () => {
    attachCartEvents();
    updateCartBadge();

    // Tombol cart redirect ke cart.html
    document.querySelectorAll('.cart-button, .bi-cart').forEach(btn => {
        const clickable = btn.closest('button') || btn;
        clickable.addEventListener('click', () => {
            window.location.href = 'cart.html';
        });
    });
});

// Untuk card yang dimuat kemudian (pagination, dll)
setInterval(attachCartEvents, 1500);

// Tambahkan style animasi
if (!document.querySelector('#cart-sync-style')) {
    const style = document.createElement('style');
    style.id = 'cart-sync-style';
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
        .cart-badge.pop {
            animation: badgePop 0.2s ease;
        }
    `;
    document.head.appendChild(style);
}