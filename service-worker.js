// Service Worker para Subastas Bolivia
const CACHE_NAME = 'subastas-bolivia-v2.0';
const OFFLINE_URL = '/offline.html';

// Archivos esenciales para cachear inmediatamente
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/responsive.css',
  '/config.js',
  '/app.js',
  '/manifest.json',
  '/offline.html',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Segoe+UI:wght@300;400;500;600;700&display=swap'
];

// Rutas que deben pasarse a network siempre
const NETWORK_ONLY_PATHS = [
  /\/__\/auth\//,
  /\/__\/firestore\//,
  /\/api\//,
  /\.(json|xml)$/
];

// Rutas que deben usar estrategia cache-first
const CACHE_FIRST_PATHS = [
  /\.(css|js)$/,
  /\.(png|jpg|jpeg|gif|svg|ico|webp)$/,
  /fonts\.googleapis\.com/,
  /cdnjs\.cloudflare\.com/
];

// Instalación del Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  // Forzar la activación inmediata
  self.skipWaiting();
  
  // Cachear assets esenciales
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cacheando assets esenciales');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        console.log('[Service Worker] Instalación completada');
      })
      .catch((error) => {
        console.error('[Service Worker] Error en instalación:', error);
      })
  );
});

// Activación y limpieza
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activando...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Eliminar caches antiguos
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('[Service Worker] Activación completada');
      // Tomar control de todos los clients inmediatamente
      return self.clients.claim();
    })
  );
});

// Estrategia de cache: Network First, Cache Fallback
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Si la respuesta es exitosa, actualizar cache
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Network falló, usando cache:', error);
    
    // Buscar en cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Si es una navegación, mostrar página offline
    if (request.mode === 'navigate') {
      return caches.match(OFFLINE_URL);
    }
    
    throw error;
  }
}

// Estrategia de cache: Cache First, Network Fallback
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    // Cachear la respuesta para futuras solicitudes
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[Service Worker] Error en cache-first:', error);
    throw error;
  }
}

// Estrategia de cache: Cache Only
function cacheOnlyStrategy(request) {
  return caches.match(request);
}

// Interceptar fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorar solicitudes que no son GET
  if (request.method !== 'GET') return;
  
  // Ignorar extensiones de Chrome
  if (url.protocol === 'chrome-extension:') return;
  
  // Determinar estrategia basada en la URL
  let strategy = 'network-first'; // Por defecto
  
  // NETWORK ONLY: APIs y Firebase
  if (NETWORK_ONLY_PATHS.some(regex => regex.test(url.pathname))) {
    event.respondWith(fetch(request));
    return;
  }
  
  // CACHE FIRST: Assets estáticos
  if (CACHE_FIRST_PATHS.some(regex => regex.test(url.href))) {
    strategy = 'cache-first';
  }
  
  // CACHE ONLY: Assets pre-cacheados
  if (PRECACHE_ASSETS.includes(url.pathname)) {
    strategy = 'cache-only';
  }
  
  // Aplicar estrategia
  switch (strategy) {
    case 'network-first':
      event.respondWith(networkFirstStrategy(request));
      break;
      
    case 'cache-first':
      event.respondWith(cacheFirstStrategy(request));
      break;
      
    case 'cache-only':
      event.respondWith(cacheOnlyStrategy(request));
      break;
      
    default:
      event.respondWith(fetch(request));
  }
});

// Manejo de mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.delete(CACHE_NAME);
  }
  
  if (event.data && event.data.type === 'GET_CACHE_INFO') {
    caches.open(CACHE_NAME)
      .then(cache => cache.keys())
      .then(keys => {
        event.ports[0].postMessage({
          type: 'CACHE_INFO',
          count: keys.length,
          items: keys.map(k => k.url)
        });
      });
  }
});

// Notificaciones push (configuración básica)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Notificación push recibida');
  
  let data = {};
  
  try {
    data = event.data ? event.data.json() : {};
  } catch (error) {
    data = {
      title: 'Subastas Bolivia',
      body: 'Tienes una nueva notificación',
      icon: '/icons/icon-192x192.png'
    };
  }
  
  const options = {
    body: data.body || 'Nueva actualización en Subastas Bolivia',
    icon: data.icon || '/icons/icon-192x192.png',
    badge: '/icons/badge-96x96.png',
    vibrate: [200, 100, 200, 100, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/icons/open-icon.png'
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/icons/close-icon.png'
      }
    ],
    tag: 'subastas-notification',
    renotify: true,
    requireInteraction: false
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Subastas Bolivia', options)
  );
});

// Manejo de clics en notificaciones
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notificación clickeada:', event.notification.tag);
  
  event.notification.close();
  
  const action = event.action;
  const notificationData = event.notification.data;
  
  if (action === 'close') {
    return;
  }
  
  // Por defecto, abrir la app
  const urlToOpen = notificationData.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    })
    .then((windowClients) => {
      // Buscar una ventana existente
      for (let client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // Si no hay ventana abierta, abrir una nueva
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background sync (para enviar datos cuando se recupere la conexión)
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);
  
  if (event.tag === 'sync-auction-bids') {
    event.waitUntil(syncAuctionBids());
  }
  
  if (event.tag === 'sync-auction-watch') {
    event.waitUntil(syncAuctionWatch());
  }
});

async function syncAuctionBids() {
  // Implementar sincronización de pujas pendientes
  console.log('[Service Worker] Sincronizando pujas...');
}

async function syncAuctionWatch() {
  // Implementar sincronización de seguimientos
  console.log('[Service Worker] Sincronizando seguimientos...');
}

// Periodic sync (cada 12 horas)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-auctions') {
    console.log('[Service Worker] Periodic sync para actualizar subastas');
    event.waitUntil(updateAuctionsCache());
  }
});

async function updateAuctionsCache() {
  console.log('[Service Worker] Actualizando cache de subastas...');
  // Aquí puedes actualizar datos de subastas en cache
}