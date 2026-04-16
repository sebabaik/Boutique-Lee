/* ============================================================
   BOUTIQUE LEE — Auth & Favoritos
   ============================================================ */

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyB5qyVnTbvsXCjmao5a8MUTCV2URavsxLk",
  authDomain: "boutique-lee-25701.firebaseapp.com",
  projectId: "boutique-lee-25701",
  storageBucket: "boutique-lee-25701.firebasestorage.app",
  messagingSenderId: "1094313435526",
  appId: "1:1094313435526:web:479350d3bd52852f548c07"
};

let currentUser = null;
let favorites = new Set();
let favoritesData = {};

document.addEventListener('DOMContentLoaded', () => {
  initFirebase();
  renderAuthButton();
  setupAuthModal();
  setupFavoritesPanel();
  addHeartButtonsToCards();
});

// ── FIREBASE ──

function initFirebase() {
  if (typeof firebase === 'undefined') {
    loadLocalFavorites();
    updateAuthUI();
    return;
  }
  if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
  firebase.auth().onAuthStateChanged(user => {
    currentUser = user;
    updateAuthUI();
    if (user) loadFavorites();
    else loadLocalFavorites();
  });
}

// ── AUTENTICACIÓN ──

async function signInWithGoogle() {
  if (typeof firebase === 'undefined') {
    showToast('Firebase no configurado');
    return;
  }
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await firebase.auth().signInWithPopup(provider);
    closeAuthModal();
  } catch (e) {
    showToast('Error al iniciar sesión con Google');
  }
}

async function handleAuthSubmit() {
  const email    = document.getElementById('auth-email')?.value?.trim();
  const password = document.getElementById('auth-password')?.value;
  const isReg    = document.querySelector('.auth-tab.active')?.dataset.tab === 'register';

  if (!email || !password) { showToast('Completá todos los campos'); return; }
  if (password.length < 6) { showToast('La contraseña debe tener al menos 6 caracteres'); return; }
  if (isReg) {
    const confirm = document.getElementById('auth-password-confirm')?.value;
    if (!confirm) { showToast('Confirmá tu contraseña'); return; }
    if (password !== confirm) { showToast('Las contraseñas no coinciden'); return; }
  }

  if (typeof firebase === 'undefined') {
    currentUser = { email, displayName: email.split('@')[0], uid: 'local_' + email };
    localStorage.setItem('boutique_lee_user', JSON.stringify(currentUser));
    updateAuthUI();
    closeAuthModal();
    showToast(`¡Bienvenida, ${currentUser.displayName}! 💙`);
    return;
  }

  try {
    if (isReg) {
      await firebase.auth().createUserWithEmailAndPassword(email, password);
      showToast('¡Cuenta creada! Bienvenida a Boutique Lee 💙');
    } else {
      await firebase.auth().signInWithEmailAndPassword(email, password);
    }
    closeAuthModal();
  } catch (e) {
    const msgs = {
      'auth/user-not-found': 'No existe una cuenta con ese email',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/email-already-in-use': 'Ya existe una cuenta con ese email',
      'auth/invalid-email': 'Email inválido',
    };
    showToast(msgs[e.code] || 'Error: ' + e.message);
  }
}

async function signOut() {
  if (typeof firebase === 'undefined') {
    currentUser = null;
    localStorage.removeItem('boutique_lee_user');
    updateAuthUI();
    showToast('Sesión cerrada. ¡Hasta pronto!');
    return;
  }
  try {
    await firebase.auth().signOut();
    currentUser = null;
    favorites.clear();
    favoritesData = {};
    updateAllHeartButtons();
    updateFavoritesCount();
  } catch (e) {}
}

// ── FAVORITOS ──

function loadLocalFavorites() {
  try {
    const stored = localStorage.getItem('boutique_lee_favorites');
    if (stored) {
      favoritesData = JSON.parse(stored);
      favorites = new Set(Object.keys(favoritesData));
      updateAllHeartButtons();
      updateFavoritesCount();
    }
  } catch (e) {}
}

function saveLocalFavorites() {
  try { localStorage.setItem('boutique_lee_favorites', JSON.stringify(favoritesData)); } catch (e) {}
}

async function loadFavorites() {
  if (!currentUser) return;
  if (typeof firebase === 'undefined') { loadLocalFavorites(); return; }
  try {
    const snap = await firebase.firestore()
      .collection('users').doc(currentUser.uid).collection('favorites').get();
    favorites.clear();
    favoritesData = {};
    snap.forEach(d => { favorites.add(d.id); favoritesData[d.id] = d.data(); });
    updateAllHeartButtons();
    updateFavoritesCount();
  } catch (e) { loadLocalFavorites(); }
}

async function toggleFavorite(productId, productData) {
  if (favorites.has(productId)) {
    favorites.delete(productId);
    delete favoritesData[productId];
    if (currentUser && typeof firebase !== 'undefined') {
      try {
        await firebase.firestore()
          .collection('users').doc(currentUser.uid).collection('favorites').doc(productId).delete();
      } catch (e) {}
    }
    showToast('Quitado de tu lista 💔');
  } else {
    favorites.add(productId);
    favoritesData[productId] = productData;
    if (currentUser && typeof firebase !== 'undefined') {
      try {
        await firebase.firestore()
          .collection('users').doc(currentUser.uid).collection('favorites').doc(productId).set(productData);
      } catch (e) {}
    } else {
      showToast('¡Guardado! Iniciá sesión para sincronizar 💙');
    }
    if (currentUser) showToast('¡Agregado a tu lista! 💙');
  }
  updateHeartButton(productId);
  updateFavoritesCount();
  renderFavoritesPanel();
  saveLocalFavorites();
}

// ── UI: BOTONES NAV ──

function renderAuthButton() {
  const nav = document.querySelector('nav');
  if (!nav) return;

  try {
    const stored = localStorage.getItem('boutique_lee_user');
    if (stored) currentUser = JSON.parse(stored);
  } catch (e) {}

  const wrapper = document.createElement('div');
  wrapper.id = 'auth-wrapper';

  // Botón favoritos
  const favBtn = document.createElement('button');
  favBtn.id = 'fav-btn';
  favBtn.innerHTML = `<span class="fav-heart">♡</span><span id="fav-count" class="fav-count hidden">0</span>`;
  favBtn.title = 'Mi lista de deseos';
  favBtn.onclick = toggleFavoritesPanel;
  wrapper.appendChild(favBtn);

  // Botón usuario
  const userBtn = document.createElement('button');
  userBtn.id = 'user-btn';
  userBtn.onclick = () => currentUser ? showUserMenu() : openAuthModal();
  wrapper.appendChild(userBtn);

  // Insertar antes del link de Facebook
  const fbLink = nav.querySelector('.nav-fb');
  if (fbLink) nav.insertBefore(wrapper, fbLink);
  else nav.appendChild(wrapper);

  updateAuthUI();
}

function updateAuthUI() {
  const userBtn = document.getElementById('user-btn');
  if (!userBtn) return;
  if (currentUser) {
    const initial = (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase();
    userBtn.innerHTML = `<span class="user-avatar">${initial}</span><span class="user-label">${currentUser.displayName || currentUser.email?.split('@')[0] || 'Mi cuenta'}</span>`;
  } else {
    userBtn.innerHTML = `<span style="font-size:0.9rem">👤</span><span class="user-label">Ingresar</span>`;
  }
}

function showUserMenu() {
  let menu = document.getElementById('user-menu');
  if (menu) { menu.remove(); return; }

  menu = document.createElement('div');
  menu.id = 'user-menu';
  menu.innerHTML = `
    <div class="user-menu-header">
      <div class="user-menu-avatar">${(currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()}</div>
      <div>
        <div class="user-menu-name">${currentUser.displayName || 'Usuario'}</div>
        <div class="user-menu-email">${currentUser.email || ''}</div>
      </div>
    </div>
    <div class="user-menu-divider"></div>
    <button class="user-menu-item" onclick="toggleFavoritesPanel();document.getElementById('user-menu')?.remove()">
      ♡ Mi lista de deseos <span id="menu-fav-count">${favorites.size}</span>
    </button>
    <div class="user-menu-divider"></div>
    <button class="user-menu-item danger" onclick="signOut();document.getElementById('user-menu')?.remove()">
      Cerrar sesión
    </button>
  `;
  document.body.appendChild(menu);

  const btn = document.getElementById('user-btn');
  const rect = btn.getBoundingClientRect();
  menu.style.top = (rect.bottom + 8) + 'px';
  const rightVal = window.innerWidth - rect.right;
  menu.style.right = Math.max(8, rightVal) + 'px';
  menu.style.left = 'auto';
  menu.style.maxWidth = (window.innerWidth - 16) + 'px';

  setTimeout(() => {
    document.addEventListener('click', function handler(e) {
      if (!menu.contains(e.target) && e.target !== btn) {
        menu.remove();
        document.removeEventListener('click', handler);
      }
    });
  }, 100);
}

// ── UI: MODAL AUTH ──

function setupAuthModal() {
  const modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.innerHTML = `
    <div class="auth-modal-backdrop" onclick="closeAuthModal()"></div>
    <div class="auth-modal-card">
      <button class="auth-modal-close" onclick="closeAuthModal()">✕</button>
      <div class="auth-modal-logo">Boutique Lee</div>
      <h2 class="auth-modal-title">Tu cuenta</h2>
      <p class="auth-modal-sub">Guardá tus prendas favoritas y accedé desde cualquier dispositivo</p>
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login" onclick="switchAuthTab(this)">Ingresar</button>
        <button class="auth-tab" data-tab="register" onclick="switchAuthTab(this)">Registrarse</button>
      </div>
      <div class="auth-field">
        <label>Email</label>
        <input type="email" id="auth-email" placeholder="tu@email.com" />
      </div>
      <div class="auth-field">
        <label>Contraseña</label>
        <div class="auth-input-wrap">
          <input type="password" id="auth-password" placeholder="••••••••" />
          <button type="button" class="auth-eye" onclick="togglePasswordVisibility('auth-password', this)" tabindex="-1">👁</button>
        </div>
      </div>
      <div class="auth-field" id="auth-confirm-wrap" style="display:none">
        <label>Confirmá tu contraseña</label>
        <div class="auth-input-wrap">
          <input type="password" id="auth-password-confirm" placeholder="••••••••" />
          <button type="button" class="auth-eye" onclick="togglePasswordVisibility('auth-password-confirm', this)" tabindex="-1">👁</button>
        </div>
      </div>
      <button class="auth-submit" onclick="handleAuthSubmit()">Ingresar</button>
      <div class="auth-divider"><span>o continuá con</span></div>
      <button class="auth-google-btn" onclick="signInWithGoogle()">
        <svg viewBox="0 0 24 24" width="18" height="18">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continuar con Google
      </button>
      <p class="auth-note">Al registrarte aceptás que tus favoritos se guarden de forma segura.</p>
    </div>
  `;
  document.body.appendChild(modal);
}

function openAuthModal() {
  document.getElementById('auth-modal')?.classList.add('open');
  setTimeout(() => document.getElementById('auth-email')?.focus(), 300);
}

function closeAuthModal() {
  document.getElementById('auth-modal')?.classList.remove('open');
}

function switchAuthTab(btn) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const submitBtn = document.querySelector('.auth-submit');
  const confirmWrap = document.getElementById('auth-confirm-wrap');
  const isRegister = btn.dataset.tab === 'register';
  if (submitBtn) submitBtn.textContent = isRegister ? 'Crear cuenta' : 'Ingresar';
  if (confirmWrap) confirmWrap.style.display = isRegister ? 'block' : 'none';
  if (!isRegister) { const c = document.getElementById('auth-password-confirm'); if(c) c.value=''; }
}

// ── UI: PANEL FAVORITOS ──

function setupFavoritesPanel() {
  const panel = document.createElement('div');
  panel.id = 'favorites-panel';
  panel.innerHTML = `
    <div class="fav-panel-backdrop" onclick="closeFavoritesPanel()"></div>
    <div class="fav-panel-drawer">
      <div class="fav-panel-header">
        <h3>Mi lista de deseos</h3>
        <button class="fav-panel-close" onclick="closeFavoritesPanel()">✕</button>
      </div>
      <div id="fav-panel-body" class="fav-panel-body"></div>
    </div>
  `;
  document.body.appendChild(panel);
}

function toggleFavoritesPanel() {
  const panel = document.getElementById('favorites-panel');
  if (panel?.classList.contains('open')) closeFavoritesPanel();
  else openFavoritesPanel();
}

function openFavoritesPanel() {
  renderFavoritesPanel();
  document.getElementById('favorites-panel')?.classList.add('open');
}

function closeFavoritesPanel() {
  document.getElementById('favorites-panel')?.classList.remove('open');
}


function scrollToProduct(productId) {
  const btn = document.querySelector(`.heart-btn[data-product-id="${productId}"]`);
  if (!btn) return;
  const tarjeta = btn.closest('.tarjeta');
  if (!tarjeta) return;

  // Si la tarjeta está oculta, mostrar todas y resetear filtro
  if (tarjeta.style.display === 'none') {
    const btnTodo = document.getElementById('btn-todo');
    if (btnTodo) cambiarTemporada('todo', btnTodo);
  }

  setTimeout(() => {
    tarjeta.scrollIntoView({ behavior: 'smooth', block: 'center' });
    tarjeta.style.outline = '2px solid #c8d8e8';
    tarjeta.style.outlineOffset = '4px';
    setTimeout(() => {
      tarjeta.style.outline = '';
      tarjeta.style.outlineOffset = '';
    }, 2000);
  }, 300);
}
function renderFavoritesPanel() {
  const body = document.getElementById('fav-panel-body');
  if (!body) return;

  if (favorites.size === 0) {
    body.innerHTML = `
      <div class="fav-empty">
        <div class="fav-empty-icon">♡</div>
        <p>Tu lista está vacía</p>
        <span>Tocá el corazón en cualquier prenda para guardarla aquí</span>
      </div>`;
    return;
  }

  body.innerHTML = '';
  favorites.forEach(id => {
    const data = favoritesData[id] || {};
    const item = document.createElement('div');
item.className = 'fav-item';
item.style.cursor = 'pointer';
item.innerHTML = `
  <div class="fav-item-img">
    ${data.img ? `<img src="${data.img}" alt="${data.name}" onerror="this.style.display='none'">` : '<div class="fav-item-placeholder">👗</div>'}
  </div>
  <div class="fav-item-info">
    <div class="fav-item-cat">${data.cat || ''}</div>
    <div class="fav-item-name">${data.name || id}</div>
    <div class="fav-item-talles">${data.talles || ''}</div>
  </div>
  <button class="fav-item-remove" onclick="event.stopPropagation();toggleFavorite('${id}', ${JSON.stringify(data).replace(/"/g, '&quot;')})">✕</button>
`;
item.addEventListener('click', () => {
  closeFavoritesPanel();
  scrollToProduct(id);
});
body.appendChild(item);
  });

  if (!currentUser) {
    const prompt = document.createElement('div');
    prompt.className = 'fav-login-prompt';
    prompt.innerHTML = `
      <p>Iniciá sesión para sincronizar tu lista en todos tus dispositivos</p>
      <button onclick="openAuthModal();closeFavoritesPanel()">Ingresar / Registrarse</button>
    `;
    body.appendChild(prompt);
  }
}

// ── CORAZONES EN TARJETAS ──

function addHeartButtonsToCards() {
  document.querySelectorAll('.tarjeta').forEach((tarjeta, index) => {
    const nombre = tarjeta.querySelector('.tarjeta-nombre')?.textContent?.trim() || `producto-${index}`;
    const productId = nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const productData = {
      name: nombre,
      cat: tarjeta.querySelector('.tarjeta-cat')?.textContent?.trim() || '',
      talles: tarjeta.querySelector('.talles-row')?.textContent?.trim().replace(/\s+/g, ' ') || '',
      img: tarjeta.querySelector('.slide img')?.src || '',
    };

    const heartBtn = document.createElement('button');
    heartBtn.className = 'heart-btn';
    heartBtn.dataset.productId = productId;
    heartBtn.innerHTML = '♡';
    heartBtn.title = 'Agregar a mi lista';
    heartBtn.onclick = (e) => {
      e.stopPropagation();
      toggleFavorite(productId, productData);
      heartBtn.classList.add('heart-pulse');
      setTimeout(() => heartBtn.classList.remove('heart-pulse'), 400);
    };

    tarjeta.appendChild(heartBtn);
  });
  updateAllHeartButtons();
}

function updateAllHeartButtons() {
  document.querySelectorAll('.heart-btn').forEach(btn => updateHeartButton(btn.dataset.productId));
}

function updateHeartButton(productId) {
  const btn = document.querySelector(`.heart-btn[data-product-id="${productId}"]`);
  if (!btn) return;
  if (favorites.has(productId)) {
    btn.classList.add('active');
    btn.innerHTML = '♥';
    btn.title = 'Quitar de mi lista';
  } else {
    btn.classList.remove('active');
    btn.innerHTML = '♡';
    btn.title = 'Agregar a mi lista';
  }
}

function updateFavoritesCount() {
  const count = favorites.size;
  const badge = document.getElementById('fav-count');
  const menuCount = document.getElementById('menu-fav-count');
  if (badge) { badge.textContent = count; badge.classList.toggle('hidden', count === 0); }
  if (menuCount) menuCount.textContent = count;
}

// ── TOAST ──

function showToast(message) {
  let toast = document.getElementById('bl-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'bl-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toast._timeout);
  toast._timeout = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ── MOSTRAR/OCULTAR CONTRASEÑA ──

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    btn.textContent = '🙈';
  } else {
    input.type = 'password';
    btn.textContent = '👁';
  }
}

// ── ENTER EN MODAL ──

document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && document.getElementById('auth-modal')?.classList.contains('open')) {
    handleAuthSubmit();
  }
});
