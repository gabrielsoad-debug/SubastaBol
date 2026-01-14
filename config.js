// ============================================
// CONFIGURACIÓN FIREBASE - CON DIAGNÓSTICO
// ============================================
const firebaseConfig = {
    apiKey: "AIzaSyDJ39Oc7sLPuk70gT7kkiOzYevyp4Un4o0",
    authDomain: "subastas-bolvia.firebaseapp.com",
    projectId: "subastas-bolvia",
    storageBucket: "subastas-bolvia.firebasestorage.app",
    messagingSenderId: "1099257592438",
    appId: "1:1099257592438:web:cdb3625d2c1c389c5afd57"
};

// ============================================
// INICIALIZAR FIREBASE
// ============================================
let auth, db;
let connectionStatus = {
    firebase: false,
    auth: false,
    firestore: false
};

try {
    console.log("🔄 Iniciando Firebase...");
    
    // Inicializar Firebase
    firebase.initializeApp(firebaseConfig);
    connectionStatus.firebase = true;
    console.log("✅ Firebase App inicializada");
    
    // Inicializar Auth
    auth = firebase.auth();
    connectionStatus.auth = true;
    console.log("✅ Firebase Auth inicializada");
    
    // Inicializar Firestore
    db = firebase.firestore();
    connectionStatus.firestore = true;
    console.log("✅ Firestore inicializada");
    
    // Configurar persistencia de Auth
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log("✅ Persistencia de sesión configurada");
        })
        .catch((error) => {
            console.warn("⚠️ No se pudo configurar persistencia:", error.code);
        });
    
    // Configurar Firestore para mejor rendimiento
    db.settings({
        cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
    });
    
    // Intentar habilitar persistencia offline
    db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
            console.log("✅ Persistencia offline habilitada");
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn("⚠️ Persistencia no disponible (múltiples pestañas abiertas)");
            } else if (err.code === 'unimplemented') {
                console.warn("⚠️ Persistencia no soportada en este navegador");
            } else {
                console.warn("⚠️ Error en persistencia:", err.code);
            }
        });
    
    console.log("✅ Firebase inicializado correctamente");
    
} catch (error) {
    console.error("❌ Error inicializando Firebase:", error);
    console.error("Detalles del error:", error.code, error.message);
    
    // Mostrar error al usuario
    setTimeout(() => {
        showError("Error crítico: No se pudo inicializar Firebase. Verifica la consola.");
    }, 1000);
}

// ============================================
// FUNCIONES DE DIAGNÓSTICO
// ============================================
function checkFirebaseConnection() {
    console.log("🔍 Verificando conexión Firebase...");
    console.log("Estado de conexión:", connectionStatus);
    
    if (!connectionStatus.firebase) {
        console.error("❌ Firebase App no inicializada");
        return false;
    }
    
    if (!connectionStatus.auth) {
        console.error("❌ Firebase Auth no inicializada");
        return false;
    }
    
    if (!connectionStatus.firestore) {
        console.error("❌ Firestore no inicializada");
        return false;
    }
    
    return true;
}

function testFirestoreConnection() {
    if (!db) {
        console.error("❌ Firestore no está disponible");
        return Promise.reject(new Error("Firestore no disponible"));
    }
    
    console.log("🔍 Probando conexión a Firestore...");
    
    // Intentar una lectura simple
    return db.collection('auctions')
        .limit(1)
        .get()
        .then((snapshot) => {
            console.log("✅ Conexión a Firestore exitosa");
            console.log(`📊 Documentos encontrados: ${snapshot.size}`);
            return true;
        })
        .catch((error) => {
            console.error("❌ Error conectando a Firestore:", error);
            console.error("Código de error:", error.code);
            console.error("Mensaje:", error.message);
            
            // Diagnóstico específico según el error
            if (error.code === 'permission-denied') {
                console.error("🔒 PROBLEMA: Permisos de Firestore denegados");
                console.error("SOLUCIÓN: Configura las reglas de Firestore en Firebase Console");
                console.error("Ve a: https://console.firebase.google.com");
                console.error("Firestore Database → Reglas → Copia las reglas proporcionadas");
                
                showError(`Error de permisos de Firestore. 
                    <br><br><strong>Solución:</strong>
                    <br>1. Ve a Firebase Console
                    <br>2. Firestore Database → Reglas
                    <br>3. Copia las reglas que te proporcioné
                    <br>4. Haz click en "Publicar"`);
            } else if (error.code === 'unavailable') {
                console.error("📡 PROBLEMA: Servicio Firestore no disponible");
                console.error("SOLUCIÓN: Verifica tu conexión a internet o el estado de Firebase");
                
                showError("Firestore no disponible. Verifica tu internet o intenta más tarde.");
            } else if (error.code === 'unauthenticated') {
                console.warn("🔑 Usuario no autenticado (esto es normal si no has iniciado sesión)");
            } else {
                showError(`Error de Firestore (${error.code}): ${error.message}`);
            }
            
            return false;
        });
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================
function showError(message) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 600px;
        background: linear-gradient(135deg, #DC143C, #C62828);
        color: white;
        padding: 20px;
        text-align: center;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 4px 20px rgba(220, 20, 60, 0.5);
        border-radius: 12px;
    `;
    statusDiv.innerHTML = `
        <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 10px;"></i>
        <div style="margin-bottom: 15px;">${message}</div>
        <button onclick="this.parentElement.remove()" 
                style="background: white; color: #DC143C; border: none; padding: 10px 20px; 
                       border-radius: 5px; font-weight: bold; cursor: pointer;">
            Cerrar
        </button>
    `;
    document.body.appendChild(statusDiv);
}

function showSuccess(message) {
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #4CAF50, #2E7D32);
        color: white;
        padding: 15px 20px;
        text-align: center;
        z-index: 10000;
        font-weight: bold;
        box-shadow: 0 4px 20px rgba(76, 175, 80, 0.5);
        border-radius: 12px;
    `;
    statusDiv.innerHTML = `
        <i class="fas fa-check-circle"></i> ${message}
    `;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        if (statusDiv.parentElement) {
            statusDiv.style.opacity = '0';
            statusDiv.style.transition = 'opacity 0.5s ease';
            setTimeout(() => statusDiv.remove(), 500);
        }
    }, 3000);
}

function showDiagnostics() {
    console.log("\n=== 🔍 DIAGNÓSTICO DE FIREBASE ===");
    console.log("Estado de conexión:", connectionStatus);
    console.log("Firebase App:", firebase.app() ? "✅ OK" : "❌ Error");
    console.log("Firebase Auth:", auth ? "✅ OK" : "❌ Error");
    console.log("Firestore:", db ? "✅ OK" : "❌ Error");
    console.log("\n=== 🌐 INFORMACIÓN DE RED ===");
    console.log("Online:", navigator.onLine ? "✅ Sí" : "❌ No");
    console.log("URL actual:", window.location.href);
    console.log("\n=== 📝 CONFIGURACIÓN ===");
    console.log("Project ID:", firebaseConfig.projectId);
    console.log("Auth Domain:", firebaseConfig.authDomain);
    console.log("=================================\n");
}

// ============================================
// HACER DISPONIBLE GLOBALMENTE
// ============================================
window.firebaseConfig = firebaseConfig;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.showError = showError;
window.showSuccess = showSuccess;
window.checkFirebaseConnection = checkFirebaseConnection;
window.testFirestoreConnection = testFirestoreConnection;
window.showDiagnostics = showDiagnostics;

// ============================================
// VERIFICACIÓN AUTOMÁTICA AL CARGAR
// ============================================
window.addEventListener('load', () => {
    console.log("🚀 Página cargada, verificando Firebase...");
    
    // Esperar 1 segundo para que Firebase se inicialice completamente
    setTimeout(() => {
        if (checkFirebaseConnection()) {
            console.log("✅ Todas las conexiones Firebase OK");
            
            // Probar conexión a Firestore
            testFirestoreConnection()
                .then((success) => {
                    if (success) {
                        showSuccess("Conexión exitosa con Firebase");
                    }
                })
                .catch((error) => {
                    console.error("Error en test de conexión:", error);
                });
        } else {
            console.error("❌ Hay problemas con la conexión Firebase");
            showError("Error de conexión Firebase. Revisa la consola (F12) para más detalles.");
        }
        
        // Mostrar diagnósticos completos
        showDiagnostics();
    }, 1000);
    
    // Verificar estado de autenticación
    if (auth) {
        auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("👤 Usuario autenticado:", user.uid);
            } else {
                console.log("👤 No hay usuario autenticado");
            }
        });
    }
});

// ============================================
// MANEJO DE ERRORES GLOBALES
// ============================================
window.addEventListener('error', (event) => {
    if (event.error && event.error.message) {
        const msg = event.error.message.toLowerCase();
        
        // Detectar errores de Firebase
        if (msg.includes('firebase') || msg.includes('firestore')) {
            console.error("🔥 Error de Firebase detectado:", event.error);
            
            if (!navigator.onLine) {
                showError("Sin conexión a internet. Verifica tu red.");
            }
        }
    }
});

window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.code) {
        console.error("Promise rechazada:", event.reason);
        
        // Errores comunes de Firebase
        if (event.reason.code === 'permission-denied') {
            console.error("🔒 Error de permisos de Firestore");
            showError("Error de permisos. Configura las reglas de Firestore.");
        } else if (event.reason.code === 'unavailable') {
            console.error("📡 Firestore no disponible");
            showError("Servicio no disponible. Verifica tu internet.");
        }
    }
});

// ============================================
// DETECTOR DE CONEXIÓN A INTERNET
// ============================================
window.addEventListener('online', () => {
    console.log("🌐 Conexión a internet restaurada");
    showSuccess("Conexión restaurada");
    
    // Reintentar conexión a Firestore
    if (db) {
        testFirestoreConnection();
    }
});

window.addEventListener('offline', () => {
    console.log("📡 Sin conexión a internet");
    showError("Sin conexión a internet");
});

console.log("✅ Config.js cargado - Usa showDiagnostics() para ver el estado completo");
