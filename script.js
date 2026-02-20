// ========== ДАНІ ТОВАРІВ ==========
const products = [
    {
        id: "felicity-1",
        category: "Світло",
        subcategory: "АКБ",
        price: 38800,
        currency: "грн",
        name_ua: "🔋 Felicity ESS LPBF 24V 200Ah",
        description_ua: "Літієвий акумулятор Felicity ESS LPBF 24V 200Ah — надійне рішення для систем резервного живлення, сонячних електростанцій та автономних систем.",
        images: ["images/feli.jpg", "images/rw.jpg", "images/tele.jpg"]
    },
    {
        id: "must-1",
        category: "Світло",
        subcategory: "Інвертор",
        price: 54000,
        currency: "грн",
        name_ua: "⚡ Must 3.2kW 24V Інвертор",
        description_ua: "Потужний інвертор Must 3.2kW з чистою синусоїдою. Ідеальне рішення для резервного живлення будинку або офісу.",
        images: ["images/must_3_2kw_1.jpg"]
    },
    {
        id: "hybrid-1",
        category: "Світло",
        subcategory: "Гібридний",
        price: 85000,
        currency: "грн",
        name_ua: "🔄 Гібридний інвертор 5kW 48V",
        description_ua: "Гібридний інвертор з вбудованим MPPT контролером 100A. Підтримує роботу з сонячними панелями, мережею та акумуляторами.",
        images: ["images/hybrid.jpg"]
    }
];

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentTheme = localStorage.getItem('theme') || 'light';

// ========== TELEGRAM НАЛАШТУВАННЯ ==========
const TELEGRAM_TOKEN = '8537676411:AAFsfW7VwQsTubmuLqUbNhHd5IsRjfBGZtg';
const TELEGRAM_CHAT_ID = '1009593325';

// ========== ОСНОВНІ ФУНКЦІЇ ==========
document.addEventListener('DOMContentLoaded', function() {
    // Встановлюємо тему
    document.body.className = currentTheme + '-theme';
    
    // Показуємо товари
    showProducts();
    
    // Показуємо кошик
    showCart();
    
    // Статистика
    animateStats();
    
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
    document.getElementById('checkoutBtn')?.addEventListener('click', openCheckoutModal);
    
    // Закриття модального вікна товару
    document.getElementById('closeModal')?.addEventListener('click', closeProductModal);
    document.getElementById('modalOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeProductModal();
    });
    
    // Закриття модального вікна оформлення
    document.getElementById('closeCheckoutModal')?.addEventListener('click', closeCheckoutModal);
    document.getElementById('cancelCheckout')?.addEventListener('click', closeCheckoutModal);
    document.getElementById('checkoutModalOverlay')?.addEventListener('click', function(e) {
        if (e.target === this) closeCheckoutModal();
    });
    
    // Відправка форми
    document.getElementById('checkoutForm')?.addEventListener('submit', handleCheckoutSubmit);
});

function closeCart() {
    document.getElementById('cartSidebar')?.classList.remove('open');
    document.getElementById('overlay')?.classList.remove('active');
}

// ========== ВІДОБРАЖЕННЯ ТОВАРІВ ==========
function showProducts() {
    const grid = document.getElementById('catalog-grid');
    if (!grid) return;
    
    grid.innerHTML = products.map((p, i) => `
        <div class="product-card" style="animation-delay: ${i * 0.1}s" onclick="openProductModal('${p.id}')">
            <div class="product-image">
                <img src="${p.images[0]}" alt="${p.name_ua}" onerror="this.src='images/no-image.jpg'">
                <span class="product-badge">${p.subcategory}</span>
            </div>
            <div class="product-info">
                <div class="product-category">${p.category}</div>
                <h3 class="product-title">${p.name_ua}</h3>
                <div class="product-price">${p.price} ${p.currency}</div>
                <div class="product-actions">
                    <button class="btn-buy" onclick="event.stopPropagation(); addToCart('${p.id}')">🛒 Додати</button>
                </div>
            </div>
        </div>
    `).join('');
}

// ========== МОДАЛЬНЕ ВІКНО ТОВАРУ ==========
window.openProductModal = function(id) {
    const p = products.find(p => p.id === id);
    if (!p) return;
    
    const modal = document.getElementById('modalContent');
    const overlay = document.getElementById('modalOverlay');
    if (!modal || !overlay) return;
    
    // Генеруємо мініатюри
    const thumbs = p.images.map((img, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="changeImage('${img}', this)">
            <img src="${img}" onerror="this.src='images/no-image.jpg'">
        </div>
    `).join('');
    
    modal.innerHTML = `
        <div class="product-detail">
            <div class="product-gallery">
                <div class="main-image">
                    <img src="${p.images[0]}" alt="${p.name_ua}" id="mainImage" onerror="this.src='images/no-image.jpg'">
                </div>
                <div class="image-thumbnails">
                    ${thumbs}
                </div>
            </div>
            <div class="product-info-detail">
                <h2>${p.name_ua}</h2>
                <div class="product-meta">
                    <span class="product-category-detail">${p.category}</span>
                    <span class="product-category-detail">${p.subcategory}</span>
                </div>
                <div class="product-price-detail">${p.price} ${p.currency}</div>
                <p class="product-description">${p.description_ua}</p>
                <div class="product-actions-detail">
                    <button class="btn btn-primary" onclick="addToCart('${p.id}')">🛒 Додати в кошик</button>
                </div>
            </div>
        </div>
    `;
    
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Зміна зображення
window.changeImage = function(src, element) {
    document.getElementById('mainImage').src = src;
    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
    element.classList.add('active');
};

function closeProductModal() {
    document.getElementById('modalOverlay')?.classList.remove('active');
    document.body.style.overflow = '';
}

// ========== КОШИК ==========
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
            <img src="${item.image}" alt="${item.name_ua}" onerror="this.src='images/no-image.jpg'">
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

// ========== МОДАЛЬНЕ ВІКНО ОФОРМЛЕННЯ ==========
function openCheckoutModal() {
    if (cart.length === 0) {
        showMessage('🛒 Кошик порожній', 'error');
        return;
    }
    
    // Показуємо товари в модальному вікні
    const itemsEl = document.getElementById('checkoutCartItems');
    const totalEl = document.getElementById('checkoutTotal');
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    itemsEl.innerHTML = cart.map(item => `
        <div class="checkout-cart-item">
            <div class="checkout-item-info">
                <div class="checkout-item-name">${item.name_ua}</div>
                <div class="checkout-item-details">${item.quantity} x ${item.price} ${item.currency}</div>
            </div>
            <div class="checkout-item-price">${item.price * item.quantity} ${item.currency}</div>
        </div>
    `).join('');
    
    totalEl.innerHTML = `<span>${total} ${cart[0].currency}</span>`;
    
    document.getElementById('checkoutModalOverlay').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeCheckoutModal() {
    document.getElementById('checkoutModalOverlay').classList.remove('active');
    document.body.style.overflow = '';
}

// ========== ВІДПРАВКА ЗАМОВЛЕННЯ В TELEGRAM ==========
async function sendToTelegram(message) {
    try {
        const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'HTML'
            })
        });
        const data = await response.json();
        return data.ok;
    } catch (error) {
        console.error('Telegram error:', error);
        return false;
    }
}

function formatOrderMessage(cart, customer) {
    const date = new Date().toLocaleString('uk-UA', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    
    const total = cart.reduce((sum, i) => sum + (i.price * i.quantity), 0);
    
    let message = `🛍 <b>НОВЕ ЗАМОВЛЕННЯ!</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `📅 <b>Час:</b> ${date}\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    
    message += `👤 <b>ДАНІ КЛІЄНТА:</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `📋 <b>ПІБ:</b> ${customer.lastName} ${customer.firstName} ${customer.middleName || ''}\n`;
    message += `📱 <b>Телефон:</b> ${customer.phone}\n`;
    message += `📍 <b>Місто:</b> ${customer.city}\n`;
    if (customer.address) message += `🏠 <b>Адреса:</b> ${customer.address}\n`;
    if (customer.comment) message += `💬 <b>Коментар:</b> ${customer.comment}\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    
    message += `📦 <b>ТОВАРИ:</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    
    cart.forEach((item, i) => {
        message += `<b>${i+1}. ${item.name_ua}</b>\n`;
        message += `   📦 Кількість: ${item.quantity}\n`;
        message += `   💰 Ціна: ${item.price} ${item.currency}\n`;
        message += `   💵 Сума: ${item.price * item.quantity} ${item.currency}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `<b>💰 РАЗОМ: ${total} ${cart[0].currency}</b>\n`;
    
    return message;
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    const customer = {
        lastName: document.getElementById('lastName').value.trim(),
        firstName: document.getElementById('firstName').value.trim(),
        middleName: document.getElementById('middleName').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        city: document.getElementById('city').value.trim(),
        address: document.getElementById('address').value.trim(),
        comment: document.getElementById('comment').value.trim()
    };
    
    if (!customer.lastName || !customer.firstName || !customer.phone || !customer.city) {
        showMessage('❌ Заповніть всі обов\'язкові поля', 'error');
        return;
    }
    
    const message = formatOrderMessage(cart, customer);
    showMessage('📤 Відправка...');
    
    const sent = await sendToTelegram(message);
    
    if (sent) {
        showMessage('✅ Замовлення відправлено!');
        cart = [];
        localStorage.setItem('cart', JSON.stringify(cart));
        showCart();
        closeCheckoutModal();
        e.target.reset();
    } else {
        showMessage('❌ Помилка відправки', 'error');
    }
}

// ========== СТАТИСТИКА ==========
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

// ========== СПОВІЩЕННЯ ==========
function showMessage(text, type = 'success') {
    const msg = document.createElement('div');
    msg.className = 'notification';
    msg.textContent = text;
    msg.style.background = type === 'success' ? 'var(--gradient-1)' : '#ff4444';
    document.body.appendChild(msg);
    setTimeout(() => msg.remove(), 2000);
}
