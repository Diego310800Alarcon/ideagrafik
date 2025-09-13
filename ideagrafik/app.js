/* app.js
   Lógica del sitio: catálogo, carrito, persistencia, checkout simulado y comportamiento AIDA.
   Comentarios en español para cada bloque importante.
*/

/* -------------------------
   Datos iniciales de productos
   ------------------------- */
/* Cada producto tiene: id, nombre, descripcion, precio (número), imagen (ruta), stock */
const PRODUCTS = [
  { id: 'p1', name: 'Franelas Personalizadas', desc: 'Franelas 100% algodón, impresión de alta calidad', price: 25.00, image: 'image/franela.jpeg', stock: 50, sizes: ['S', 'M', 'L', 'XL', 'XXL'], category: 'franelas' },
  { id: 'p2', name: 'Franelas Premium', desc: 'Franelas de algodón premium con diseños únicos', price: 28.00, image: 'image/franela2.jpeg', stock: 45, sizes: ['S', 'M', 'L', 'XL', 'XXL'], category: 'franelas' },
  { id: 'p3', name: 'Tazas Personalizadas', desc: 'Tazas cerámicas resistentes, perfectas para personalizar', price: 12.00, image: 'image/taza.jpeg', stock: 80, sizes: ['Única'], category: 'tazas' },
  { id: 'p4', name: 'Tazas de Café', desc: 'Tazas especiales para café con diseños exclusivos', price: 15.00, image: 'image/taza2.jpeg', stock: 75, sizes: ['Única'], category: 'tazas' },
  { id: 'p5', name: 'Tazas Premium', desc: 'Tazas de alta calidad con acabados especiales', price: 18.00, image: 'image/taza3.jpeg', stock: 60, sizes: ['Única'], category: 'tazas' },
  { id: 'p6', name: 'Tazas Creativas', desc: 'Tazas con diseños únicos y creativos', price: 16.00, image: 'image/taza4.jpeg', stock: 55, sizes: ['Única'], category: 'tazas' },
  { id: 'p7', name: 'Agendas Personalizadas', desc: 'Agendas con diseño personalizado y papel de calidad', price: 20.00, image: 'image/agenda.jpeg', stock: 40, sizes: ['A5', 'A4'], category: 'agendas', images: ['image/agenda.jpeg', 'image/agenda2.jpeg', 'image/agenda3.jpeg', 'image/agenda4.jpeg'] }
];

/* -------------------------
   Estado del carrito (se guarda en localStorage)
   Estructura: { productId: { qty: cantidad, size: talla }, ... }
   ------------------------- */
const CART_KEY = 'ideaGrafik_cart_v2';
let cart = loadCart();

/* -------------------------
   Funciones utilitarias
   ------------------------- */
function formatCurrency(num) {
  // Formato simple en dólares (puedes adaptar a COP)
  return `$${Number(num).toFixed(2)}`;
}

function showToast(text, ms = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = text;
  toast.classList.remove('hidden');
  setTimeout(() => toast.classList.add('hidden'), ms);
}

/* -------------------------
   Persistencia: cargar/guardar carrito
   ------------------------- */
function loadCart() {
  const raw = localStorage.getItem(CART_KEY);
  try {
    const data = raw ? JSON.parse(raw) : {};
    
    // Migrar datos del formato anterior si es necesario
    const migratedData = {};
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'number') {
        // Formato anterior: { productId: cantidad }
        // Migrar a nuevo formato: { productId_size: { qty: cantidad, size: talla } }
        const product = PRODUCTS.find(p => p.id === key);
        if (product) {
          const size = product.sizes[0];
          migratedData[`${key}_${size}`] = { qty: data[key], size: size };
        }
      } else {
        // Formato nuevo: { productId_size: { qty: cantidad, size: talla } }
        migratedData[key] = data[key];
      }
    });
    
    return migratedData;
  } catch (e) {
    return {};
  }
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  refreshCartCount();
}

/* -------------------------
   Render: productos en la tienda
   ------------------------- */
function renderProducts(filter = 'all') {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = '';

  let filteredProducts = PRODUCTS;
  
  // Filtrar productos según la categoría
  if (filter !== 'all') {
    filteredProducts = PRODUCTS.filter(p => {
      const name = p.name.toLowerCase();
      return name.includes(filter);
    });
  }

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-secondary);">
        <div style="font-size: 3rem; margin-bottom: 1rem;">🔍</div>
        <h3>No se encontraron productos</h3>
        <p>Intenta con otra categoría o contacta con nosotros para productos personalizados.</p>
      </div>
    `;
    return;
  }

  filteredProducts.forEach(p => {
    const div = document.createElement('div');
    div.className = 'product card';
    
    // Si el producto tiene múltiples imágenes (agendas), crear carrusel
    if (p.images && p.images.length > 1) {
      div.innerHTML = `
        <div class="product-carousel">
          <div class="product-carousel-wrapper">
            ${p.images.map((img, index) => `
              <div class="product-carousel-slide ${index === 0 ? 'active' : ''}">
                <img src="${img}" alt="${p.name}" loading="lazy" onerror="this.style.opacity=0.6" />
              </div>
            `).join('')}
          </div>
          <div class="product-carousel-controls">
            <button class="product-carousel-btn prev" onclick="changeProductSlide('${p.id}', -1)">❮</button>
            <button class="product-carousel-btn next" onclick="changeProductSlide('${p.id}', 1)">❯</button>
          </div>
          <div class="product-carousel-indicators">
            ${p.images.map((_, index) => `
              <span class="product-indicator ${index === 0 ? 'active' : ''}" onclick="setProductSlide('${p.id}', ${index})"></span>
            `).join('')}
          </div>
        </div>
        <h4>${p.name}</h4>
        <p class="desc">${p.desc}</p>
        <div class="price">${formatCurrency(p.price)}</div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn btn-primary add-btn" data-id="${p.id}">Añadir</button>
          <button class="btn btn-outline view-btn" data-id="${p.id}">Ver</button>
        </div>
      `;
    } else {
      // Producto con imagen única (franelas y tazas)
      div.innerHTML = `
        <img src="${p.image}" alt="${p.name}" loading="lazy" onerror="this.style.opacity=0.6" />
        <h4>${p.name}</h4>
        <p class="desc">${p.desc}</p>
        <div class="price">${formatCurrency(p.price)}</div>
        <div style="display:flex; gap:8px; margin-top:8px;">
          <button class="btn btn-primary add-btn" data-id="${p.id}">Añadir</button>
          <button class="btn btn-outline view-btn" data-id="${p.id}">Ver</button>
        </div>
      `;
    }
    
    grid.appendChild(div);
  });

  // Delegación de eventos: botones añadir y ver
  grid.querySelectorAll('.add-btn').forEach(btn => btn.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    addToCart(id, 1);
  }));

  grid.querySelectorAll('.view-btn').forEach(btn => btn.addEventListener('click', (e) => {
    const id = e.currentTarget.dataset.id;
    openProductQuickView(id);
  }));
}

/* -------------------------
   Funcionalidad de filtros
   ------------------------- */
function initProductFilters() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      // Remover clase active de todos los botones
      filterButtons.forEach(b => b.classList.remove('active'));
      
      // Agregar clase active al botón clickeado
      e.target.classList.add('active');
      
      // Obtener el filtro
      const filter = e.target.dataset.filter;
      
      // Renderizar productos con el filtro
      renderProducts(filter);
    });
  });
}

/* -------------------------
   Quick View (interés): muestra detalles rápidos del producto
   ------------------------- */
function openProductQuickView(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  // Modal simple con prompt (se puede mejorar)
  const details = `${p.name}\n\n${p.desc}\nPrecio: ${formatCurrency(p.price)}\nStock: ${p.stock}`;
  if (confirm(details + "\n\n¿Agregar 1 unidad al carrito?")) {
    addToCart(id, 1);
    showToast('Producto añadido desde vista rápida');
  }
}

/* -------------------------
   Carrito: añadir, actualizar, eliminar
   ------------------------- */
function addToCart(productId, qty = 1, size = null) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) {
    showToast('Producto no encontrado', 2000);
    return;
  }
  
  // Si no se especifica talla, usar la primera disponible
  if (!size) {
    size = product.sizes[0];
  }
  
  const cartKey = `${productId}_${size}`;
  const existing = cart[cartKey] || { qty: 0, size: size };
  const newQty = existing.qty + qty;
  
  if (newQty > product.stock) {
    showToast('No hay suficiente stock', 2000);
    return;
  }
  
  cart[cartKey] = { qty: newQty, size: size };
  saveCart();
  refreshCartPanel();
  showToast('Producto añadido al carrito');
}

function updateCartItem(cartKey, qty) {
  if (qty <= 0) {
    delete cart[cartKey];
  } else {
    const [productId, size] = cartKey.split('_');
    const product = PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    
    if (qty > product.stock) {
      showToast('La cantidad excede el stock disponible');
      return;
    }
    
    cart[cartKey] = { qty: qty, size: size };
  }
  saveCart();
  refreshCartPanel();
}

function clearCart() {
  cart = {};
  saveCart();
  refreshCartPanel();
}

/* -------------------------
   Render: panel de carrito (modal lateral)
   ------------------------- */
function refreshCartPanel() {
  const panel = document.getElementById('cart-panel');
  const container = document.getElementById('cart-items');
  container.innerHTML = '';

  const keys = Object.keys(cart);
  if (keys.length === 0) {
    container.innerHTML = '<p class="text-muted">Tu carrito está vacío. Añade productos para comenzar.</p>';
  } else {
    keys.forEach(cartKey => {
      const [productId] = cartKey.split('_');
      const product = PRODUCTS.find(p => p.id === productId);
      const item = cart[cartKey];
      if (!product || !item) return;
      
      const row = document.createElement('div');
      row.className = 'cart-item';
      row.innerHTML = `
        <img src="${product.image}" alt="${product.name}" class="cart-item-image" />
        <div class="cart-item-details">
          <div class="cart-item-name">${product.name}</div>
          <div class="cart-item-info">
            <span class="cart-item-size">Talla: ${item.size}</span>
            <span class="cart-item-price">${formatCurrency(product.price)} c/u</span>
          </div>
          <div class="cart-item-controls">
            <div class="qty-controls">
              <button class="qty-btn qty-minus" data-key="${cartKey}">−</button>
              <input class="cart-qty-input" type="number" min="0" max="${product.stock}" value="${item.qty}" data-key="${cartKey}">
              <button class="qty-btn qty-plus" data-key="${cartKey}">+</button>
            </div>
            <button class="cart-remove-btn" data-key="${cartKey}" title="Eliminar">×</button>
          </div>
        </div>
      `;
      container.appendChild(row);
    });

    // añadir listeners para inputs y botones
    container.querySelectorAll('.cart-qty-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const key = e.target.dataset.key;
        const v = Number(e.target.value) || 0;
        updateCartItem(key, v);
      });
    });

    container.querySelectorAll('.qty-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.key;
        const item = cart[key];
        if (!item) return;
        
        const currentQty = item.qty;
        const isPlus = e.currentTarget.classList.contains('qty-plus');
        const newQty = isPlus ? currentQty + 1 : currentQty - 1;
        
        updateCartItem(key, newQty);
      });
    });

    container.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const key = e.currentTarget.dataset.key;
        delete cart[key];
        saveCart();
        refreshCartPanel();
        showToast('Producto eliminado');
      });
    });
  }

  // Actualizar resumen de totales
  const subtotalVal = calculateSubtotal();
  const shipping = keys.length ? 6.00 : 0.00; // envío fijo para ejemplo
  const totalVal = subtotalVal + shipping;

  document.getElementById('cart-subtotal').textContent = formatCurrency(subtotalVal);
  document.getElementById('cart-shipping').textContent = formatCurrency(shipping);
  document.getElementById('cart-total').textContent = formatCurrency(totalVal);

  // Actualizar mini-cart y checkout area
  renderMiniCart();
  refreshCartCount();
}

/* -------------------------
   Mini-cart y area de checkout en la página
   ------------------------- */
function renderMiniCart() {
  const mini = document.getElementById('mini-cart');
  mini.innerHTML = '';
  const keys = Object.keys(cart);
  if (keys.length === 0) {
    mini.innerHTML = '<p class="text-muted">No hay artículos en el carrito.</p>';
    document.getElementById('checkout-area').innerHTML = ''; // quitar checkout
    return;
  }
  // Ahora iteramos por las claves del carrito (productId_size)
  keys.forEach(cartKey => {
    const [productId] = cartKey.split('_');
    const p = PRODUCTS.find(x => x.id === productId);
    const item = cart[cartKey];
    if (!p || !item) return;
    const div = document.createElement('div');
    div.className = 'cart-row';
    div.innerHTML = `<div>${p.name} <span class="text-muted">x${item.qty}</span></div><div>${formatCurrency(p.price * item.qty)}</div>`;
    mini.appendChild(div);
  });

  // Generar formulario de checkout básico
  renderCheckoutForm();
}

/* -------------------------
   Cálculos
   ------------------------- */
function calculateSubtotal() {
  return Object.keys(cart).reduce((acc, cartKey) => {
    const [productId] = cartKey.split('_');
    const product = PRODUCTS.find(x => x.id === productId);
    const item = cart[cartKey];
    if (product && item) {
      return acc + (product.price * item.qty);
    }
    return acc;
  }, 0);
}

/* -------------------------
   Render: contador del carrito (en header)
   ------------------------- */
function refreshCartCount() {
  const count = Object.values(cart).reduce((a, item) => a + item.qty, 0);
  document.getElementById('cart-count').textContent = count;
}

/* -------------------------
   Checkout: formulario y simulación
   ------------------------- */
function renderCheckoutForm() {
  const area = document.getElementById('checkout-area');
  const subtotal = calculateSubtotal();
  if (subtotal <= 0) {
    area.innerHTML = '<p class="text-muted">Añade productos para continuar al pago.</p>';
    return;
  }

  const shipping = 6.00;
  const total = subtotal + shipping;

  area.innerHTML = `
    <div class="checkout-summary">
      <p>Subtotal: <strong>${formatCurrency(subtotal)}</strong></p>
      <p>Envío: <strong>${formatCurrency(shipping)}</strong></p>
      <p>Total a pagar: <strong>${formatCurrency(total)}</strong></p>
    </div>

    <form id="checkout-form">
      <label>Nombre completo
        <input type="text" id="chk-name" required placeholder="Tu nombre" />
      </label>
      <label>Dirección de envío
        <input type="text" id="chk-address" required placeholder="Dirección completa" />
      </label>
      <label>Teléfono / WhatsApp
        <input type="tel" id="chk-phone" required placeholder="304..." />
      </label>
      <label>Observaciones (opcional)
        <textarea id="chk-note" rows="3" placeholder="¿Algún detalle para el producto?"></textarea>
      </label>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">Pagar (Simulado)</button>
        <button type="button" id="btn-edit-cart" class="btn btn-outline">Editar Carrito</button>
      </div>
    </form>
  `;

  document.getElementById('checkout-form').addEventListener('submit', (e) => {
    e.preventDefault();
    simulatePayment();
  });

  document.getElementById('btn-edit-cart').addEventListener('click', () => {
    openCart();
  });
}

/* -------------------------
   Simulación de pago - acción final
   ------------------------- */
function simulatePayment() {
  // Validación simple
  const name = document.getElementById('chk-name').value.trim();
  const address = document.getElementById('chk-address').value.trim();
  const phone = document.getElementById('chk-phone').value.trim();
  if (!name || !address || !phone) {
    showToast('Por favor completa los datos de envío');
    return;
  }

  // Datos de pedido
  const order = {
    id: 'ORD-' + Date.now(),
    name, address, phone,
    items: Object.keys(cart).map(cartKey => {
      const [productId] = cartKey.split('_');
      const p = PRODUCTS.find(x => x.id === productId);
      const item = cart[cartKey];
      return {
        id: cartKey,
        name: p ? p.name : cartKey,
        qty: item ? item.qty : 0,
        price: p ? p.price : 0
      };
    }),
    subtotal: calculateSubtotal(),
    shipping: 6.00,
    total: calculateSubtotal() + 6.00,
    date: new Date().toISOString()
  };

  // Simulación: mostrar resumen y "confirmación"
  console.log('Pedido simulado:', order);
  showToast('Pago realizado (simulado). Gracias por tu compra!', 4000);

  // Limpiar carrito
  clearCart();

  // Mostrar confirmación simple en modal / alert
  setTimeout(() => {
    alert(`Pedido ${order.id} confirmado.\nTotal: ${formatCurrency(order.total)}\nNos contactamos por WhatsApp para coordinar envío.`);
  }, 600);
}

/* -------------------------
   Eventos: abrir / cerrar panel carrito
   ------------------------- */
function openCart() {
  const panel = document.getElementById('cart-panel');
  panel.classList.add('show');
  panel.classList.remove('hidden');
  panel.setAttribute('aria-hidden', 'false');
  refreshCartPanel();
}

function closeCart() {
  const panel = document.getElementById('cart-panel');
  panel.classList.remove('show');
  // no quitar 'hidden' porque queremos animación; lo dejamos accesible
  panel.setAttribute('aria-hidden', 'true');
}

/* -------------------------
   Inicialización: listeners, render inicial
   ------------------------- */
function init() {
  // Rellenar año en footer
  document.getElementById('year').textContent = new Date().getFullYear();

  // Render de productos
  renderProducts();

  // Inicializar filtros de productos
  initProductFilters();

  // Render inicial del carrito
  refreshCartPanel();

  // Botones abrir/cerrar carrito
  document.getElementById('open-cart-btn').addEventListener('click', openCart);
  document.getElementById('open-cart-btn-2').addEventListener('click', openCart);
  document.getElementById('close-cart-btn').addEventListener('click', closeCart);
  document.getElementById('checkout-btn').addEventListener('click', () => {
    closeCart();
    // desplazar a sección de contacto/checkout para completar compra
    document.getElementById('contacto').scrollIntoView({ behavior: 'smooth' });
    renderCheckoutForm();
  });

  // Vaciar carrito
  document.getElementById('clear-cart-btn').addEventListener('click', () => {
    if (confirm('¿Vaciar todo el carrito?')) clearCart();
  });

  // Form de contacto simple
  document.getElementById('contact-form').addEventListener('submit', (e) => {
    e.preventDefault();
    // captura de datos y mensaje
    const name = document.getElementById('contact-name').value.trim();
    const phone = document.getElementById('contact-phone').value.trim();
    // Aquí podrías enviar a un servidor o a WhatsApp API
    showToast('Mensaje enviado. Nos contactamos por WhatsApp.');
    // reset simple
    e.target.reset();
  });

  // botón ir arriba
  document.getElementById('scroll-top').addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Refrescar contador al inicio
  refreshCartCount();

  // pequeños ajustes UX: cerrar panel con ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeCart();
  });
}

/* -------------------------
   Funcionalidad del carrusel
   ------------------------- */
let currentSlideIndex = 0;
const slides = document.querySelectorAll('.carousel-slide');
const indicators = document.querySelectorAll('.indicator');

function showSlide(index) {
  // Ocultar todas las slides
  slides.forEach(slide => {
    slide.classList.remove('active');
  });
  
  // Mostrar la slide actual
  if (slides[index]) {
    slides[index].classList.add('active');
  }
  
  // Actualizar indicadores
  indicators.forEach((indicator, i) => {
    indicator.classList.toggle('active', i === index);
  });
}

function changeSlide(direction) {
  currentSlideIndex += direction;
  
  // Circular navigation
  if (currentSlideIndex >= slides.length) {
    currentSlideIndex = 0;
  } else if (currentSlideIndex < 0) {
    currentSlideIndex = slides.length - 1;
  }
  
  showSlide(currentSlideIndex);
}

function currentSlide(index) {
  currentSlideIndex = index - 1;
  showSlide(currentSlideIndex);
}

// Auto-play del carrusel
function startCarousel() {
  setInterval(() => {
    changeSlide(1);
  }, 5000); // Cambia cada 5 segundos
}

/* -------------------------
   Funcionalidad del carrusel de productos
   ------------------------- */
let productCarousels = {};

function changeProductSlide(productId, direction) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product || !product.images) return;
  
  if (!productCarousels[productId]) {
    productCarousels[productId] = 0;
  }
  
  productCarousels[productId] += direction;
  
  // Circular navigation
  if (productCarousels[productId] >= product.images.length) {
    productCarousels[productId] = 0;
  } else if (productCarousels[productId] < 0) {
    productCarousels[productId] = product.images.length - 1;
  }
  
  showProductSlide(productId, productCarousels[productId]);
}

function setProductSlide(productId, index) {
  productCarousels[productId] = index;
  showProductSlide(productId, index);
}

function showProductSlide(productId, index) {
  const productCard = document.querySelector(`[data-product-id="${productId}"]`) || 
                     document.querySelector(`.product:has(.product-carousel)`);
  
  if (!productCard) return;
  
  const slides = productCard.querySelectorAll('.product-carousel-slide');
  const indicators = productCard.querySelectorAll('.product-indicator');
  
  // Ocultar todas las slides
  slides.forEach(slide => {
    slide.classList.remove('active');
  });
  
  // Mostrar la slide actual
  if (slides[index]) {
    slides[index].classList.add('active');
  }
  
  // Actualizar indicadores
  indicators.forEach((indicator, i) => {
    indicator.classList.toggle('active', i === index);
  });
}

/* -------------------------
   Ejecutar init al cargar DOM
   ------------------------- */
document.addEventListener('DOMContentLoaded', () => {
  init();
  
  // Inicializar carrusel
  if (slides.length > 0) {
    showSlide(0);
    startCarousel();
  }
});

/* Inicializa carrusel, lazy-load y optimizaciones de scroll */
document.addEventListener('DOMContentLoaded', () => {
  try { initProductCarousel(); } catch (e) { console.error('Error init carousel', e); }
  initScrollPerformance();
});

/* Crea el carrusel a partir de PRODUCTS, con lazy-load, swipe y autoplay */
function initProductCarousel() {
  const carousel = document.getElementById('product-carousel');
  const wrapper = document.getElementById('product-carousel-wrapper');
  const indicators = document.getElementById('pc-indicators');
  if (!carousel || !wrapper || !indicators || !Array.isArray(PRODUCTS)) return;

  // Limpiar
  wrapper.innerHTML = '';
  indicators.innerHTML = '';

  // Generar slides con imagen en data-src (lazy)
  PRODUCTS.forEach((p, i) => {
    const slide = document.createElement('div');
    slide.className = 'product-carousel-slide' + (i === 0 ? ' active' : '');
    slide.dataset.index = i;
    slide.innerHTML = `
      <img data-src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy" class="carousel-image" />
      <div class="carousel-overlay" aria-hidden="true">
        <div class="carousel-text">
          <div class="carousel-title">${escapeHtml(p.name)}</div>
          <div class="carousel-subtitle">${escapeHtml(p.desc || '')}</div>
        </div>
      </div>
    `;
    wrapper.appendChild(slide);

    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'product-indicator' + (i === 0 ? ' active' : '');
    dot.dataset.index = i;
    dot.setAttribute('aria-label', `Ir a ${p.name}`);
    indicators.appendChild(dot);
  });

  // Mostrar carrusel
  carousel.classList.remove('hidden');

  // IntersectionObserver para lazy-load de las imágenes (rootMargin permite pre-carga)
  const slides = Array.from(wrapper.querySelectorAll('.product-carousel-slide'));
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const img = en.target.querySelector('img[data-src]');
      if (img) {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        img.addEventListener('error', () => { img.style.opacity = 0.7; });
      }
      obs.unobserve(en.target);
    });
  }, { root: null, rootMargin: '300px', threshold: 0.01 });

  slides.forEach(s => io.observe(s));

  // Control de indices, indicadores y botones
  let index = 0;
  const total = slides.length;
  const prevBtn = document.getElementById('pc-prev');
  const nextBtn = document.getElementById('pc-next');
  function setActive(newIndex) {
    newIndex = (newIndex + total) % total;
    slides.forEach((s, i) => {
      s.classList.toggle('active', i === newIndex);
      s.classList.toggle('prev', i === index && i !== newIndex);
    });
    indicators.querySelectorAll('button').forEach((b, i) => b.classList.toggle('active', i === newIndex));
    index = newIndex;
  }
  if (prevBtn) prevBtn.addEventListener('click', () => setActive(index - 1));
  if (nextBtn) nextBtn.addEventListener('click', () => setActive(index + 1));
  indicators.querySelectorAll('button').forEach(b => b.addEventListener('click', e => setActive(+e.currentTarget.dataset.index)));

  // Swipe touch
  let startX = 0;
  wrapper.addEventListener('touchstart', e => startX = e.touches[0].clientX, {passive:true});
  wrapper.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) setActive(diff > 0 ? index + 1 : index - 1);
  });

  // Autoplay suave, pausa on hover/touch
  let autoplay = setInterval(() => setActive(index + 1), 5000);
  carousel.addEventListener('mouseenter', () => clearInterval(autoplay));
  carousel.addEventListener('mouseleave', () => autoplay = setInterval(() => setActive(index + 1), 5000));
  // detener autoplay en touchstart
  carousel.addEventListener('touchstart', () => clearInterval(autoplay), {passive:true});
}

/* Mejora de performance en scroll: pausa animaciones pesadas brevemente */
function initScrollPerformance() {
  let t;
  window.addEventListener('scroll', () => {
    document.body.classList.add('disable-animations');
    clearTimeout(t);
    t = setTimeout(() => document.body.classList.remove('disable-animations'), 180);
  }, { passive: true });
}

/* pequeño helper para escapar texto en templates */
function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[s]));
}

/* --- Integración Firebase Google Sign-In + guardar email en Firestore --- */

async function initFirebaseIfConfigured() {
  try {
    const cfg = window._firebaseConfig;
    if (!cfg || !cfg.apiKey) {
      console.info('Firebase no configurado (window._firebaseConfig faltante). Inicio de sesión con Google deshabilitado.');
      return;
    }
    // Inicializar (compat)
    firebase.initializeApp(cfg);
    // Persistencia local (mantener sesión)
    await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    console.info('Firebase inicializado para auth + firestore.');
  } catch (err) {
    console.error('Error inicializando Firebase', err);
  }
}

function signInWithGooglePopup() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');
  return firebase.auth().signInWithPopup(provider);
}

async function saveUserEmailToFirestore(user) {
  if (!user || !user.uid) return;
  try {
    const db = firebase.firestore();
    await db.collection('users').doc(user.uid).set({
      email: user.email || null,
      name: user.displayName || null,
      lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    console.info('Email guardado en Firestore:', user.email);
  } catch (err) {
    console.error('Error guardando email en Firestore', err);
  }
}

/*
  Lógica que asegura que el usuario esté autenticado antes de pagar.
  Si no está, abre el popup de Google, guarda el email y continúa con simulatePayment().
*/
async function ensureAuthThenCheckout() {
  // Si Firebase no está configurado, avisar y continuar (opcional)
  if (!window._firebaseConfig || !window._firebaseConfig.apiKey) {
    showToast('Pago: inicia sesión obligatorio pero Firebase no está configurado.', 4000);
    return;
  }

  // Inicializar Firebase si aún no
  if (!firebase.apps || !firebase.apps.length) {
    await initFirebaseIfConfigured();
  }

  const currentUser = firebase.auth().currentUser;
  try {
    let user = currentUser;
    if (!user) {
      showToast('Inicia sesión con Google para completar la compra...', 2500);
      const res = await signInWithGooglePopup();
      user = res.user;
    }
    if (user && user.email) {
      await saveUserEmailToFirestore(user);
      // Llamar a la función de pago existente (simulatePayment)
      if (typeof simulatePayment === 'function') {
        simulatePayment();
      } else {
        showToast('Error: función de pago no encontrada.', 3000);
        console.error('simulatePayment no definida');
      }
    } else {
      showToast('No se obtuvo email desde Google. Intenta de nuevo.', 3500);
    }
  } catch (err) {
    console.error('Autenticación falló', err);
    showToast('Inicio de sesión cancelado o error: ' + (err.message || ''), 3500);
  }
}

/* Hook: reemplaza comportamiento del botón de checkout para forzar auth */
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar Firebase si config presente
  if (window._firebaseConfig && window._firebaseConfig.apiKey) {
    initFirebaseIfConfigured();
  }

  // Interceptar click del botón de checkout (id="checkout-btn")
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      ensureAuthThenCheckout();
    });
  }

  // También soportar cualquier elemento que dispare pago (delegación)
  document.body.addEventListener('click', (e) => {
    const el = e.target.closest && e.target.closest('[data-action="checkout"]');
    if (el) {
      e.preventDefault();
      ensureAuthThenCheckout();
    }
  }, { passive: true });
});

// ...existing code...

// Reemplazar signInWithGooglePopup por versión que intenta popup y cae a redirect si falla
function signInWithGooglePopup() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');

  // Intentar popup primero (mejor UX en escritorio). Si falla (bloqueo o móvil), usar redirect.
  return firebase.auth().signInWithPopup(provider)
    .then(result => result)
    .catch(err => {
      console.warn('signInWithPopup falló, usando redirect. Error:', err && err.message);
      // Guardar indicador para que, al volver del redirect, sepamos continuar con el checkout
      sessionStorage.setItem('checkout_after_redirect', '1');
      return firebase.auth().signInWithRedirect(provider);
    });
}

// Manejar resultado del redirect al cargar la app (si vino de signInWithRedirect)
document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...

  // Si Firebase está configurado, inicializamos y comprobamos getRedirectResult
  if (window._firebaseConfig && window._firebaseConfig.apiKey) {
    (async () => {
      try {
        if (!firebase.apps || !firebase.apps.length) await initFirebaseIfConfigured();
        // Procesar resultado del redirect (si existe)
        const redirectFlag = sessionStorage.getItem('checkout_after_redirect');
        if (redirectFlag) {
          try {
            const res = await firebase.auth().getRedirectResult();
            if (res && res.user) {
              // Guardar email y continuar con simulatePayment si procede
              await saveUserEmailToFirestore(res.user);
              // limpiar flag
              sessionStorage.removeItem('checkout_after_redirect');
              // Ejecutar simulatePayment si está disponible
              if (typeof simulatePayment === 'function') simulatePayment();
            }
          } catch (err) {
            console.warn('getRedirectResult error:', err);
          }
        }
      } catch (err) {
        console.error('Error init firebase en redirect handler', err);
      }
    })();
  }

  // ...existing code...
});
// ...existing code...

// ...existing code...

// signInWithGooglePopup: intenta popup y, si falla (móvil / bloqueo), usa redirect
function signInWithGooglePopup() {
  const provider = new firebase.auth.GoogleAuthProvider();
  provider.addScope('email');

  return firebase.auth().signInWithPopup(provider)
    .then(result => result)
    .catch(err => {
      console.warn('signInWithPopup falló, usando redirect. Error:', err && err.message);
      sessionStorage.setItem('checkout_after_redirect', '1');
      return firebase.auth().signInWithRedirect(provider);
    });
}

// ...existing code...