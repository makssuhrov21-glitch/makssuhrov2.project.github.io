// Глобальні змінні
let products = [];
let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let currentFilter = 'all';
let currentLanguage = 'uk';
let currentTheme = localStorage.getItem('theme') || 'light';

const VIBER_NUMBER = '+380995371400';

// DOM елементи
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

// Встановлення теми
function setTheme(theme) {
  currentTheme = theme;
  localStorage.setItem('theme', theme);
  document.body.className = theme + '-theme';
}

// Перемикання теми
function toggleTheme() {
  if (currentTheme === 'light') {
    setTheme('dark');
  } else {
    setTheme('light');
  }
}

// Завантаження товарів
async function loadProducts() {
  try {
    const response = await fetch('data/products.json');
    products = await response.json();
    filterProducts('all');
    animateStats();
  } catch (error) {
    console.error('Помилка завантаження:', error);
    showNotification('Помилка завантаження товарів', 'error');
  }
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
  
  // Оновлюємо активний таб
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
  
  catalogGrid.innerHTML = productsToRender.map((product, index) => {
    const imageUrl = product.images?.[0] || 'images/no-image.jpg';
    const price = product.price > 0 
      ? `${product.price.toLocaleString()} ${product.currency}`
      : 'Ціна за запитом';
    
    return `
      <div class="product-card" style="animation-delay: ${index * 0.1}s" onclick="openProductModal('${product.id}')">
        <div class="product-image">
          <img src="${imageUrl}" alt="${product.name_ua}" loading="lazy">
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
  
  // Ініціалізуємо 3D ефект для нових карток
  setTimeout(init3DCards, 100);
}

// Відкриття модального вікна з товаром
function openProductModal(productId) {
  const product = products.find(p => p.id === productId);
  if (!product) return;
  
  const imageUrl = product.images?.[0] || 'images/no-image.jpg';
  const price = product.price > 0 
    ? `${product.price.toLocaleString()} ${product.currency}`
    : 'Ціна за запитом';
  
  // Генеруємо HTML для характеристик
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
  
  // Генеруємо HTML для переваг
  const benefitsHTML = product.benefits ? `
    <ul class="benefits-list">
      ${product.benefits.ua.map(benefit => `
        <li>${benefit}</li>
      `).join('')}
    </ul>
  ` : '';
  
  // Генеруємо мініатюри зображень
  const thumbnailsHTML = product.images?.map((img, index) => `
    <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="event.stopPropagation(); changeMainImage(this, '${img}')">
      <img src="${img}" alt="${product.name_ua}">
    </div>
  `).join('') || '';
  
  modalContent.innerHTML = `
    <div class="product-detail">
      <div class="product-gallery">
        <div class="main-image" onclick="zoomImage(this)">
          <img src="${imageUrl}" alt="${product.name_ua}" id="mainImage">
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
  document.getElementById('mainImage').src = imageUrl;
  
  // Оновлюємо активний клас
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
  
  // Анімація кнопки
  if (event && event.target) {
    const btn = event.target;
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
      btn.style.transform = '';
    }, 200);
  }
  
  // Оновлюємо лічильник
  updateCartCount();
}

// Оновлення лічильника
function updateCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  cartCount.textContent = count;
  cartCount.style.animation = 'bounce 0.5s ease';
  setTimeout(() => {
    cartCount.style.animation = '';
  }, 500);
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
    cartTotal.innerHTML = '';
    if (checkoutBtn) checkoutBtn.style.display = 'none';
    return;
  }
  
  if (checkoutBtn) checkoutBtn.style.display = 'block';
  
  cartItems.innerHTML = cart.map((item, index) => {
    const itemTotal = item.price * item.quantity;
    
    return `
      <div class="cart-item" style="animation-delay: ${index * 0.1}s">
        <img src="${item.image}" alt="${item.name_ua}">
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
  cartTotal.innerHTML = `
    <span>Разом:</span>
    <span class="total-amount">${total.toLocaleString()} ${cart[0].currency}</span>
  `;
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
    
    // Анімація кнопки
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
  
  // Анімація видалення
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
  cartSidebar.classList.add('open');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// Закриття кошика
function closeCartSidebar() {
  cartSidebar.classList.remove('open');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

// Оформлення замовлення
function checkout() {
  if (cart.length === 0) return;
  
  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  let message = '🛒 *Замовлення Winner Znamyanka*\n\n';
  
  cart.forEach(item => {
    message += `• ${item.name_ua}\n`;
    message += `  ${item.quantity} x ${item.price} ${item.currency} = ${item.price * item.quantity} ${item.currency}\n\n`;
  });
  
  message += `📊 *Разом: ${total.toLocaleString()} ${cart[0].currency}*`;
  
  // Відкриваємо Viber
  window.open(`viber://forward?text=${encodeURIComponent(message)}`, '_blank');
  
  showNotification('📋 Повідомлення готове до відправки');
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
    background: var(--gradient-1);
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
    notification.style.animation = 'slideOutRight 0.3s ease-out';
    setTimeout(() => notification.remove(), 300);
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
  // Встановлюємо тему
  setTheme(currentTheme);
  
  loadProducts();
  renderCart();
  updateCartCount();
  parallaxEffect();
  
  // Обробник перемикання теми
  themeToggle?.addEventListener('click', toggleTheme);
  
  // Обробники фільтрів
  document.querySelectorAll('[data-filter]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const filter = e.target.closest('[data-filter]').dataset.filter;
      filterProducts(filter);
    });
  });
  
  // Обробники кошика
  cartToggle?.addEventListener('click', openCart);
  closeCart?.addEventListener('click', closeCartSidebar);
  overlay?.addEventListener('click', closeCartSidebar);
  
  // Обробник оформлення
  checkoutBtn?.addEventListener('click', checkout);
  
  // Обробники мови
  document.getElementById('lang-uk')?.addEventListener('click', () => setLanguage('uk'));
  document.getElementById('lang-en')?.addEventListener('click', () => setLanguage('en'));
  
  // Обробники модального вікна
  closeModal?.addEventListener('click', closeProductModal);
  modalOverlay?.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeProductModal();
    }
  });
  
  // Плавний скрол
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });
});

// Експорт функцій
window.openProductModal = openProductModal;
window.addToCart = addToCart;
window.updateQuantity = updateQuantity;
window.removeFromCart = removeFromCart;
window.changeMainImage = changeMainImage;
window.zoomImage = zoomImage;
window.sendToViber = sendToViber;
