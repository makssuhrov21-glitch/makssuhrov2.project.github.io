<script>
let PRODUCTS = [];
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

// --- load existing products.json
async function load() {
  try {
    const r = await fetch('data/products.json', {cache:'no-store'});
    PRODUCTS = await r.json();
  } catch (e) {
    PRODUCTS = [];
  }
  renderList();
}
function renderList() {
  const box = $('#items');
  box.innerHTML = '';
  PRODUCTS.forEach(p=>{
    const row = document.createElement('div'); row.className='row';
    row.innerHTML = `
      <div>
        <div><b>${escape(p.name_ua||'—')}</b></div>
        <div class="badge">${escape(p.category||'')} ${p.subcategory?('• '+escape(p.subcategory)) : ''}</div>
      </div>
      <div class="ops">
        <button data-id="${p.id}" data-act="edit">✏️</button>
        <button data-id="${p.id}" data-act="del">🗑️</button>
      </div>
      <div class="badge">${p.price? p.price+' '+(p.currency||'грн') : '—'}</div>
    `;
    box.appendChild(row);
  });
  box.addEventListener('click', onListClick);
}
function onListClick(e){
  const btn = e.target.closest('button'); if(!btn) return;
  const id = btn.getAttribute('data-id');
  const act = btn.getAttribute('data-act');
  const p = PRODUCTS.find(x=> String(x.id)===String(id));
  if(!p) return;
  if(act==='edit') fillForm(p);
  if(act==='del'){ if(confirm('Видалити товар?')){ PRODUCTS = PRODUCTS.filter(x=> String(x.id)!==String(id)); renderList(); } }
}

function fillForm(p){
  $('#id').value = p.id || '';
  $('#category').value = p.category || 'Мото';
  $('#subcategory').value = p.subcategory || '';
  $('#price').value = p.price || 0;
  $('#currency').value = p.currency || 'грн';
  $('#name_ua').value = p.name_ua || '';
  $('#name_en').value = p.name_en || '';
  $('#desc_ua').value = p.description_ua || '';
  $('#desc_en').value = p.description_en || '';

  const imgs = (p.images && p.images.length)? p.images : (p.image?[p.image]:[]);
  const imgInputs = $$('.images input');
  imgInputs.forEach((inp,i)=> inp.value = imgs[i] || '');
}

function readForm(){
  const id = $('#id').value.trim();
  if(!id) { alert('ID обовʼязковий'); throw new Error('no id'); }
  const images = $$('.images input').map(i=> i.value.trim()).filter(Boolean);

  return {
    id,
    category: $('#category').value,
    subcategory: $('#subcategory').value,
    price: Number($('#price').value || 0),
    currency: $('#currency').value.trim() || 'грн',
    name_ua: $('#name_ua').value.trim(),
    name_en: $('#name_en').value.trim(),
    description_ua: $('#desc_ua').value.trim(),
    description_en: $('#desc_en').value.trim(),
    images,
    specs: {
      ua: parsePairs($('#specs_ua').value),
      en: parsePairs($('#specs_en').value)
    },
    benefits: {
      ua: parseList($('#benef_ua').value),
      en: parseList($('#benef_en').value)
    }
  };
}
function parsePairs(txt){
  return txt.split('\n').map(l=>l.trim()).filter(Boolean).map(l=>{
    const i = l.indexOf(':');
    if(i<0) return [l, ''];
    return [l.slice(0,i).trim(), l.slice(i+1).trim()];
  });
}
function parseList(txt){ return txt.split('\n').map(l=>l.trim()).filter(Boolean); }
function escape(s=''){ return s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }

$('#btnAdd').addEventListener('click', ()=>{
  try{
    const p = readForm();
    const i = PRODUCTS.findIndex(x=> String(x.id)===String(p.id));
    if(i>=0) PRODUCTS[i]=p; else PRODUCTS.push(p);
    renderList();
    alert('Збережено в памʼяті сторінки. Тепер зроби Export JSON.');
  }catch(e){}
});
$('#btnNew').addEventListener('click', ()=>{
  $$('input, textarea').forEach(i=> i.value='');
  $('#currency').value='грн';
});

$('#addImg').addEventListener('click', ()=>{
  const d=document.createElement('input'); d.placeholder='images/your_file.jpg';
  $('.images').insertBefore(d, $('#addImg'));
});

$('#btnExport').addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(PRODUCTS, null, 2)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'products.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

$('#btnImport').addEventListener('click', async ()=>{
  const f = $('#importFile').files[0];
  if(!f) return alert('Обери JSON файл');
  const txt = await f.text();
  try{
    const arr = JSON.parse(txt);
    if(!Array.isArray(arr)) throw new Error('not array');
    PRODUCTS = arr;
    renderList();
    alert('Імпортовано');
  }catch(e){ alert('Формат некоректний'); }
});

load();
</script>

