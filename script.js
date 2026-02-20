let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentFilter = 'all';
let currentLanguage = localStorage.getItem('language') || 'uk';
let currentTheme = localStorage.getItem('theme') || 'light';

const VIBER_NUMBER = '+380995371400';

const TELEGRAM_TOKEN = '8537676411:AAFsfW7VwQsTubmuLqUbNhHd5IsRjfBGZtg'; 
const TELEGRAM_CHAT_ID = '8537676411'; 

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
const productModal = document.getElementById('productModal');
const modalContent = document.getElementById('modalContent');
const closeModal = document.getElementById('closeModal');
const themeToggle = document.getElementById('themeToggle');

function setTheme(theme) {
    currentTheme = theme;
    localStorage.setItem('theme', theme);
    document.body.className = theme + '-theme';
}

function toggleTheme() {
    if (currentTheme === 'light') {
        setTheme('dark');
    } else {
        setTheme('light');
    }
    showNotification('Тему змінено');
}

// Завантаження товарів з GitHub
async function loadProducts() {
    try {
        // Спочатку пробуємо завантажити з GitHub
        const githubUrl = 'https://github.com/makssuhrov21-glitch/makssuhrov2/blob/main/data/products.json';
        const timestamp = new Date().getTime();
        
        let response = await fetch(`${githubUrl}?t=${timestamp}`, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        
        if (!response.ok) {
            // Якщо GitHub не доступний, завантажуємо локально
            response = await fetch(`data/products.json?t=${timestamp}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                }
            });
        }
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        products = await response.json();
        console.log('✅ Товари завантажено:', products.length);
        filterProducts('all');
        animateStats();
        
        // Перевіряємо оновлення кожні 5 хвилин
        setTimeout(checkForUpdates, 5 * 60 * 1000);
        
    } catch (error) {
        console.error('❌ Помилка завантаження:', error);
        showNotification('Помилка завантаження товарів', 'error');
    }
}

// Перевірка оновлень на GitHub
async function checkForUpdates() {
    try {
        const githubUrl = 'https://raw.githubusercontent.com/ВАШ_ЛОГІН/НАЗВА_РЕПОЗИТОРІЮ/main/data/products.json';
        const timestamp = new Date().getTime();
        
        const response = await fetch(`${githubUrl}?t=${timestamp}`, {
            cache: 'no-store'
        });
        
        if (response.ok) {
            const newProducts = await response.json();
            
            // Перевіряємо чи змінились товари
            if (JSON.stringify(products) !== JSON.stringify(newProducts)) {
                products = newProducts;
                filterProducts(currentFilter);
                showNotification('🔄 Товари оновлено');
                console.log('🔄 Товари оновлено з GitHub');
            }
        }
    } catch (error) {
        console.log('Помилка перевірки оновлень:', error);
    }
}

// Відправка в Telegram
async function sendTelegramMessage(message) {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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

// Форматування замовлення
function formatOrderMessage(cart, total) {
    const date = new Date().toLocaleString('uk-UA', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    let message = `🛍 <b>НОВЕ ЗАМОВЛЕННЯ!</b>\n`;
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `📅 <b>Час:</b> ${date}\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
    
    cart.forEach((item, index) => {
        message += `<b>${index + 1}. ${item.name_ua}</b>\n`;
        message += `   📦 Кількість: ${item.quantity}\n`;
        message += `   💰 Ціна: ${item.price} ${item.currency}\n`;
        message += `   💵 Сума: ${item.price * item.quantity} ${item.currency}\n\n`;
    });
    
    message += `━━━━━━━━━━━━━━━━\n`;
    message += `<b>💰 ЗАГАЛОМ: ${total} ${cart[0]?.currency || 'грн'}</b>\n\n`;
    message += `📱 <b>Viber:</b> ${VIBER_NUMBER}\n`;
    
    return message;
}

// Оновлена функція оформлення замовлення
async function checkout() {
    if (cart.length === 0) return;
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    // Формуємо повідомлення
    const message = formatOrderMessage(cart, total);
    
    // Відправляємо в Telegram
    showNotification('📤 Відправка замовлення...');
    const sent = await sendTelegramMessage(message);
    
    if (sent) {
        showNotification('✅ Замовлення відправлено в Telegram');
        
        // Очищаємо кошик
        cart = [];
        saveCart();
        
        // Відкриваємо Viber через 1 секунду
        setTimeout(() => {
            window.open(`viber://chat?number=${encodeURIComponent(VIBER_NUMBER)}`, '_blank');
        }, 1000);
        
    } else {
        showNotification('❌ Помилка відправки. Спробуйте ще раз', 'error');
    }
}

// Функція додавання товару в адмінці
async function addProduct(productData) {
    try {
        // Спочатку оновлюємо локально
        const index = products.findIndex(p => p.id === productData.id);
        if (index >= 0) {
            products[index] = productData;
        } else {
            products.push(productData);
        }
        
        // Відправляємо на GitHub (потрібен API ключ)
        await syncWithGitHub(products);
        
        showNotification('✅ Товар додано та синхронізовано');
        return true;
        
    } catch (error) {
        console.error('Помилка додавання товару:', error);
        showNotification('❌ Помилка синхронізації', 'error');
        return false;
    }
}

// Синхронізація з GitHub
async function syncWithGitHub(data) {
    // Тут має бути API запит до вашого бекенду
    // Або використання GitHub API з токеном
    
    console.log('Дані готові до синхронізації:', data);
}

// Анімація статистики
function animateStats() {
    const stats = document.querySelectorAll('.stat-number');
    
    stats.forEach(stat => {
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

// Фільтрація товарів
function filterProducts(filter) {
    currentFilter = filter;
    
    let filtered = products;
    if (filter !== 'all') {
        filtered = products.filter(p => p.subcategory === filter);
    }
    
    renderProducts(filtered);
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
        const tabFilter = tab.dataset.filter;
        if (tabFilter === filter) {
            tab.classList.add('active');
        } else {
            tab.classList.remove('active');
        }
    });
}

// Рендер товарів
function renderProducts(productsToRender) {
    if (!catalogGrid) return;
    
    if (!productsToRender || productsToRender.length === 0) {
        catalogGrid.innerHTML = '<div class="no-products">Товари не знайдені</div>';
        return;
    }
    
    catalogGrid.innerHTML = productsToRender.map((product, index) => {
        const imageUrl = product.images?.[0] || 'images/no-image.jpg';
        const price = product.price > 0 
            ? `${product.price.toLocaleString()} ${product.currency}`
            : 'Ціна за запитом';
        
        return `
            <div class="product-card" style="animation-delay: ${index * 0.1}s" onclick="openProductModal('${product.id}')">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${product.name_ua}" loading="lazy" onerror="this.src='images/no-image.jpg'">
                    <span class="product-badge">${product.subcategory}</span>
                </div>
                <div class="product-info">
                    <div class="product-category">${product.category}</div>
                    <h3 class="product-title">${product.name_ua}</h3>
                    <div class="product-price">${price}</div>
                    <div class="product-actions">
                        <button class="btn-buy" onclick="event.stopPropagation(); addToCart('${product.id}')">
                            🛒 Додати
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Відкриття модального вікна
function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const imageUrl = product.images?.[0] || 'images/no-image.jpg';
    const price = product.price > 0 
        ? `${product.price.toLocaleString()} ${product.currency}`
        : 'Ціна за запитом';
    
    const specsHTML = product.specs ? `
        <table class="specs-table">
            ${product.specs.ua.map(spec => `
                <tr>
                    <td>${spec[0]}</td>
                    <td>${spec[1]}</td>
                </tr>
            `).join('')}
        </table>
    ` : '';
    
    const benefitsHTML = product.benefits ? `
        <ul class="benefits-list">
            ${product.benefits.ua.map(benefit => `
                <li>${benefit}</li>
            `).join('')}
        </ul>
    ` : '';
    
    const thumbnailsHTML = product.images?.map((img, index) => `
        <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="event.stopPropagation(); changeMainImage(this, '${img}')">
            <img src="${img}" alt="${product.name_ua}" onerror="this.src='images/no-image.jpg'">
        </div>
    `).join('') || '';
    
    modalContent.innerHTML = `
        <div class="product-detail">
            <div class="product-gallery">
                <div class="main-image" onclick="zoomImage(this)">
                    <img src="${imageUrl}" alt="${product.name_ua}" id="mainImage" onerror="this.src='images/no-image.jpg'">
                </div>
                <div class="image-thumbnails">
                    ${thumbnailsHTML}
                </div>
            </div>
            <div class="product-info-detail">
                <h2>${product.name_ua}</h2>
                <div class="product-meta">
                    <span class="product-category-detail">${product.category}</span>
                    <span class="product-category-detail">${product.subcategory}</span>
                </div>
                <div class="product-price-detail">${price}</div>
                <p class="product-description">${product.description_ua}</p>
                
                ${specsHTML}
                ${benefitsHTML}
                
                <div class="product-actions-detail">
                    <button class="btn btn-primary" onclick="addToCart('${product.id}')">
                        🛒 Додати в кошик
                    </button>
                    <button class="btn btn-viber" onclick="sendToViber('${product.id}')">
                        📱 Запитати у Viber
                    </button>
                </div>
            </div>
        </div>
    `;
    
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Зміна головного зображення
function changeMainImage(thumbnail, imageUrl) {
    const mainImage = document.getElementById('mainImage');
    if (mainImage) {
        mainImage.src = imageUrl;
    }
    
    document.querySelectorAll('.thumbnail').forEach(thumb => {
        thumb.classList.remove('active');
    });
    thumbnail.classList.add('active');
}

// Зум зображення
function zoomImage(element) {
    element.classList.toggle('zoomed');
}

// Відправка у Viber
function sendToViber(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const message = `Добрий день! Цікавить товар: ${product.name_ua}\nЦіна: ${product.price} ${product.currency}`;
    window.open(`viber://forward?text=${encodeURIComponent(message)}`, '_blank');
}

// Закриття модального вікна
function closeProductModal() {
    modalOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

// Додавання до кошика
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
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
    
    if (event && event.target) {
        const btn = event.target;
        btn.style.transform = 'scale(0.9)';
        setTimeout(() => {
            btn.style.transform = '';
        }, 200);
    }
    
    updateCartCount();
}

// Оновлення лічильника
function updateCartCount() {
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        cartCount.textContent = count;
        cartCount.style.animation = 'bounce 0.5s ease';
        setTimeout(() => {
            cartCount.style.animation = '';
        }, 500);
    }
}

// Збереження кошика
function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    renderCart();
    updateCartCount();
}

// Рендер кошика
function renderCart() {
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = '<div class="empty-cart">🛒 Кошик порожній</div>';
        if (cartTotal) cartTotal.innerHTML = '';
        if (checkoutBtn) checkoutBtn.style.display = 'none';
        return;
    }
    
    if (checkoutBtn) checkoutBtn.style.display = 'block';
    
    cartItems.innerHTML = cart.map((item, index) => {
        return `
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
        `;
    }).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (cartTotal) {
        cartTotal.innerHTML = `
            <span>Разом:</span>
            <span class="total-amount">${total.toLocaleString()} ${cart[0].currency}</span>
        `;
    }
}

// Оновлення кількості
function updateQuantity(productId, delta) {
    const item = cart.find(i => i.id === productId);
    if (!item) return;
    
    item.quantity += delta;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        
        if (event && event.target) {
            const btn = event.target;
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 200);
        }
    }
}

// Видалення з кошика
function removeFromCart(productId) {
    cart = cart.filter(i => i.id !== productId);
    saveCart();
    showNotification('🗑️ Товар видалено з кошика');
    
    if (event && event.target) {
        const item = event.target.closest('.cart-item');
        if (item) {
            item.style.animation = 'slideOut 0.3s ease-out forwards';
            setTimeout(() => {
                renderCart();
            }, 300);
        }
    }
}

// Відкриття кошика
function openCart() {
    if (cartSidebar) {
        cartSidebar.classList.add('open');
        if (overlay) overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Закриття кошика
function closeCartSidebar() {
    if (cartSidebar) {
        cartSidebar.classList.remove('open');
        if (overlay) overlay.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Показати сповіщення
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${type === 'success' ? 'var(--gradient-1)' : '#ff4444'};
        color: white;
        padding: 15px 25px;
        border-radius: 50px;
        z-index: 2000;
        animation: slideInRight 0.3s ease-out;
        font-weight: 600;
        box-shadow: var(--shadow-glow);
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Зміна мови
function setLanguage(lang) {
    currentLanguage = lang;
    localStorage.setItem('language', lang);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.id === `lang-${lang}`);
    });
    
    filterProducts(currentFilter);
}

// Паралакс ефект
function parallaxEffect() {
    const spheres = document.querySelectorAll('.sphere');
    if (spheres.length === 0) return;
    
    window.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        spheres.forEach((sphere, i) => {
            const speed = (i + 1) * 20;
            const x = (mouseX - 0.5) * speed;
            const y = (mouseY - 0.5) * speed;
            sphere.style.transform = `translate(${x}px, ${y}px)`;
        });
    });
}

// 3D ефект для карток
function init3DCards() {
    const cards = document.querySelectorAll('.product-card');
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            const rotateX = (y - centerY) / 20;
            const rotateY = (centerX - x) / 20;
            
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px) scale(1.02)`;
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// Ініціалізація
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Сайт завантажено');
    
    setTheme(currentTheme);
    loadProducts();
    renderCart();
    updateCartCount();
    parallaxEffect();
    
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    document.querySelectorAll('[data-filter]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const filter = e.target.closest('[data-filter]').dataset.filter;
            filterProducts(filter);
            document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth' });
        });
    });
    
    if (cartToggle) cartToggle.addEventListener('click', openCart);
    if (closeCart) closeCart.addEventListener('click', closeCartSidebar);
    if (overlay) overlay.addEventListener('click', closeCartSidebar);
    
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkout);
    
    const langUk = document.getElementById('lang-uk');
    const langEn = document.getElementById('lang-en');
    
    if (langUk) langUk.addEventListener('click', () => setLanguage('uk'));
    if (langEn) langEn.addEventListener('click', () => setLanguage('en'));
    
    if (closeModal) closeModal.addEventListener('click', closeProductModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeProductModal();
            }
        });
    }
    
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
    
    document.addEventListener('error', (e) => {
        if (e.target.tagName === 'IMG') {
            e.target.src = 'images/no-image.jpg';
        }
    }, true);
});

// Експорт функцій
window.openProductModal = openProductModal;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.changeMainImage = changeMainImage;
window.zoomImage = zoomImage;
window.sendToViber = sendToViber;
window.checkout = checkout;
