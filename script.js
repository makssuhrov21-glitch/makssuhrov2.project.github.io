let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentFilter = 'all';
let currentTheme = localStorage.getItem('theme') || 'light';

const VIBER_NUMBER = '+380995371400';
const TELEGRAM_TOKEN = '8537676411:AAFsfW7VwQsTubmuLqUbNhHd5IsRjfBGZtg'; 
const TELEGRAM_CHAT_ID = '1009593325';

// ТЕСТОВІ ТОВАРИ - будуть показані одразу
const TEST_PRODUCTS = [
    {
        id: "felicity-1",
        category: "Світло",
        subcategory: "АКБ",
        price: 38800,
        currency: "грн",
        name_ua: "🔋 Felicity ESS LPBF 24V 200Ah",
        name_en: "Felicity ESS LPBF 24V 200Ah",
        description_ua: "Літієвий акумулятор Felicity ESS LPBF 24V 200Ah",
        images: ["images/no-image.jpg"],
        specs: {
            ua: [
                ["Тип", "LiFePO4"],
                ["Напруга", "24V"],
                ["Ємність", "200Ah"]
            ]
        }
    },
    {
        id: "must-1",
        category: "Світло",
        subcategory: "Інвертор",
        price: 54000,
        currency: "грн",
        name_ua: "⚡ Must 3.2kW 24V Інвертор",
        name_en: "Must 3.2kW 24V Inverter",
        description_ua: "Потужний інвертор Must 3.2kW з чистою синусоїдою",
        images: ["images/no-image.jpg"],
        specs: {
            ua: [
                ["Потужність", "3.2 кВт"],
                ["Напруга", "24V"],
                ["Тип", "Чиста синусоїда"]
            ]
        }
    },
    {
        id: "hybrid-1",
        category: "Світло",
        subcategory: "Гібридний",
        price: 85000,
        currency: "грн",
        name_ua: "🔄 Гібридний інвертор 5kW 48V",
        name_en: "Hybrid Inverter 5kW 48V",
        description_ua: "Гібридний інвертор з MPPT контролером",
        images: ["images/no-image.jpg"],
        specs: {
            ua: [
                ["Потужність", "5 кВт"],
                ["Напруга", "48V"],
                ["MPPT", "100A"]
            ]
        }
    },
    {
        id: "volts-1",
        category: "Світло",
        subcategory: "АКБ",
        price: 12500,
        currency: "грн",
        name_ua: "🔋 Volts AGM 12V 100Ah",
        name_en: "Volts AGM 12V 100Ah",
        description_ua: "AGM акумулятор Volts 12V 100Ah",
        images: ["images/no-image.jpg"],
        specs: {
            ua: [
                ["Тип", "AGM"],
                ["Напруга", "12V"],
                ["Ємність", "100Ah"]
            ]
        }
    }
];

// Отримуємо всі елементи після завантаження DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Сайт завантажено');
    
    // Отримуємо елементи
    const catalogGrid = document.getElementById('catalog-grid');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    const cartCount = document.getElementById('cartCount');
    const checkoutBtn = document.getElementById('checkoutBtn');
    const overlay = document.getElementById('overlay');
    const cartToggle = document.getElementById('cartToggle');
    const closeCart = document.getElementById('closeCart');
    const modalOverlay = document.getElementById('modalOverlay');
    const modalContent = document.getElementById('modalContent');
    const closeModal = document.getElementById('closeModal');
    const themeToggle = document.getElementById('themeToggle');
    const checkoutModalOverlay = document.getElementById('checkoutModalOverlay');
    const closeCheckoutModal = document.getElementById('closeCheckoutModal');
    const cancelCheckout = document.getElementById('cancelCheckout');
    const checkoutForm = document.getElementById('checkoutForm');
    const checkoutCartItems = document.getElementById('checkoutCartItems');
    const checkoutTotal = document.getElementById('checkoutTotal');

    // Встановлюємо тему
    setTheme(currentTheme);

    // Відразу показуємо тестові товари
    products = TEST_PRODUCTS;
    renderProducts(products);
    animateStats();

    // Потім пробуємо завантажити з файлу
    loadProducts();

    // Відображаємо кошик
    renderCart();
    updateCartCount();

    // Додаємо обробники подій
    if (themeToggle) themeToggle.addEventListener('click', toggleTheme);
    if (cartToggle) cartToggle.addEventListener('click', openCart);
    if (closeCart) closeCart.addEventListener('click', closeCartSidebar);
    if (overlay) overlay.addEventListener('click', closeCartSidebar);
    if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckoutModal);
    if (closeModal) closeModal.addEventListener('click', closeProductModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeProductModal();
        });
    }
    
    // Обробники для модального вікна оформлення
    if (closeCheckoutModal) closeCheckoutModal.addEventListener('click', closeCheckoutModalFunc);
    if (cancelCheckout) cancelCheckout.addEventListener('click', closeCheckoutModalFunc);
    if (checkoutModalOverlay) {
        checkoutModalOverlay.addEventListener('click', (e) => {
            if (e.target === checkoutModalOverlay) closeCheckoutModalFunc();
        });
    }
    if (checkoutForm) checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    // Обробники фільтрів
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = e.target.closest('[data-filter]').dataset.filter;
            filterProducts(filter);
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Функції теми
    function setTheme(theme) {
        currentTheme = theme;
        localStorage.setItem('theme', theme);
        document.body.className = theme + '-theme';
    }

    function toggleTheme() {
        setTheme(currentTheme === 'light' ? 'dark' : 'light');
        showNotification('Тему змінено');
    }

    // Завантаження товарів
    async function loadProducts() {
        try {
            const timestamp = new Date().getTime();
            const response = await fetch(`data/products.json?t=${timestamp}`, {
                cache: 'no-store'
            });
            
            if (!response.ok) {
                console.log('Файл не знайдено, використовую тестові товари');
                return;
            }
            
            const loadedProducts = await response.json();
            if (loadedProducts && loadedProducts.length > 0) {
                products = loadedProducts;
                renderProducts(products);
                console.log('✅ Завантажено товари з файлу:', products.length);
            }
        } catch (error) {
            console.log('Помилка завантаження, використовую тестові товари');
        }
    }

    // Telegram
    async function sendTelegramMessage(cart, customerData) {
        try {
            const date = new Date().toLocaleString('uk-UA', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });
            
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            let message = `🛍 <b>НОВЕ ЗАМОВЛЕННЯ!</b>\n`;
            message += `━━━━━━━━━━━━━━━━\n`;
            message += `📅 <b>Час:</b> ${date}\n━━━━━━━━━━━━━━━━\n\n`;
            message += `👤 <b>ДАНІ КЛІЄНТА:</b>\n━━━━━━━━━━━━━━━━\n`;
            message += `📋 <b>ПІБ:</b> ${customerData.lastName} ${customerData.firstName} ${customerData.middleName || ''}\n`;
            message += `📱 <b>Телефон:</b> ${customerData.phone}\n`;
            message += `📍 <b>Місто/Область:</b> ${customerData.city}\n`;
            if (customerData.address) message += `🏠 <b>Адреса:</b> ${customerData.address}\n`;
            if (customerData.comment) message += `💬 <b>Коментар:</b> ${customerData.comment}\n`;
            message += `━━━━━━━━━━━━━━━━\n\n📦 <b>ТОВАРИ:</b>\n━━━━━━━━━━━━━━━━\n`;
            
            cart.forEach((item, index) => {
                message += `<b>${index + 1}. ${item.name_ua}</b>\n`;
                message += `   📦 Кількість: ${item.quantity}\n`;
                message += `   💰 Ціна: ${item.price} ${item.currency}\n`;
                message += `   💵 Сума: ${item.price * item.quantity} ${item.currency}\n\n`;
            });
            
            message += `━━━━━━━━━━━━━━━━\n`;
            message += `<b>💰 ЗАГАЛОМ: ${total} ${cart[0]?.currency || 'грн'}</b>\n\n`;
            message += `📱 <b>Viber:</b> ${VIBER_NUMBER}`;
            
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
            console.error('Помилка Telegram:', error);
            return false;
        }
    }

    // Кошик
    window.addToCart = function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({
                id: product.id,
                name_ua: product.name_ua,
                name_en: product.name_en,
                price: product.price,
                currency: product.currency,
                image: product.images?.[0] || 'images/no-image.jpg',
                quantity: 1
            });
        }
        
        saveCart();
        showNotification('✅ Товар додано до кошика');
    };

    window.updateQuantity = function(productId, delta) {
        const item = cart.find(i => i.id === productId);
        if (!item) return;
        
        item.quantity += delta;
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            saveCart();
        }
    };

    window.removeFromCart = function(productId) {
        cart = cart.filter(i => i.id !== productId);
        saveCart();
        showNotification('🗑️ Товар видалено з кошика');
    };

    function updateCartCount() {
        if (cartCount) {
            const count = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = count;
            cartCount.style.animation = 'bounce 0.5s ease';
            setTimeout(() => cartCount.style.animation = '', 500);
        }
    }

    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCart();
        updateCartCount();
    }

    function renderCart() {
        if (!cartItems) return;
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<div class="empty-cart">🛒 Кошик порожній</div>';
            if (cartTotal) cartTotal.innerHTML = '';
            return;
        }
        
        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item" style="animation-delay: ${index * 0.1}s">
                <img src="${item.image}" alt="${item.name_ua}" onerror="this.src='images/no-image.jpg'">
                <div class="cart-item-info">
                    <h4>${item.name_ua}</h4>
                    <div class="cart-item-price">${item.price} ${item.currency}</div>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', -1)">−</button>
                    <span>${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity('${item.id}', 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">🗑️</button>
                </div>
            </div>
        `).join('');
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (cartTotal) {
            cartTotal.innerHTML = `<span>Разом:</span> <span class="total-amount">${total.toLocaleString()} ${cart[0]?.currency || 'грн'}</span>`;
        }
    }

    function openCart() {
        cartSidebar?.classList.add('open');
        overlay?.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeCartSidebar() {
        cartSidebar?.classList.remove('open');
        overlay?.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Оформлення замовлення
    function openCheckoutModal() {
        if (cart.length === 0) {
            showNotification('🛒 Кошик порожній', 'error');
            return;
        }
        
        renderCheckoutCart();
        if (checkoutModalOverlay) {
            checkoutModalOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function closeCheckoutModalFunc() {
        if (checkoutModalOverlay) {
            checkoutModalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    function renderCheckoutCart() {
        if (!checkoutCartItems) return;
        
        const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        checkoutCartItems.innerHTML = cart.map(item => `
            <div class="checkout-cart-item">
                <div class="checkout-item-info">
                    <div class="checkout-item-name">${item.name_ua}</div>
                    <div class="checkout-item-details">${item.quantity} x ${item.price} ${item.currency}</div>
                </div>
                <div class="checkout-item-price">${item.price * item.quantity} ${item.currency}</div>
            </div>
        `).join('');
        
        if (checkoutTotal) {
            checkoutTotal.innerHTML = `<span>${total.toLocaleString()} ${cart[0]?.currency || 'грн'}</span>`;
        }
    }

    async function handleCheckoutSubmit(e) {
        e.preventDefault();
        
        const customerData = {
            lastName: document.getElementById('lastName')?.value.trim(),
            firstName: document.getElementById('firstName')?.value.trim(),
            middleName: document.getElementById('middleName')?.value.trim(),
            phone: document.getElementById('phone')?.value.trim(),
            city: document.getElementById('city')?.value.trim(),
            address: document.getElementById('address')?.value.trim(),
            comment: document.getElementById('comment')?.value.trim()
        };
        
        if (!customerData.lastName || !customerData.firstName || !customerData.phone || !customerData.city) {
            showNotification('❌ Заповніть всі обов\'язкові поля', 'error');
            return;
        }
        
        showNotification('📤 Відправка замовлення...');
        const sent = await sendTelegramMessage(cart, customerData);
        
        if (sent) {
            showNotification('✅ Замовлення відправлено!');
            cart = [];
            saveCart();
            closeCheckoutModalFunc();
            setTimeout(() => window.open(`viber://chat?number=${encodeURIComponent(VIBER_NUMBER)}`, '_blank'), 1000);
        } else {
            showNotification('❌ Помилка відправки. Спробуйте ще раз', 'error');
        }
    }

    // Фільтрація
    function filterProducts(filter) {
        currentFilter = filter;
        const filtered = filter === 'all' ? products : products.filter(p => p.subcategory === filter);
        renderProducts(filtered);
        
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.filter === filter);
        });
    }

    function renderProducts(productsToRender) {
        if (!catalogGrid) return;
        
        if (!productsToRender || productsToRender.length === 0) {
            catalogGrid.innerHTML = '<div class="no-products">Товари не знайдені</div>';
            return;
        }
        
        catalogGrid.innerHTML = productsToRender.map((product, index) => {
            const imageUrl = product.images?.[0] || 'images/no-image.jpg';
            const price = product.price > 0 ? `${product.price.toLocaleString()} ${product.currency}` : 'Ціна за запитом';
            
            return `
                <div class="product-card" style="animation-delay: ${index * 0.1}s" onclick="openProductModal('${product.id}')">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${product.name_ua}" loading="lazy" onerror="this.src='images/no-image.jpg'">
                        <span class="product-badge">${product.subcategory || product.category}</span>
                    </div>
                    <div class="product-info">
                        <div class="product-category">${product.category}</div>
                        <h3 class="product-title">${product.name_ua}</h3>
                        <div class="product-price">${price}</div>
                        <div class="product-actions">
                            <button class="btn-buy" onclick="event.stopPropagation(); addToCart('${product.id}')">🛒 Додати</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Модальне вікно товару
    window.openProductModal = function(productId) {
        const product = products.find(p => p.id === productId);
        if (!product) return;
        
        let specsHTML = '';
        if (product.specs && product.specs.ua) {
            specsHTML = '<table class="specs-table">';
            product.specs.ua.forEach(spec => {
                specsHTML += `<tr><td>${spec[0]}</td><td>${spec[1]}</td></tr>`;
            });
            specsHTML += '</table>';
        }
        
        if (modalContent) {
            modalContent.innerHTML = `
                <div class="product-detail">
                    <div class="product-gallery">
                        <div class="main-image">
                            <img src="${product.images?.[0] || 'images/no-image.jpg'}" alt="${product.name_ua}">
                        </div>
                    </div>
                    <div class="product-info-detail">
                        <h2>${product.name_ua}</h2>
                        <div class="product-meta">
                            <span class="product-category-detail">${product.category}</span>
                            <span class="product-category-detail">${product.subcategory || ''}</span>
                        </div>
                        <div class="product-price-detail">${product.price} ${product.currency}</div>
                        <p class="product-description">${product.description_ua || ''}</p>
                        ${specsHTML}
                        <div class="product-actions-detail">
                            <button class="btn btn-primary" onclick="addToCart('${product.id}')">🛒 Додати в кошик</button>
                        </div>
                    </div>
                </div>
            `;
            
            if (modalOverlay) {
                modalOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    };

    function closeProductModal() {
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Статистика
    function animateStats() {
        document.querySelectorAll('.stat-number').forEach(stat => {
            const target = parseInt(stat.dataset.target);
            let current = 0;
            const increment = target / 50;
            const timer = setInterval(() => {
                current += increment;
                if (current >= target) {
                    stat.textContent = target;
                    clearInterval(timer);
                } else {
                    stat.textContent = Math.floor(current);
                }
            }, 30);
        });
    }

    // Сповіщення
    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 3000);
    }
});
