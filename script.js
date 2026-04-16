/* ============================================================
   BOUTIQUE LEE — Script Principal
   1. Cursor personalizado
   2. Sistema de temporadas (Todo / Verano / Invierno)
   3. Filtro de categorías (dinámico según temporada)
   4. Animación de entrada (scroll)
   5. Slider de imágenes
   6. Zoom modal
   7. Ripple effect
   8. Partículas hero
   ============================================================ */


/* ── 1. CURSOR PERSONALIZADO ── */

const cursor     = document.getElementById('cursor');
const cursorRing = document.getElementById('cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top  = mouseY + 'px';
});

(function animarAnillo() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  cursorRing.style.left = ringX + 'px';
  cursorRing.style.top  = ringY + 'px';
  requestAnimationFrame(animarAnillo);
})();


/* ── 2. SISTEMA DE TEMPORADAS ── */

// Definición de cada temporada: qué categorías muestra y su etiqueta
const TEMPORADAS = {
  todo: {
    eyebrow: 'Toda la Colección 2026',
    tabs: null, // null = mostrar todas las categorías que existan
  },
  verano: {
    eyebrow: '☀ Temporada Verano 2026',
    tabs: [
      { cat: 'todo',       label: '✦ Todas',         icon: '' },
      { cat: 'remeras',    label: 'Remeras',          icon: '👕' },
      { cat: 'vestidos',   label: 'Vestidos',         icon: '👗' },
      { cat: 'blusas',     label: 'Blusas',           icon: '👚' },
      { cat: 'pantalones', label: 'Pantalones',       icon: '👖' },
      { cat: 'polleras',   label: 'Polleras',         icon: '🩴' },
      { cat: 'camisas',    label: 'Camisas',          icon: '👔' },
      { cat: 'blazers',    label: 'Blazers y Sacos',  icon: '👔' },
    ]
  },
  invierno: {
    eyebrow: '❄ Temporada Invierno 2026',
    tabs: [
      { cat: 'todo',        label: '✦ Todas',          icon: '' },
      { cat: 'remeras-ml',  label: 'Remeras ML',       icon: '👕' },
      { cat: 'buzos',       label: 'Buzos',            icon: '🧥' },
      { cat: 'sacos',       label: 'Sacos de paño',    icon: '🧥' },
      { cat: 'pantalones',    label: 'pantalones',         icon: '🩳' },
      { cat: 'camperas',    label: 'Camperas',         icon: '🧥' },
      { cat: 'chalecos',    label: 'Chalecos',         icon: '🦺' },
      { cat: 'ruana',     label: 'ruana',          icon: '🧣' },
      { cat: 'Falsos conjuntos',     label: 'Falsos conjuntos',          icon: '👘' }
    ]
  }
};

let temporadaActual = 'todo'; // Temporada por defecto al cargar
let categoriaActual = 'todo';

function cambiarTemporada(temporada, boton) {
  temporadaActual = temporada;
  categoriaActual = 'todo';

  // Actualizar botones de temporada
  document.querySelectorAll('.season-btn').forEach(b => b.classList.remove('activa'));
  if (boton) boton.classList.add('activa');

  // Actualizar eyebrow
  const eyebrow = document.getElementById('cat-eyebrow');
  if (eyebrow) eyebrow.textContent = TEMPORADAS[temporada].eyebrow;

  // Regenerar tabs
  renderTabs(temporada);

  // Actualizar nav
  renderNavCats(temporada);

  // Aplicar filtro de visibilidad
  aplicarFiltro(temporada, 'todo');
}

function renderTabs(temporada) {
  const container = document.getElementById('tabs-dinamicos');
  if (!container) return;
  container.innerHTML = '';

  let tabsData;

  if (temporada === 'todo') {
    // Recopilar todas las categorías únicas existentes en el HTML
    const cats = new Set();
    document.querySelectorAll('.tarjeta[data-cat]').forEach(t => cats.add(t.dataset.cat));
    tabsData = [{ cat: 'todo', label: '✦ Todas', icon: '' }];
    cats.forEach(cat => {
      const sep = document.querySelector(`.cat-separador[data-sep="${cat}"]`);
      const label = sep ? sep.textContent.trim().replace(/^[^\s]+\s/, '') : cat;
      tabsData.push({ cat, label, icon: '' });
    });
  } else {
    tabsData = TEMPORADAS[temporada].tabs;
  }

  tabsData.forEach(({ cat, label, icon }) => {
    const btn = document.createElement('button');
    btn.className = 'tab' + (cat === 'todo' ? ' activo' : '');
    btn.textContent = icon ? `${icon} ${label}` : label;
    btn.onclick = () => filtrarCategoria(cat, btn);
    container.appendChild(btn);
  });
}

function renderNavCats(temporada) {
  const nav = document.getElementById('nav-cats-dynamic');
  if (!nav) return;
  nav.innerHTML = '';

  let tabsData;
  if (temporada === 'todo') {
    const cats = new Set();
    document.querySelectorAll('.tarjeta[data-cat]').forEach(t => cats.add(t.dataset.cat));
    tabsData = [{ cat: 'todo', label: 'Todo' }];
    cats.forEach(cat => {
      const sep = document.querySelector(`.cat-separador[data-sep="${cat}"]`);
      const label = sep ? sep.textContent.trim().replace(/^[^\s]+\s/, '') : cat;
      tabsData.push({ cat, label });
    });
  } else {
    tabsData = TEMPORADAS[temporada].tabs;
  }

  tabsData.forEach(({ cat, label }) => {
    const btn = document.createElement('button');
    btn.className = cat === categoriaActual ? 'activa' : '';
    btn.textContent = label;
    btn.onclick = () => filtrarCategoria(cat, null);
    nav.appendChild(btn);
  });
}

function aplicarFiltro(temporada, categoria) {
  const esTodo = categoria === 'todo';

  document.querySelectorAll('.tarjeta').forEach(tarjeta => {
    const tTemp = tarjeta.dataset.temporada;
    const tCat  = tarjeta.dataset.cat;

    let visible = false;
    if (temporada === 'todo') {
      visible = esTodo || tCat === categoria;
    } else {
      const enTemporada = tTemp === temporada;
      visible = enTemporada && (esTodo || tCat === categoria);
    }
    tarjeta.style.display = visible ? '' : 'none';
  });

  // Separadores de categoría
  document.querySelectorAll('.cat-separador').forEach(sep => {
    const sTemp = sep.dataset.temporada;
    const sCat  = sep.dataset.sep;

    let visible = false;
    if (temporada === 'todo') {
      visible = esTodo || sCat === categoria;
    } else {
      visible = sTemp === temporada && (esTodo || sCat === categoria);
    }
    sep.style.display = visible ? '' : 'none';
  });
}

/* ── 3. FILTRO DE CATEGORÍAS ── */

function filtrarCategoria(categoria, botonClickeado) {
  categoriaActual = categoria;

  // Actualizar tabs activos
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('activo'));
  if (botonClickeado) botonClickeado.classList.add('activo');

  // Actualizar nav-cats
  document.querySelectorAll('#nav-cats-dynamic button').forEach(b => {
    b.classList.toggle('activa', b.textContent.trim() === (botonClickeado?.textContent?.trim() || ''));
  });

  aplicarFiltro(temporadaActual, categoria);
}

// Alias para compatibilidad con nav-cats que aún usan onclick="filtrar(...)"
function filtrar(categoria, boton) {
  filtrarCategoria(categoria, boton);
}


/* ── 4. ANIMACIÓN DE ENTRADA AL SCROLL ── */

const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada, indice) => {
    if (entrada.isIntersecting) {
      setTimeout(() => entrada.target.classList.add('visible'), indice * 55);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-in').forEach(el => {
  observador.observe(el);
  el.classList.add('visible');
});


/* ── 5. SLIDER DE IMÁGENES ── */

function initSliders() {
  document.querySelectorAll('.tarjeta-img').forEach(container => {
    const slidesContainer = container.querySelector('.slides');
    if (!slidesContainer) {
      container.querySelectorAll('.arrow').forEach(a => a.remove());
      return;
    }

    const slideEls = container.querySelectorAll('.slide');
    const dotsList = container.querySelectorAll('.dot');
    const total    = slideEls.length;
    let current    = 0;

    // Mostrar primer slide
    slideEls.forEach((s, i) => s.classList.toggle('activo', i === 0));

    if (total > 1) {
      container.classList.add('multi');
    } else {
      container.querySelectorAll('.arrow').forEach(a => a.remove());
      return;
    }

    function goTo(n) {
      slideEls[current].classList.remove('activo');
      current = (n + total) % total;
      slideEls[current].classList.add('activo');
      dotsList.forEach((d, i) => d.classList.toggle('activo', i === current));
    }

    const nextBtn = container.querySelector('.next');
    const prevBtn = container.querySelector('.prev');
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current + 1); });
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); goTo(current - 1); });
  });
}

document.addEventListener('DOMContentLoaded', initSliders);
window.addEventListener('load', initSliders);


/* ── 6. ZOOM MODAL ── */

const modal    = document.getElementById('zoomModal');
const zoomImg  = document.getElementById('zoomImg');
const cerrar   = document.getElementById('zoomCerrar');
const zoomPrev = document.getElementById('zoomPrev');
const zoomNext = document.getElementById('zoomNext');

let zoomSlides = [];
let zoomIndex  = 0;

function abrirZoom(container) {
  const imgs = container.querySelectorAll('.slide img');

  if (imgs.length > 0) {
    zoomSlides = Array.from(imgs).map(img => img.src);
    const style = container.querySelector('.slides')?.style.transform ?? '';
    const match = style.match(/-?([\d.]+)%/);
    zoomIndex = match ? Math.round(parseFloat(match[1]) / 100) : 0;
  } else {
    const img  = container.querySelector('img');
    zoomSlides = img ? [img.src] : [];
    zoomIndex  = 0;
  }

  if (!zoomSlides.length) return;

  zoomImg.src = zoomSlides[zoomIndex];
  modal.classList.add('abierto');
  zoomPrev.style.display = zoomSlides.length > 1 ? 'flex' : 'none';
  zoomNext.style.display = zoomSlides.length > 1 ? 'flex' : 'none';
}

function cerrarZoom() { modal.classList.remove('abierto'); }

document.querySelectorAll('.lupa-overlay').forEach(lupa => {
  lupa.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    abrirZoom(lupa.closest('.tarjeta-img'));
  });
});

zoomPrev.addEventListener('click', (e) => {
  e.stopPropagation();
  zoomIndex = (zoomIndex - 1 + zoomSlides.length) % zoomSlides.length;
  zoomImg.src = zoomSlides[zoomIndex];
});

zoomNext.addEventListener('click', (e) => {
  e.stopPropagation();
  zoomIndex = (zoomIndex + 1) % zoomSlides.length;
  zoomImg.src = zoomSlides[zoomIndex];
});

cerrar.addEventListener('click', cerrarZoom);
modal.addEventListener('click', (e) => { if (e.target === modal) cerrarZoom(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarZoom(); });


/* ── 7. RIPPLE EFFECT EN TARJETAS ── */

document.querySelectorAll('.tarjeta').forEach(tarjeta => {
  tarjeta.addEventListener('click', (e) => {
    const ripple = document.createElement('span');
    ripple.classList.add('ripple');
    const rect = tarjeta.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px`;
    tarjeta.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  });
});


/* ── 8. PARTÍCULAS HERO ── */

const particleContainer = document.getElementById('particles');
const fragment = document.createDocumentFragment();

for (let i = 0; i < 22; i++) {
  const p = document.createElement('span');
  p.classList.add('particle');
  p.textContent = '✦';
  p.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;font-size:${0.4 + Math.random() * 0.7}rem`;
  p.style.setProperty('--dur',   (4 + Math.random() * 5) + 's');
  p.style.setProperty('--delay', (Math.random() * 6) + 's');
  fragment.appendChild(p);
}

particleContainer.appendChild(fragment);


/* ── INICIALIZACIÓN ── */
// Activar temporada por defecto al cargar la página
document.addEventListener('DOMContentLoaded', () => {
  const btnDefault = document.getElementById('btn-todo');
  cambiarTemporada('todo', btnDefault);
});
