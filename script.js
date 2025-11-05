// Global language
let language = localStorage.getItem('site_lang') || 'uk';
const VIBER_NUMBER = '+380995371400'; // TODO: set your number

const catalogGrid = document.getElementById('catalog-grid');
const cartEl = document.getElementById('cart');
const cartTotalsEl = document.getElementById('cart-totals');
const checkoutBtn = document.getElementById('checkout-btn');

// lang buttons
const btnUk = document.getElementById('lang-uk');
const btnEn = document.getElementById('lang-en');
if(btnUk) btnUk.addEventListener('click', ()=> setLanguage('uk'));
if(btnEn) btnEn.addEventListener('click', ()=> setLanguage('en'));

// open submenu on mobile tap
document.querySelectorAll('.menu .has-sub > a').forEach(a=>{
  a.addEventListener('click', (e)=>{
    if (window.matchMedia('(hover: none)').matches) {
      e.preventDefault();
      a.parentElement.classList.toggle('tap');
    }
  });
});

// CTA and icon buttons
document.addEventListener('click', (e)=>{
  const b = e.target.closest('[data-go]');
  if(b && b.getAttribute('data-go')==='moto'){
    e.preventDefault();
    window.location.href = 'moto.html';
  }
  const f = e.target.closest('[data-filter]');
  if(f && (f.tagName==='A' || f.tagName==='BUTTON')){
    e.preventDefault();
    applyFilter(f.getAttribute('data-filter'));
    const el = document.getElementById('catalog');
    if (el) el.scrollIntoView({behavior:'smooth'});
  }
});

let cart = JSON.parse(localStorage.getItem('cart') || '[]');
let PRODUCTS = [];
window.PRODUCTS = PRODUCTS; // reference

function setLanguage(lang){
  language = lang;
  localStorage.setItem('site_lang', lang);
  document.querySelectorAll('[data-lang-uk]').forEach(el=>{
    const txt = el.getAttribute('data-lang-' + language);
    if(txt) el.textContent = txt;
  });
}
function escapeHtml(s=''){return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')}

async function loadProducts(){
  try{
    const res = await fetch('data/products.json', {cache:'no-store'});
    PRODUCTS = await res.json();
    window.PRODUCTS = PRODUCTS;
  }catch(e){ console.error('Cannot load products.json', e); }
}

function displayProducts(products){
  const grid = document.getElementById('catalog-grid');
  if(!grid) return;
  grid.innerHTML = '';
  products.forEach(p=>{
    const cover = (Array.isArray(p.images) && p.images[0]) || p.image || 'images/no-image.jpg';
    const priceStr = (p.price && p.price > 0) ? `${p.price} ${p.currency || 'грн'}` : (language==='uk' ? 'Уточнюйте' : 'Ask for price');
    const catBadge = `<div style="font-size:12px;color:#666;margin-bottom:6px">${p.category||''}${p.subcategory? ' • '+p.subcategory:''}</div>`;
    const card = document.createElement('div');
    card.className='card';
    card.innerHTML = `
      <div class="img"><img src="${cover}" alt="${escapeHtml(p.name_ua)}"></div>
      <div class="body">
        ${catBadge}
        <h3 data-lang-uk="${escapeHtml(p.name_ua)}" data-lang-en="${escapeHtml(p.name_en)}">${escapeHtml(p.name_ua)}</h3>
        <div class="price">${priceStr}</div>
        <div class="actions">
          <a class="btn btn-dark" href="product.html?id=${encodeURIComponent(p.id)}" target="_blank"
             data-lang-uk="Переглянути" data-lang-en="View">Переглянути</a>
          <button class="btn btn-primary" data-id="${p.id}" data-action="add"
             data-lang-uk="Купити" data-lang-en="Buy">Купити</button>
        </div>
      </div>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('[data-action="add"]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      addToCart(btn.getAttribute('data-id'));
      alert(language==='uk' ? '✅ Додано в корзину' : '✅ Added to cart');
    });
  });
}

function addToCart(id){
  id = String(id);
  const p = PRODUCTS.find(x=> String(x.id)===id);
  if(!p) return;
  const exist = cart.find(i=> String(i.id)===id);
  if(exist) exist.quantity++;
  else cart.push({id:p.id, name_ua:p.name_ua, name_en:p.name_en, price:p.price, currency:p.currency||'грн', image:(p.images && p.images[0]) || p.image || 'images/no-image.jpg', quantity:1});
  localStorage.setItem('cart', JSON.stringify(cart));
  renderCart();
}
function renderCart(){
  if(!cartEl) return;
  if(!cart.length){
    cartEl.innerHTML = '<p style="padding:8px">'+(language==='uk'?'Порожня корзина':'Cart is empty')+'</p>';
    if(checkoutBtn) checkoutBtn.style.display='none';
    if(cartTotalsEl) cartTotalsEl.innerHTML='';
    return;
  }
  if(checkoutBtn) checkoutBtn.style.display='inline-block';
  cartEl.innerHTML = cart.map(i=>`
    <div class="cart-item">
      <div style="display:flex;align-items:center;gap:10px">
        <img src="${i.image}" alt="${escapeHtml(i.name_ua)}" style="width:64px;height:48px;object-fit:cover;border-radius:8px">
        <div>
          <div>${escapeHtml(language==='uk'?i.name_ua:i.name_en)}</div>
          <div class="qty">${language==='uk'?'Кількість':'Qty'}: <b>${i.quantity}</b></div>
        </div>
      </div>
      <div>
        <div>${i.price * i.quantity} ${i.currency}</div>
        <div style="margin-top:6px;display:flex;gap:6px;justify-content:flex-end">
          <button onclick="changeQty('${i.id}',-1)">-</button>
          <button onclick="changeQty('${i.id}',1)">+</button>
          <button onclick="removeFromCart('${i.id}')">×</button>
        </div>
      </div>
    </div>
  `).join('');
  if(cartTotalsEl){
    const total = cart.reduce((s,i)=> s + i.price*i.quantity, 0);
    cartTotalsEl.innerHTML = '<div style="padding:8px">'+(language==='uk'?'Разом: ':'Total: ')+ '<b>'+ total + '</b> ' + (cart[0]?.currency||'грн') + '</div>';
  }
}
function changeQty(id,d){const it = cart.find(i=> String(i.id)===String(id)); if(!it) return; it.quantity += d; if(it.quantity<1) it.quantity=1; localStorage.setItem('cart', JSON.stringify(cart)); renderCart();}
function removeFromCart(id){cart = cart.filter(i=> String(i.id)!==String(id)); localStorage.setItem('cart', JSON.stringify(cart)); renderCart();}

if(checkoutBtn){
  checkoutBtn.addEventListener('click', ()=>{
    if(!cart.length) return;
    const total = cart.reduce((s,i)=> s + i.price*i.quantity, 0);
    let txt = (language==='uk'?'Замовлення:':'Order:')+'%0A';
    cart.forEach(i=>{ const name=(language==='uk'?i.name_ua:i.name_en); txt += `${name} x${i.quantity} — ${i.price*i.quantity} ${i.currency}%0A`; });
    txt += (language==='uk'?`Разом: ${total} ${cart[0].currency}`:`Total: ${total} ${cart[0].currency}`);
    const viberLink = `viber://chat?number=${encodeURIComponent(VIBER_NUMBER)}`;
    window.location.href = viberLink;
    setTimeout(()=>{ window.location.href = `viber://forward?text=${txt}`; }, 600);
  });
}

// Filters
function applyFilter(filterCat=null, subcat=null){
  if(!PRODUCTS.length) return;
  let list = [...PRODUCTS];
  if(filterCat) list = list.filter(p => (p.category||'').toLowerCase().includes(filterCat.toLowerCase()));
  if(subcat) list = list.filter(p => (p.subcategory||'').toLowerCase() === subcat.toLowerCase());
  displayProducts(list);
  setLanguage(language);
}

// Parse hash to filter (#cat=...&sub=...)
function filterFromHash(){
  const h = (location.hash||'').replace('#','');
  if(!h) return;
  const params = new URLSearchParams(h);
  const cat = params.get('cat');
  const sub = params.get('sub');
  if(cat || sub){ applyFilter(cat, sub); const el=document.getElementById('catalog'); if(el) el.scrollIntoView(); }
}

// Product page
async function initProductPage(){
  if(!PRODUCTS.length) await loadProducts();
  const params = new URLSearchParams(location.search);
  const id = params.get('id');
  const p = PRODUCTS.find(x=> String(x.id)===String(id));
  const view = document.getElementById('product-view');
  if(!view) return;
  if(!p){ view.innerHTML='<p>'+(language==='uk'?'Товар не знайдено':'Product not found')+'</p>'; return; }

  const imgs = Array.isArray(p.images)&&p.images.length ? p.images : [p.image || 'images/no-image.jpg'];
  const priceStr = (p.price && p.price>0) ? `${p.price} ${p.currency||'грн'}` : (language==='uk'?'Уточнюйте':'Ask for price');

  view.innerHTML = `
    <div class="p-gallery">
      <div class="carousel" id="carousel">
        <img src="${imgs[0]}" alt="${escapeHtml(p.name_ua)}" id="car-img">
        <button class="car-nav car-prev" id="car-prev">‹</button>
        <button class="car-nav car-next" id="car-next">›</button>
      </div>
    </div>
    <div class="p-info">
      <h1 data-lang-uk="${escapeHtml(p.name_ua)}" data-lang-en="${escapeHtml(p.name_en)}">${escapeHtml(p.name_ua)}</h1>
      <div class="price">${priceStr}</div>
      <p class="desc" data-lang-uk="${escapeHtml(p.description_ua||'')}" data-lang-en="${escapeHtml(p.description_en||'')}">
        ${escapeHtml(p.description_ua||'')}
      </p>
      ${p.specs ? renderSpecsTable(p.specs) : ''}
      ${p.benefits ? renderBenefits(p.benefits) : ''}
      <div class="p-buttons" style="margin-top:12px">
        <button class="btn btn-primary" id="btn-buy" data-lang-uk="Купити" data-lang-en="Buy">Купити</button>
        <a class="btn btn-dark link" id="btn-viber" href="#" data-lang-uk="Написати у Viber" data-lang-en="Message on Viber">Написати у Viber</a>
      </div>
    </div>
  `;

  let idx=0; const carImg=document.getElementById('car-img');
  document.getElementById('car-prev').addEventListener('click', ()=>{ idx=(idx-1+imgs.length)%imgs.length; carImg.src=imgs[idx]; });
  document.getElementById('car-next').addEventListener('click', ()=>{ idx=(idx+1)%imgs.length; carImg.src=imgs[idx]; });
  let startX=0;
  document.getElementById('carousel').addEventListener('touchstart',(e)=>{ startX=e.touches[0].clientX; });
  document.getElementById('carousel').addEventListener('touchend',(e)=>{ const dx=e.changedTouches[0].clientX-startX; if(Math.abs(dx)>40){ if(dx<0){idx=(idx+1)%imgs.length}else{idx=(idx-1+imgs.length)%imgs.length} carImg.src=imgs[idx]; } });

  document.getElementById('btn-buy').addEventListener('click', ()=>{ addToCart(p.id); alert(language==='uk'?'✅ Додано в корзину':'✅ Added to cart'); });
  const msg = encodeURIComponent((language==='uk'?'Добрий день! Хочу купити товар: ':'Hello! I want to buy: ') + (language==='uk'?p.name_ua:p.name_en));
  const viberLink = `viber://chat?number=${encodeURIComponent(VIBER_NUMBER)}`;
  document.getElementById('btn-viber').setAttribute('href', viberLink);
  document.getElementById('btn-viber').addEventListener('click', ()=>{ setTimeout(()=>{ window.location.href=`viber://forward?text=${msg}`; }, 500); });

  setLanguage(language);

  function renderSpecsTable(specs){
    const rows = (language==='uk' ? specs.ua : specs.en) || specs.ua || [];
    if(!rows.length) return '';
    const trs = rows.map(r=>`<tr><td>${escapeHtml(r[0])}</td><td>${escapeHtml(r[1])}</td></tr>`).join('');
    return `<table class="specs-table">${trs}</table>`;
  }
  function renderBenefits(benef){
    const list = (language==='uk' ? benef.ua : benef.en) || benef.ua || [];
    if(!list.length) return '';
    return `<ul class="benefits">${list.map(x=>`<li>${escapeHtml(x)}</li>`).join('')}</ul>`;
  }
}

async function start(){
  await loadProducts();
  if(catalogGrid){
    // hash filter support
    filterFromHash();
    if(!location.hash) displayProducts(PRODUCTS);
  }
  renderCart();
  setLanguage(language);
  if(window.__PRODUCT_PAGE__){ initProductPage(); }
}
start();
