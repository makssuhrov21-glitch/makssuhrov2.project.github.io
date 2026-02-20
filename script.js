// ========== ДАНІ ТОВАРІВ ==========
const products = [
    {
        id: "felicity-1",
        category: "Світло",
        subcategory: "АКБ",
        price: 38800,
        currency: "грн",
        name_ua: "🔋 Felicity ESS LPBF 24V 200Ah",
        images: ["images/no-image.jpg"]
    },
    {
        id: "must-1",
        category: "Світло",
        subcategory: "Інвертор",
        price: 54000,
        currency: "грн",
        name_ua: "⚡ Must 3.2kW 24V Інвертор",
        images: ["images/no-image.jpg"]
    },
    {
        id: "hybrid-1",
        category: "Світло",
        subcategory: "Гібридний",
        price: 85000,
        currency: "грн",
        name_ua: "🔄 Гібридний інвертор 5kW 48V",
        images: ["images/no-image.jpg"]
    }
];

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentTheme = localStorage.getItem('theme') || 'light';

// ========== ОСНОВНІ ФУНКЦІЇ ==========
document.addEventListener('DOMContentLoaded', function() {
    // Встановлюємо тему
    document.body.className = currentTheme + '-theme';
    
    // Показуємо товари
    showProducts();
    
    // Показуємо кошик
    showCart();
    
    // Кнопка теми
    document.getElementById('themeToggle')?.addEventListener('click', function() {
        currentTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', currentTheme);
        document.body.className = currentTheme + '-theme';
        showMessage('Тему змінено');
    });
    
    // Кнопка кошика
    document.getElementById('cartToggle')?.addEventListener('click', function() {
        document.getElementById('cartSidebar')?.classList.add('open');
        document.getElementById('overlay')?.classList.add('active');
    });
    
    // Закриття кошика
    document.getElementById('closeCart')?.addEventListener('click', closeCart);
    document.getElementById('overlay')?.addEventListener('click', closeCart);
    
    // Кнопка оформлення
    document.getElementById('checkoutBtn')?.addEventListener('click', function() {
        if (cart.length === 0) {
            showMessage('🛒 Кошик порожній', 'error');
            return;
        }
        showMessage('📞 Телефонуйте: +380995371400');
    });
    
    // Статистика
    animateStats();
});

function closeCart() {
    document.getElementById('cartSidebar')?.classList.remove('open');
    document.getElementById('overlay')?.classList.remove('active');
}

function showProducts() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;
    
    grid.innerHTML = products.map((p, i) => `
        <div class="product-card" style="animation-delay: ${i * 0.1}s">
            <div class="product-image">
                <img src="${p.images[0]}" alt="${p.name_ua}">
                <span class="product-badge">${p.subcategory}</span>
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <h3 class="product-title">${p.name_ua}</h3>
                <div class="product-price">${p.price} ${p.currency}</div>
                <div class="product-actions">
                    <button class="btn-buy" onclick="addToCart('${p.id}')">🛒 Додати</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showCart() {
    const cartEl = document.getElementById('cartItems');
    const totalEl = document.getElementById('cartTotal');
    const countEl = document.getElementById('cartCount');
    
    if (!cartEl) return;
    
    if (cart.length === 0) {
        cartEl.innerHTML = '<div class="empty-cart">🛒 Кошик порожній</div>';
        if (totalEl) totalEl.innerHTML = '';
        if (countEl) countEl.textContent = '0';
        return;
    }
    
    cartEl.innerHTML = cart.map((item, i) => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name_ua}">
            <div class="cart-item-info">
                <h4>${item.name_ua}</h4>
                <div class="cart-item-price">${item.price} ${item.currency}</div>
            </div>
            <div class="cart-item-actions">
                <button class="qty-btn" onclick="updateQty('${item.id}', -1)">−</button>
                <span>${item.quantity}</span>
                <button class="qty-btn" onclick="updateQty('${item.id}', 1)">+</button>
                <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑️</button>
            </div>
        </div>
    `).join('');
    
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    if (totalEl) totalEl.innerHTML = `<span>Разом:</span> <span class="total-amount">${total} ${cart[0].currency}</span>`;
    if (countEl) countEl.textContent = cart.reduce((sum, i) => sum + i.quantity, 0);
}

window.addToCart = function(id) {
    const p = products.find(p => p.id === id);
    if (!p) return;
    
    const item = cart.find(i => i.id === id);
    if (item) {
        item.quantity++;
    } else {
        cart.push({
            id: p.id,
            name_ua: p.name_ua,
            price: p.price,
            currency: p.currency,
            image: p.images[0],
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    showCart();
    showMessage('✅ Товар додано');
};

window.updateQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(i => i.id !== id);
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    showCart();
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    localStorage.setItem('cart', JSON.stringify(cart));
    showCart();
    showMessage('🗑️ Товар видалено');
};

function showMessage(text, type = 'success') {
    const msg = document.createElement('div');
    msg.className = 'notification';
    msg.textContent = text;
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}

function animateStats() {
    document.querySelectorAll('.stat-number').forEach(s => {
        let current = 0;
        const target = parseInt(s.dataset.target);
        const timer = setInterval(() => {
            current += target / 50;
            if (current >= target) {
                s.textContent = target;
                clearInterval(timer);
            } else {
                s.textContent = Math.floor(current);
            }
        }, 30);
    });
}
