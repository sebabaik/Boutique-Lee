/* ============================================================
   BOUTIQUE LEE — Script Principal
   1. Cursor personalizado
   2. Filtro de categorías
   3. Animación de entrada (scroll)
   4. Slider de imágenes
   5. Zoom modal
   6. Ripple effect
   7. Partículas hero
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


/* ── 2. FILTRO DE CATEGORÍAS ── */

function filtrar(categoria, botonClickeado) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('activo'));
  document.querySelectorAll('.nav-cats button').forEach(b => b.classList.remove('activa'));

  if (botonClickeado) {
    botonClickeado.classList.add('activo');
    botonClickeado.classList.add('activa');
  }

  const esTodo = categoria === 'todo';

  document.querySelectorAll('.tarjeta').forEach(tarjeta => {
    tarjeta.style.display = (esTodo || tarjeta.dataset.cat === categoria) ? '' : 'none';
  });

  document.querySelectorAll('.cat-separador').forEach(sep => {
    sep.style.display = esTodo ? '' : 'none';
  });
}


/* ── 3. ANIMACIÓN DE ENTRADA AL SCROLL ── */

const observador = new IntersectionObserver((entradas) => {
  entradas.forEach((entrada, indice) => {
    if (entrada.isIntersecting) {
      setTimeout(() => entrada.target.classList.add('visible'), indice * 55);
    }
  });
}, { threshold: 0.08 });

document.querySelectorAll('.fade-in').forEach(el => {
  observador.observe(el);
  el.classList.add('visible'); // forzar visibilidad inmediata también
});


/* ── 4. SLIDER DE IMÁGENES ── */

document.querySelectorAll('.tarjeta-img').forEach(container => {
  const slides = container.querySelector('.slides');

  if (!slides) {
    container.querySelectorAll('.arrow').forEach(a => a.remove());
    return;
  }

  const dotsList = container.querySelectorAll('.dot');
  const total    = container.querySelectorAll('.slide').length;
  let current    = 0;

  if (total > 1) container.classList.add('multi');
  // Eliminar flechas si hay una sola imagen
  if (total <= 1) {
    container.querySelectorAll('.arrow').forEach(a => a.remove());
    return;
  }

  function goTo(n) {
    current = (n + total) % total;
    slides.style.transform = `translateX(-${current * 100}%)`;
    dotsList.forEach((d, i) => d.classList.toggle('activo', i === current));
  }

  const nextBtn = container.querySelector('.next');
  const prevBtn = container.querySelector('.prev');
  if (nextBtn) nextBtn.addEventListener('click', () => goTo(current + 1));
  if (prevBtn) prevBtn.addEventListener('click', () => goTo(current - 1));
});


/* ── 5. ZOOM MODAL ── */

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


/* ── 6. RIPPLE EFFECT EN TARJETAS ── */

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


/* ── 7. PARTÍCULAS HERO ── */

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
