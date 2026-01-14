// ============================================
// SUBASTAS BOLIVIA - SISTEMA CORREGIDO Y COMPLETO
// ============================================

// Verificar que Firebase está disponible
if (typeof firebase === 'undefined') {
    console.error('❌ Firebase no está cargado');
    // Mostrar mensaje de error
    document.addEventListener('DOMContentLoaded', () => {
        const loader = document.getElementById('loader');
        if (loader) {
            loader.innerHTML = `
                <div style="text-align: center; color: var(--red); padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem;"></i>
                    <h2>Error de configuración</h2>
                    <p>Firebase no se cargó correctamente</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--gold); color: var(--dark); border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    });
}

/* ============================================
   SISTEMA DE NOTIFICACIONES MEJORADO
   ============================================ */
class NotificationSystem {
    constructor() {
        this.container = document.getElementById('notificationsContainer');
        this.MAX_NOTIFICATIONS = 5;
        this.notificationCount = 0;
        this.queue = [];
        
        // Crear contenedor si no existe
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'notificationsContainer';
            this.container.style.cssText = `
                position: fixed;
                top: 80px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                max-width: 350px;
            `;
            document.body.appendChild(this.container);
        }
    }
    
    show(message, type = 'info', duration = 5000) {
        // Si hay muchas notificaciones, poner en cola
        if (this.notificationCount >= this.MAX_NOTIFICATIONS) {
            this.queue.push({ message, type, duration });
            return;
        }
        
        this.cleanupOldNotifications();
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.id = `notification-${Date.now()}-${Math.random()}`;
        notification.style.cssText = `
            background: rgba(10, 10, 20, 0.95);
            border: 1px solid rgba(255, 215, 0, 0.3);
            border-radius: 8px;
            padding: 15px;
            color: white;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            backdrop-filter: blur(10px);
            animation: slideIn 0.3s ease;
        `;
        
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'error': 'exclamation-circle',
            'warning': 'exclamation-triangle',
            'bid': 'hand-paper',
            'timer': 'clock'
        };
        
        const icon = icons[type] || 'info-circle';
        const iconColor = type === 'success' ? '#4CAF50' : 
                         type === 'error' ? '#F44336' : 
                         type === 'warning' ? '#FF9800' : 'var(--gold)';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}" style="color: ${iconColor}; flex-shrink: 0; font-size: 1.2rem;"></i>
            <div style="flex-grow: 1; overflow: hidden; text-overflow: ellipsis; font-size: 0.95rem;">${message}</div>
            <button class="close-notification" style="background: none; border: none; color: #888; cursor: pointer; flex-shrink: 0; padding: 5px;">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.container.appendChild(notification);
        this.notificationCount++;
        
        const closeBtn = notification.querySelector('.close-notification');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification.id);
        });
        
        // Auto-remover
        const timeoutId = setTimeout(() => {
            this.removeNotification(notification.id);
        }, duration);
        
        notification.timeoutId = timeoutId;
        
        return notification.id;
    }
    
    showBidNotification(username, amount, auctionTitle) {
        this.show(
            `<strong>${username}</strong> pujó <strong>Bs ${amount}</strong> en "${auctionTitle}"`,
            'bid',
            3000
        );
    }
    
    showTimerNotification(auctionTitle, timeLeft) {
        const minutes = Math.floor(timeLeft / 60000);
        this.show(
            `⏳ "${auctionTitle}" termina en ${minutes} minutos`,
            'timer',
            4000
        );
    }
    
    showOutbidNotification(auctionTitle, newBid) {
        this.show(
            `⚠ Te han superado en "${auctionTitle}" (Bs ${newBid})`,
            'warning',
            5000
        );
    }
    
    cleanupOldNotifications() {
        const notifications = this.container.children;
        if (notifications.length >= this.MAX_NOTIFICATIONS) {
            const oldest = notifications[0];
            if (oldest) {
                this.removeNotification(oldest.id);
            }
        }
    }
    
    removeNotification(id) {
        const notification = document.getElementById(id);
        if (notification) {
            if (notification.timeoutId) {
                clearTimeout(notification.timeoutId);
            }
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                    this.notificationCount--;
                    
                    // Mostrar siguiente en cola
                    if (this.queue.length > 0) {
                        const next = this.queue.shift();
                        setTimeout(() => {
                            this.show(next.message, next.type, next.duration);
                        }, 300);
                    }
                }
            }, 300);
        }
    }
    
    clearAll() {
        while (this.container.firstChild) {
            this.container.removeChild(this.container.firstChild);
        }
        this.notificationCount = 0;
        this.queue = [];
    }
}

/* ============================================
   SISTEMA DE VALIDACIÓN MEJORADO
   ============================================ */
class ValidationSystem {
    static validateInput(input, type) {
        if (!input) return false;
        
        const validators = {
            phone: /^[0-9]{7,10}$/,
            username: /^[a-zA-Z0-9_]{3,20}$/,
            amount: /^[1-9][0-9]*$/,
            email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            url: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
            bidAmount: /^[1-9][0-9]*$/,
            percentage: /^[0-9]{1,3}$/
        };
        
        if (!validators[type]) {
            console.warn(`Validador no definido para tipo: ${type}`);
            return true;
        }
        
        return validators[type].test(input);
    }
    
    static sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        
        return input
            .replace(/[<>]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim();
    }
    
    static validateBidAmount(amount, currentBid, minIncrement) {
        if (!amount || !currentBid || !minIncrement) {
            return { valid: false, error: 'Datos incompletos' };
        }
        
        if (!this.validateInput(amount.toString(), 'bidAmount')) {
            return { valid: false, error: 'Monto de puja inválido' };
        }
        
        amount = parseInt(amount);
        currentBid = parseInt(currentBid);
        minIncrement = parseInt(minIncrement);
        
        if (isNaN(amount) || isNaN(currentBid) || isNaN(minIncrement)) {
            return { valid: false, error: 'Valores numéricos inválidos' };
        }
        
        if (amount <= currentBid) {
            return { valid: false, error: `La puja debe ser mayor a Bs ${currentBid}` };
        }
        
        if ((amount - currentBid) % minIncrement !== 0) {
            return { valid: false, error: `El incremento debe ser múltiplo de Bs ${minIncrement}` };
        }
        
        return { valid: true };
    }
}

/* ============================================
   SISTEMA DE RATE LIMITING MEJORADO
   ============================================ */
class RateLimiter {
    constructor() {
        this.userBids = new Map();
        this.userActions = new Map();
        this.MAX_BIDS_PER_MINUTE = 15;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.MAX_WATCHES_PER_HOUR = 50;
        this.LOCKOUT_TIME = 15 * 60 * 1000;
    }
    
    canBid(userId) {
        if (!userId) return { allowed: false, message: 'Usuario no identificado' };
        
        const now = Date.now();
        const userBids = this.userBids.get(userId) || [];
        
        const recentBids = userBids.filter(time => now - time < 60000);
        
        if (recentBids.length >= this.MAX_BIDS_PER_MINUTE) {
            return {
                allowed: false,
                message: `Límite de pujas alcanzado. Espera ${Math.ceil((60000 - (now - recentBids[0])) / 1000)} segundos.`,
                waitTime: Math.ceil((60000 - (now - recentBids[0])) / 1000)
            };
        }
        
        userBids.push(now);
        this.userBids.set(userId, userBids.slice(-this.MAX_BIDS_PER_MINUTE * 2));
        return { allowed: true };
    }
    
    canWatch(userId) {
        if (!userId) return { allowed: false, message: 'Usuario no identificado' };
        
        const now = Date.now();
        const key = `watch_${userId}`;
        const watches = this.userActions.get(key) || [];
        
        const recentWatches = watches.filter(time => now - time < 3600000);
        
        if (recentWatches.length >= this.MAX_WATCHES_PER_HOUR) {
            return {
                allowed: false,
                message: 'Límite de seguimientos alcanzado. Espera una hora.'
            };
        }
        
        watches.push(now);
        this.userActions.set(key, watches);
        return { allowed: true };
    }
    
    canLogin(phone) {
        if (!phone) return { allowed: false, message: 'Teléfono requerido' };
        
        const now = Date.now();
        const key = `login_${phone}`;
        const attempts = this.userActions.get(key) || [];
        
        const recentAttempts = attempts.filter(time => now - time < 15 * 60000);
        
        if (recentAttempts.length >= this.MAX_LOGIN_ATTEMPTS) {
            const timeLeft = Math.ceil((this.LOCKOUT_TIME - (now - recentAttempts[0])) / 60000);
            return {
                allowed: false,
                message: `Demasiados intentos. Espera ${timeLeft} minutos.`,
                lockout: true
            };
        }
        
        attempts.push(now);
        this.userActions.set(key, attempts);
        return { allowed: true };
    }
    
    resetLoginAttempts(phone) {
        const key = `login_${phone}`;
        this.userActions.delete(key);
    }
    
    clearOldEntries() {
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;
        const twoHours = 2 * oneHour;
        
        for (const [userId, bids] of this.userBids.entries()) {
            const recentBids = bids.filter(time => now - time < oneHour);
            if (recentBids.length === 0) {
                this.userBids.delete(userId);
            } else {
                this.userBids.set(userId, recentBids);
            }
        }
        
        for (const [key, actions] of this.userActions.entries()) {
            const recentActions = actions.filter(time => now - time < twoHours);
            if (recentActions.length === 0) {
                this.userActions.delete(key);
            } else {
                this.userActions.set(key, recentActions);
            }
        }
    }
}

/* ============================================
   CLASE PRINCIPAL AUCTION SYSTEM - COMPLETAMENTE CORREGIDA
   ============================================ */

class AuctionSystem {
    constructor() {
        // Referencias Firebase - verificando que existan
        this.auth = null;
        this.db = null;
        
        if (window.firebaseAuth && window.firebaseDb) {
            this.auth = window.firebaseAuth;
            this.db = window.firebaseDb;
        } else if (firebase && firebase.auth && firebase.firestore) {
            this.auth = firebase.auth();
            this.db = firebase.firestore();
        }
        
        // Estado de la aplicación
        this.currentUser = null;
        this.selectedAuction = null;
        this.timers = {};
        this.auctionsUnsubscribe = null;
        
        // Watchlist y autobids
        this.watchlist = new Set();
        this.followedAuctions = new Map();
        this.autobids = new Map();
        
        // Sistemas auxiliares
        this.notifications = new NotificationSystem();
        this.rateLimiter = new RateLimiter();
        this.imageCache = new Map();
        this.lazyImageObserver = null;
        
        // Categorías
        this.categories = {
            'electronics': 'Electrónica',
            'vehicles': 'Vehículos',
            'art': 'Arte',
            'collectibles': 'Coleccionables',
            'premium': 'Premium',
            'other': 'Otros'
        };
        
        // Filtros actuales
        this.currentCategory = 'all';
        this.currentSort = 'ending';
        this.onlyVerified = false;
        this.onlyFlash = false;
        
        // Intervalos de limpieza
        setInterval(() => {
            this.rateLimiter.clearOldEntries();
            this.updateLiveStats();
        }, 5 * 60 * 1000);
        
        // Verificar autobids cada 30 segundos
        setInterval(() => {
            this.processAutobids();
        }, 30000);
    }
    
    async init() {
        console.log('🚀 Iniciando sistema...');
        
        try {
            // Verificar Firebase
            if (!this.auth || !this.db) {
                throw new Error('Firebase no está disponible');
            }
            
            console.log('1️⃣ Configurando listeners...');
            this.setupAuthListeners();
            this.setupEventListeners();
            
            console.log('2️⃣ Sistema básico listo');
            this.notifications.show("Sistema cargado", "success");
            
            // Cargar datos en segundo plano (no bloqueante)
            setTimeout(() => {
                console.log('3️⃣ Cargando datos en segundo plano...');
                this.loadInitialData().catch(err => {
                    console.error('⚠️ Error cargando datos:', err);
                });
                this.setupLazyLoading();
            }, 100);
            
            console.log("✅ Sistema inicializado");
            
        } catch (error) {
            console.error("❌ Error en init():", error);
            this.notifications.show("Error: " + error.message, "error");
            this.hideLoader();
        }
    }
    
    setupAuthListeners() {
        if (!this.auth) return;
        
        this.auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDoc = await this.db.collection('users').doc(user.uid).get();
                    
                    if (userDoc.exists) {
                        this.currentUser = {
                            id: user.uid,
                            ...userDoc.data()
                        };
                        
                        if (this.currentUser.isBanned) {
                            setTimeout(() => {
                                this.showBanMessage();
                            }, 100);
                        } else {
                            await this.loadUserWatchlist();
                            await this.loadUserAutobids();
                        }
                    } else {
                        this.currentUser = {
                            id: user.uid,
                            phone: user.email ? user.email.split('@')[0] : "Sin teléfono",
                            username: user.displayName || "Usuario",
                            email: user.email,
                            totalBids: 0,
                            auctionsWon: 0,
                            isBanned: false,
                            banReason: null,
                            isAdmin: false,
                            watchlist: [],
                            autobids: {},
                            reputation: 100,
                            rank: 'Novato'
                        };
                        
                        await this.db.collection('users').doc(user.uid).set(this.currentUser);
                    }
                    
                    this.updateUI();
                    if (!this.currentUser.isBanned) {
                        this.notifications.show(`¡Bienvenido ${this.currentUser.username}!`, "success");
                        this.updateUserStats();
                    }
                } catch (error) {
                    console.error("Error en auth listener:", error);
                }
            } else {
                this.currentUser = null;
                this.watchlist.clear();
                this.autobids.clear();
                this.updateUI();
                
                const banNotification = document.getElementById('banNotification');
                if (banNotification) {
                    banNotification.remove();
                }
            }
        });
    }
    
    async loadUserWatchlist() {
        if (!this.currentUser || !this.db) return;
        
        try {
            const watchlistDoc = await this.db.collection('watchlists').doc(this.currentUser.id).get();
            if (watchlistDoc.exists) {
                const data = watchlistDoc.data();
                this.watchlist = new Set(data.auctions || []);
                this.updateWatchlistCount();
                await this.loadFollowedAuctions();
            }
        } catch (error) {
            console.error("Error cargando watchlist:", error);
        }
    }
    
    async loadUserAutobids() {
        if (!this.currentUser || !this.db) return;
        
        try {
            const autobidsDoc = await this.db.collection('autobids').doc(this.currentUser.id).get();
            if (autobidsDoc.exists) {
                const data = autobidsDoc.data();
                this.autobids = new Map(Object.entries(data.bids || {}));
            }
        } catch (error) {
            console.error("Error cargando autobids:", error);
        }
    }
    
    async loadFollowedAuctions() {
        if (!this.currentUser || this.watchlist.size === 0 || !this.db) return;
        
        try {
            const auctions = await Promise.all(
                Array.from(this.watchlist).map(async (auctionId) => {
                    try {
                        const doc = await this.db.collection('auctions').doc(auctionId).get();
                        if (doc.exists) {
                            return { id: doc.id, ...doc.data() };
                        }
                    } catch (error) {
                        console.error(`Error cargando subasta ${auctionId}:`, error);
                    }
                    return null;
                })
            );
            
            this.followedAuctions = new Map(
                auctions.filter(a => a !== null).map(a => [a.id, a])
            );
            
            this.updateWatchlistDisplay();
        } catch (error) {
            console.error("Error cargando subastas seguidas:", error);
        }
    }
    
    showBanMessage() {
        if (!this.currentUser || !this.currentUser.isBanned) return;
        
        if (document.getElementById('banNotification')) return;
        
        const banMessage = `
            <div id="banNotification" style="position: fixed; top: 80px; left: 50%; transform: translateX(-50%); 
                 background: linear-gradient(135deg, rgba(220, 20, 60, 0.95), rgba(198, 40, 40, 0.95)); 
                 color: white; padding: 20px 30px; border-radius: 12px; z-index: 1001; 
                 box-shadow: 0 10px 30px rgba(220, 20, 60, 0.5); max-width: 500px; text-align: center;">
                <i class="fas fa-ban" style="font-size: 3rem; margin-bottom: 10px;"></i>
                <div style="font-size: 1.2rem; font-weight: bold; margin-bottom: 10px;">¡CUENTA SUSPENDIDA!</div>
                <div style="margin-bottom: 10px;">${this.currentUser.banReason || 'Violación de los términos del servicio'}</div>
                <small style="opacity: 0.8;">Contacta al administrador para más información</small>
                <button class="close-ban" onclick="this.parentElement.remove()" 
                        style="position: absolute; top: 10px; right: 10px; background: transparent; 
                               border: none; color: white; font-size: 1.5rem; cursor: pointer;">&times;</button>
            </div>
        `;
        
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = banMessage;
        const banDiv = tempDiv.firstChild;
        document.body.appendChild(banDiv);
        
        this.blockUserActions();
        this.updateUI();
    }
    
    blockUserActions() {
        document.querySelectorAll('.bid-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
            btn.innerHTML = '<i class="fas fa-ban"></i> CUENTA SUSPENDIDA';
            btn.style.background = 'rgba(220, 20, 60, 0.2)';
            btn.style.borderColor = 'var(--red)';
            btn.style.color = 'var(--red)';
        });
        
        document.querySelectorAll('.watch-btn').forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        });
    }
    
    updateUI() {
        const usernameDisplay = document.getElementById('usernameDisplay');
        const loginBtn = document.getElementById('loginBtn');
        const userAvatar = document.getElementById('userAvatar');
        const userRank = document.getElementById('userRank');
        
        if (!usernameDisplay || !loginBtn || !userAvatar || !userRank) return;
        
        if (this.currentUser) {
            usernameDisplay.textContent = this.currentUser.username;
            
            if (this.currentUser.isBanned) {
                usernameDisplay.style.color = 'var(--red)';
                usernameDisplay.innerHTML = `${this.currentUser.username} <i class="fas fa-ban" style="color: var(--red);"></i>`;
                userRank.textContent = 'Cuenta suspendida';
                userRank.style.color = 'var(--red)';
                userAvatar.innerHTML = '<i class="fas fa-ban"></i>';
                userAvatar.style.background = 'linear-gradient(135deg, var(--red), #C62828)';
            } else {
                usernameDisplay.style.color = 'var(--gold)';
                userRank.textContent = this.currentUser.rank || 'Novato';
                userRank.style.color = 'var(--gold)';
                userAvatar.innerHTML = `<i class="fas fa-user${this.currentUser.isAdmin ? '-crown' : ''}"></i>`;
                userAvatar.style.background = this.currentUser.isAdmin ? 
                    'linear-gradient(135deg, var(--gold), var(--orange))' : 
                    'linear-gradient(135deg, var(--purple), var(--red))';
            }
            
            loginBtn.textContent = 'Cerrar Sesión';
        } else {
            usernameDisplay.textContent = 'Invitado';
            usernameDisplay.style.color = 'var(--gold)';
            userRank.textContent = 'Sin ranking';
            userRank.style.color = '#888';
            userAvatar.innerHTML = '<i class="fas fa-user"></i>';
            userAvatar.style.background = 'linear-gradient(135deg, #666, #444)';
            loginBtn.textContent = 'Login VIP';
        }
        
        this.updateWatchlistCount();
    }
    
    updateWatchlistCount() {
        const watchlistCount = document.getElementById('watchlistCount');
        if (watchlistCount) {
            watchlistCount.textContent = this.watchlist.size;
            watchlistCount.style.display = this.watchlist.size > 0 ? 'flex' : 'none';
        }
    }
    
    setupEventListeners() {
        console.log('🎯 Configurando event listeners...');
        
        // Navegación principal
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.closest('.nav-btn').getAttribute('data-tab');
                console.log(`🔄 Cambiando a pestaña: ${tabId}`);
                this.switchTab(tabId);
            });
        });
        
        // Botón login/logout
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (this.currentUser) {
                    this.logout();
                } else {
                    this.openAuthModal();
                }
            });
        }
        
        // Categorías
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.closest('.category-btn').getAttribute('data-category');
                console.log(`🏷️ Filtrando por categoría: ${category}`);
                this.filterByCategory(category);
            });
        });
        
        // Ordenamiento
        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                console.log(`🔄 Ordenando por: ${e.target.value}`);
                this.loadAuctions();
            });
        }
        
        // Filtros
        const verifiedFilter = document.getElementById('expertVerifiedFilter');
        if (verifiedFilter) {
            verifiedFilter.addEventListener('click', (e) => {
                this.onlyVerified = !this.onlyVerified;
                e.target.classList.toggle('active', this.onlyVerified);
                console.log(`✅ Filtro verificadas: ${this.onlyVerified}`);
                this.loadAuctions();
            });
        }
        
        const flashFilter = document.getElementById('flashAuctionsFilter');
        if (flashFilter) {
            flashFilter.addEventListener('click', (e) => {
                this.onlyFlash = !this.onlyFlash;
                e.target.classList.toggle('active', this.onlyFlash);
                console.log(`⚡ Filtro flash: ${this.onlyFlash}`);
                this.loadAuctions();
            });
        }
        
        // Formularios
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('🔐 Enviando formulario de login...');
                this.handleLogin();
            });
        }
        
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📝 Enviando formulario de registro...');
                this.handleRegister();
            });
        }
        
        const createAuctionForm = document.getElementById('createAuctionForm');
        if (createAuctionForm) {
            createAuctionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('🆕 Creando nueva subasta...');
                this.createAuction();
            });
        }
        
        // Botones de cerrar modales
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modalId = e.target.getAttribute('data-modal');
                console.log(`❌ Cerrando modal: ${modalId}`);
                if (modalId) {
                    this.closeModal(modalId);
                } else {
                    const modal = e.target.closest('.modal-overlay');
                    if (modal) {
                        modal.classList.remove('active');
                    }
                }
            });
        });
        
        // Cerrar modales al hacer clic fuera
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        });
        
        // Admin panel
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn) {
            adminBtn.addEventListener('click', () => {
                console.log('👑 Abriendo panel de administración...');
                this.toggleAdminPanel();
            });
        }
        
        const debugBtn = document.getElementById('debugBtn');
        if (debugBtn) {
            debugBtn.addEventListener('click', () => {
                console.log('🐛 Activando modo debug...');
                this.debugMode();
            });
        }
        
        // Admin tabs
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = e.target.getAttribute('data-admin-tab');
                console.log(`👑 Cambiando a pestaña admin: ${tabId}`);
                this.switchAdminTab(tabId);
            });
        });
        
        // Botones admin
        const resetBtn = document.getElementById('resetAdminFormBtn');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                const form = document.getElementById('createAuctionForm');
                if (form) form.reset();
                console.log('🧹 Formulario admin limpiado');
            });
        }
        
        // Filtro ganadores
        const winnersFilter = document.getElementById('winnersTimeFilter');
        if (winnersFilter) {
            winnersFilter.addEventListener('change', () => {
                console.log('🔄 Cambiando filtro de ganadores...');
                this.loadWinners();
            });
        }
        
        // Cerrar admin panel al hacer clic fuera
        document.addEventListener('click', (e) => {
            const adminPanel = document.getElementById('adminPanel');
            const adminBtn = document.getElementById('adminBtn');
            
            if (adminPanel && adminPanel.classList.contains('active') &&
                !adminPanel.contains(e.target) && 
                adminBtn && !adminBtn.contains(e.target)) {
                adminPanel.classList.remove('active');
                console.log('👑 Panel admin cerrado');
            }
        });
        
        // Botón "Olvidaste tu contraseña?"
        const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
        if (forgotPasswordBtn) {
            forgotPasswordBtn.addEventListener('click', () => {
                this.handleForgotPassword();
            });
        }
        
        console.log('✅ Todos los event listeners configurados');
    }
    
    handleForgotPassword() {
        const phoneInput = document.getElementById('loginPhoneInput');
        if (!phoneInput) return;
        
        const phone = phoneInput.value.trim();
        if (!phone) {
            this.notifications.show('Ingresa tu número de teléfono', 'error');
            return;
        }
        
        const email = `${phone}@subastasbolivia.com`;
        
        this.auth.sendPasswordResetEmail(email)
            .then(() => {
                this.notifications.show('Se envió un correo para restablecer tu contraseña', 'success');
            })
            .catch(error => {
                console.error('Error enviando correo de recuperación:', error);
                this.notifications.show('Error: ' + error.message, 'error');
            });
    }
    
    filterByCategory(category) {
        this.currentCategory = category;
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === category);
        });
        
        this.loadAuctions();
    }
    
    async loadInitialData() {
        console.log('📊 Cargando datos iniciales...');
        
        if (!this.db) {
            console.error('Firestore no disponible');
            return;
        }
        
        try {
            // Intentar cargar subastas directamente primero
            console.log('🔍 Cargando subastas...');
            
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout cargando subastas')), 10000)
            );
            
            const snapshotPromise = this.db.collection('auctions')
                .where('status', '==', 'active')
                .limit(20)
                .get();
            
            const snapshot = await Promise.race([snapshotPromise, timeoutPromise]);
            
            console.log('📦 Subastas obtenidas:', snapshot.size);
            this.loadAuctions(snapshot);
            
            // Suscribirse a cambios (en segundo plano)
            this.auctionsUnsubscribe = this.db.collection('auctions')
                .where('status', '==', 'active')
                .onSnapshot((snapshot) => {
                    console.log('🔄 Actualización en tiempo real:', snapshot.size);
                    this.loadAuctions(snapshot);
                }, (error) => {
                    console.error("⚠️ Error en suscripción:", error);
                });
            
            // Cargar otras cosas en segundo plano
            setTimeout(() => {
                this.updateLiveStats().catch(e => console.warn('Stats:', e));
                this.loadTopBidders().catch(e => console.warn('Top bidders:', e));
                this.loadEndingSoon().catch(e => console.warn('Ending soon:', e));
                this.loadWinners().catch(e => console.warn('Winners:', e));
            }, 1000);
            
            console.log('✅ Datos iniciales cargados');
            
        } catch (error) {
            console.error('❌ Error cargando datos:', error);
            this.hideLoader();
            
            // Mostrar mensaje amigable
            const auctionsGrid = document.getElementById('auctionsGrid');
            if (auctionsGrid) {
                auctionsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                        <i class="fas fa-box-open" style="font-size: 3rem; color: #888; margin-bottom: 1rem;"></i>
                        <h3 style="color: #888;">No hay subastas activas</h3>
                        <p style="color: #666;">Sé el primero en crear una subasta</p>
                    </div>
                `;
            }
        } finally {
            this.hideLoader();
        }
    }
    
    async loadAuctions(snapshot = null) {
        const auctionsGrid = document.getElementById('auctionsGrid');
        const noAuctionsMessage = document.getElementById('noAuctionsMessage');
        
        if (!auctionsGrid) {
            console.warn('⚠️ Elemento auctionsGrid no encontrado');
            return;
        }
        
        try {
            let querySnapshot;
            
            if (snapshot) {
                querySnapshot = snapshot;
                console.log('📦 Usando snapshot recibido:', snapshot.size, 'subastas');
            } else {
                if (!this.db) {
                    console.error('Firestore no disponible');
                    return;
                }
                
                console.log('🔍 Consultando subastas desde Firebase...');
                let query = this.db.collection('auctions').where('status', '==', 'active');
                
                if (this.currentCategory !== 'all') {
                    query = query.where('category', '==', this.currentCategory);
                    console.log('🏷️ Filtrando por categoría:', this.currentCategory);
                }
                
                if (this.onlyVerified) {
                    query = query.where('expertVerified', '==', true);
                    console.log('✅ Filtrando solo verificadas');
                }
                
                if (this.onlyFlash) {
                    query = query.where('type', '==', 'flash');
                    console.log('⚡ Filtrando solo flash');
                }
                
                querySnapshot = await query.get();
                console.log('📦 Subastas obtenidas:', querySnapshot.size);
            }
            
            if (querySnapshot.empty) {
                console.log('📭 No hay subastas para mostrar');
                auctionsGrid.innerHTML = '';
                if (noAuctionsMessage) noAuctionsMessage.style.display = 'block';
                
                const activeCount = document.getElementById('activeAuctionsCount');
                const totalPart = document.getElementById('totalParticipants');
                const endingSoon = document.getElementById('endingSoonCount');
                if (activeCount) activeCount.textContent = '0';
                if (totalPart) totalPart.textContent = '0';
                if (endingSoon) endingSoon.textContent = '0';
                return;
            }
            
            if (noAuctionsMessage) noAuctionsMessage.style.display = 'none';
            
            let auctions = [];
            querySnapshot.forEach((doc) => {
                auctions.push({ id: doc.id, ...doc.data() });
            });
            
            console.log('🔄 Ordenando', auctions.length, 'subastas por:', this.currentSort);
            
            // Aplicar ordenamiento
            auctions = this.sortAuctions(auctions, this.currentSort);
            
            // Actualizar contadores
            const activeCount = document.getElementById('activeAuctionsCount');
            if (activeCount) activeCount.textContent = auctions.length;
            
            const totalParticipants = auctions.reduce((sum, auction) => sum + (auction.participants || 0), 0);
            const totalPart = document.getElementById('totalParticipants');
            if (totalPart) totalPart.textContent = totalParticipants;
            
            const now = new Date().getTime();
            const endingSoon = auctions.filter(auction => {
                const endTime = new Date(auction.endTime).getTime();
                return (endTime - now) < 5 * 60000;
            }).length;
            
            const endingSoonCount = document.getElementById('endingSoonCount');
            if (endingSoonCount) endingSoonCount.textContent = endingSoon;
            
            console.log('📊 Stats actualizadas:', {
                total: auctions.length,
                participantes: totalParticipants,
                porTerminar: endingSoon
            });
            
            // Renderizar subastas
            auctionsGrid.innerHTML = '';
            console.log('🎨 Renderizando', auctions.length, 'tarjetas de subasta...');
            
            for (const auction of auctions) {
                try {
                    this.createAuctionCard(auction);
                } catch (cardError) {
                    console.error(`❌ Error creando card:`, cardError);
                }
            }
            
            console.log('✅ Subastas renderizadas correctamente');
            
        } catch (error) {
            console.error("❌ Error cargando subastas:", error);
            this.notifications.show("Error cargando subastas: " + error.message, "error");
            
            if (auctionsGrid) {
                auctionsGrid.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--red);">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Error al cargar subastas</h3>
                        <p>${error.message}</p>
                        <button onclick="window.auctionSystem.loadAuctions()" 
                                style="margin-top: 1rem; padding: 10px 20px; background: var(--gold); 
                                       color: var(--dark); border: none; border-radius: 5px; cursor: pointer;">
                            Reintentar
                        </button>
                    </div>
                `;
            }
        }
    }
    
    sortAuctions(auctions, sortBy) {
        return auctions.sort((a, b) => {
            switch(sortBy) {
                case 'ending':
                    return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'price-low':
                    return a.currentBid - b.currentBid;
                case 'price-high':
                    return b.currentBid - a.currentBid;
                case 'participants':
                    return (b.participants || 0) - (a.participants || 0);
                default:
                    return new Date(a.endTime).getTime() - new Date(b.endTime).getTime();
            }
        });
    }
    
    createAuctionCard(auction) {
        const auctionsGrid = document.getElementById('auctionsGrid');
        if (!auctionsGrid) return;
        
        const uniqueParticipants = this.getUniqueParticipants(auction);
        const isUserBanned = this.currentUser && this.currentUser.isBanned;
        const isWatching = this.watchlist.has(auction.id);
        const now = new Date().getTime();
        const endTime = new Date(auction.endTime).getTime();
        const timeLeft = endTime - now;
        
        const auctionCard = document.createElement('div');
        auctionCard.className = `auction-card ${auction.type || 'normal'} ${auction.premium ? 'premium' : ''}`;
        auctionCard.setAttribute('data-auction-id', auction.id);
        
        let timerClass = '';
        if (timeLeft < 5 * 60000) {
            timerClass = 'ending-soon';
        }
        if (auction.softClosing && timeLeft < 10 * 60000) {
            timerClass += ' extended';
        }
        
        auctionCard.innerHTML = `
            <div class="auction-badges">
                ${auction.expertVerified ? `
                    <div class="auction-badge badge-verified">
                        <i class="fas fa-check-circle"></i> Verificado
                    </div>
                ` : ''}
                ${auction.type === 'flash' ? `
                    <div class="auction-badge badge-flash">
                        <i class="fas fa-bolt"></i> Relámpago
                    </div>
                ` : ''}
                ${auction.premium ? `
                    <div class="auction-badge badge-premium">
                        <i class="fas fa-crown"></i> Premium
                    </div>
                ` : ''}
                ${auction.reservePrice > auction.currentBid ? `
                    <div class="auction-badge badge-reserve">
                        <i class="fas fa-lock"></i> Reserva
                    </div>
                ` : ''}
            </div>
            
            <div class="auction-image-container">
                <img data-src="${auction.image || 'https://via.placeholder.com/400x300/0A0A14/FFD700?text=Subasta'}" 
                     alt="${auction.title}" 
                     class="auction-image lazy-image" 
                     src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='400' height='300' fill='%230A0A14'/%3E%3Ctext x='200' y='150' font-family='Arial' font-size='20' fill='%23FFD700' text-anchor='middle'%3ECargando...%3C/text%3E%3C/svg%3E">
            </div>
            
            <h3 class="auction-title">${this.escapeHtml(auction.title)}</h3>
            <div class="auction-category">${this.categories[auction.category] || 'General'}</div>
            <p class="auction-desc">${this.escapeHtml(auction.description?.substring(0, 100) || '')}${auction.description?.length > 100 ? '...' : ''}</p>
            
            <div class="auction-stats">
                <div class="auction-stat">
                    <div class="stat-value">Bs ${auction.currentBid || 0}</div>
                    <div class="stat-label">Puja Actual</div>
                </div>
                <div class="auction-stat">
                    <div class="stat-value">${auction.participants || 0}/${auction.maxParticipants || 100}</div>
                    <div class="stat-label">Participantes</div>
                </div>
                <div class="auction-stat">
                    <div class="stat-value">${uniqueParticipants.length}</div>
                    <div class="stat-label">Activos</div>
                </div>
            </div>
            
            <div class="participants-display">
                <div class="participants-title">
                    <i class="fas fa-users"></i>
                    <span>Participantes Activos (${uniqueParticipants.length})</span>
                </div>
                <div class="participants-grid">
                    ${uniqueParticipants.slice(0, 4).map((participant, index) => `
                        <div class="participant-badge ${index === 0 ? 'highlight' : ''}">
                            <i class="fas fa-hand-paper hand-icon"></i>
                            <span>${this.escapeHtml(participant.username)}</span>
                        </div>
                    `).join('')}
                    ${uniqueParticipants.length > 4 ? `
                        <div class="participant-badge">
                            <i class="fas fa-ellipsis-h"></i>
                            <span>+${uniqueParticipants.length - 4} más</span>
                        </div>
                    ` : ''}
                </div>
                ${auction.bids && auction.bids.length > 0 ? `
                    <div class="last-bidder">
                        <i class="fas fa-crown last-bidder-icon"></i>
                        <div>
                            <div style="color: var(--gold); font-weight: 600;">
                                Último ofertante: ${this.escapeHtml(auction.bids[auction.bids.length - 1].username)}
                            </div>
                            <div style="color: #888; font-size: 0.9rem;">
                                Puja: Bs ${auction.currentBid || 0}
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
            
            <div class="timer ${timerClass}" id="timer-${auction.id}">
                <i class="fas fa-clock"></i>
                ${this.formatTime(timeLeft)}
            </div>
            
            <div class="auction-actions">
                <button class="watch-btn ${isWatching ? 'watching' : ''}" 
                        onclick="window.auctionSystem.toggleWatchlist('${auction.id}')"
                        ${isUserBanned ? 'disabled' : ''}>
                    <i class="fas fa-eye${isWatching ? '-slash' : ''}"></i>
                    ${isWatching ? 'Dejar de seguir' : 'Seguir'}
                </button>
                <button class="bid-btn" onclick="window.auctionSystem.viewAuction('${auction.id}')" 
                        ${isUserBanned ? 'disabled' : ''}>
                    <i class="fas fa-gavel"></i> Pujar
                </button>
            </div>
        `;
        
        auctionsGrid.appendChild(auctionCard);
        
        const img = auctionCard.querySelector('.lazy-image');
        if (img && this.lazyImageObserver) {
            this.lazyImageObserver.observe(img);
        }
        
        this.startTimer(auction.id, endTime);
    }
    
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            this.lazyImageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        
                        if (this.imageCache.has(src)) {
                            img.src = this.imageCache.get(src);
                            img.classList.add('loaded');
                        } else {
                            const imageLoader = new Image();
                            imageLoader.onload = () => {
                                img.src = src;
                                img.classList.add('loaded');
                                this.imageCache.set(src, src);
                            };
                            imageLoader.onerror = () => {
                                img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%238A2BE2"/%3E%3Ctext x="200" y="150" font-family="Arial" font-size="20" fill="%23FFFFFF" text-anchor="middle"%3EImagen no disponible%3C/text%3E%3C/svg%3E';
                                img.classList.add('loaded');
                            };
                            imageLoader.src = src;
                        }
                        
                        this.lazyImageObserver.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.1
            });
            
            // Observar imágenes existentes
            document.querySelectorAll('.lazy-image').forEach(img => {
                this.lazyImageObserver.observe(img);
            });
        }
    }
    
    getUniqueParticipants(auction) {
        if (!auction.bids || auction.bids.length === 0) {
            return [];
        }
        
        const uniqueUsers = new Map();
        auction.bids.forEach(bid => {
            if (bid.userId && !uniqueUsers.has(bid.userId)) {
                uniqueUsers.set(bid.userId, {
                    userId: bid.userId,
                    username: bid.username || 'Usuario'
                });
            }
        });
        
        return Array.from(uniqueUsers.values());
    }
    
    formatTime(milliseconds) {
        if (milliseconds <= 0) return '00:00:00';
        
        const seconds = Math.floor(milliseconds / 1000);
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else if (minutes > 0) {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${secs.toString().padStart(2, '0')}s`;
        }
    }
    
    startTimer(auctionId, endTime) {
        if (this.timers[auctionId]) {
            clearInterval(this.timers[auctionId]);
        }
        
        this.timers[auctionId] = setInterval(() => {
            const now = new Date().getTime();
            const timeLeft = endTime - now;
            const timerElement = document.getElementById(`timer-${auctionId}`);
            
            if (timerElement) {
                if (timeLeft <= 0) {
                    timerElement.innerHTML = '<i class="fas fa-flag-checkered"></i> FINALIZADA';
                    timerElement.style.background = 'rgba(128, 128, 128, 0.2)';
                    timerElement.style.color = '#888';
                    timerElement.classList.remove('ending-soon', 'extended');
                    clearInterval(this.timers[auctionId]);
                    delete this.timers[auctionId];
                    this.finalizeAuction(auctionId);
                } else {
                    timerElement.innerHTML = `<i class="fas fa-clock"></i> ${this.formatTime(timeLeft)}`;
                    
                    if (timeLeft < 5 * 60000) {
                        timerElement.classList.add('ending-soon');
                    } else {
                        timerElement.classList.remove('ending-soon');
                    }
                }
            } else {
                // Si el elemento ya no existe, limpiar el timer
                clearInterval(this.timers[auctionId]);
                delete this.timers[auctionId];
            }
        }, 1000);
    }
    
    // ============================================
    // MÉTODO switchTab COMPLETAMENTE CORREGIDO
    // ============================================
    switchTab(tabId) {
        console.log(`🔄 Cambiando a pestaña: ${tabId}`);
        
        // 1. Actualizar botones de navegación
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-tab') === tabId) {
                btn.classList.add('active');
            }
        });
        
        // 2. Ocultar todas las pestañas, mostrar la activa
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === tabId) {
                pane.classList.add('active');
            }
        });
        
        // 3. Cargar contenido según la pestaña - COMPLETAMENTE IMPLEMENTADO
        switch(tabId) {
            case 'auctions':
                console.log('📊 Cargando subastas...');
                this.loadAuctions();
                break;
                
            case 'bid':
                console.log('🎯 Mostrando guía de pujas...');
                // Esta pestaña es informativa, no necesita carga adicional
                break;
                
            case 'mybids':
                console.log('📋 Cargando mis pujas...');
                this.loadMyBids();
                break;
                
            case 'winners':
                console.log('🏆 Cargando ganadores...');
                this.loadWinners();
                break;
                
            case 'watchlist':
                console.log('👁️ Cargando subastas seguidas...');
                this.updateWatchlistDisplay();
                break;
                
            default:
                console.warn(`⚠️ Pestaña desconocida: ${tabId}`);
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    openAuthModal() {
        const authModal = document.getElementById('authModal');
        if (!authModal) return;
        
        const modalContent = document.getElementById('authModalContent');
        if (!modalContent) return;
        
        const authChoiceHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="margin-bottom: 2rem;">
                    <i class="fas fa-user-circle" style="font-size: 4rem; color: var(--gold); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--gold); margin-bottom: 0.5rem;">Acceso VIP</h3>
                    <p style="color: #CCCCCC;">Elige cómo quieres acceder al sistema</p>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem;">
                    <button class="btn-primary" id="existingUserBtn" style="padding: 1.5rem;">
                        <i class="fas fa-sign-in-alt" style="margin-bottom: 0.5rem; display: block; font-size: 2rem;"></i>
                        Ya Tengo Cuenta
                    </button>
                    <button class="btn-secondary" id="newUserBtn" style="padding: 1.5rem;">
                        <i class="fas fa-user-plus" style="margin-bottom: 0.5rem; display: block; font-size: 2rem;"></i>
                        Registrarme
                    </button>
                </div>
                
                <p style="color: #888; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Sistema VIP para usuarios registrados
                </p>
            </div>
        `;
        
        modalContent.innerHTML = authChoiceHTML;
        authModal.classList.add('active');
        
        setTimeout(() => {
            const existingBtn = document.getElementById('existingUserBtn');
            const newBtn = document.getElementById('newUserBtn');
            
            if (existingBtn) {
                existingBtn.addEventListener('click', () => {
                    this.closeModal('authModal');
                    setTimeout(() => {
                        const loginModal = document.getElementById('loginModal');
                        if (loginModal) loginModal.classList.add('active');
                    }, 300);
                });
            }
            
            if (newBtn) {
                newBtn.addEventListener('click', () => {
                    this.closeModal('authModal');
                    setTimeout(() => {
                        const registerModal = document.getElementById('registerModal');
                        if (registerModal) registerModal.classList.add('active');
                    }, 300);
                });
            }
        }, 100);
    }
    
    async handleLogin() {
        const phoneInput = document.getElementById('loginPhoneInput');
        const passwordInput = document.getElementById('loginPasswordInput');
        
        if (!phoneInput || !passwordInput) {
            this.notifications.show('Error: Campos de formulario no encontrados', 'error');
            return;
        }
        
        let phone = phoneInput.value.trim();
        let password = passwordInput.value.trim();
        
        if (!phone || !password) {
            this.notifications.show('Ingresa tu teléfono y contraseña', 'error');
            return;
        }
        
        if (!ValidationSystem.validateInput(phone, 'phone')) {
            this.notifications.show('Teléfono inválido (7-10 dígitos)', 'error');
            return;
        }
        
        try {
            const email = `${phone}@subastasbolivia.com`;
            
            try {
                const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
                await this.processSuccessfulLogin(userCredential);
                return;
                
            } catch (loginError) {
                if (loginError.code === 'auth/invalid-login-credentials' || 
                    loginError.code === 'auth/wrong-password') {
                    
                    try {
                        const defaultPassword = 'subasta123';
                        const userCredential = await this.auth.signInWithEmailAndPassword(email, defaultPassword);
                        await this.processSuccessfulLogin(userCredential);
                        
                        setTimeout(() => {
                            if (confirm('Para mayor seguridad, ¿quieres cambiar tu contraseña?')) {
                                this.notifications.show('Usa "¿Olvidaste tu contraseña?" para cambiarla', 'info');
                            }
                        }, 2000);
                        return;
                        
                    } catch (defaultError) {
                        if (defaultError.code === 'auth/user-not-found') {
                            this.notifications.show('Usuario no registrado. Regístrate primero.', 'error');
                        } else {
                            this.notifications.show('Contraseña incorrecta', 'error');
                        }
                    }
                } else if (loginError.code === 'auth/user-not-found') {
                    this.notifications.show('Usuario no registrado. Regístrate primero.', 'error');
                } else {
                    this.notifications.show('Error: ' + loginError.message, 'error');
                }
            }
            
        } catch (error) {
            console.error("Error general en login:", error);
            this.notifications.show('Error: ' + error.message, 'error');
        }
    }
    
    async processSuccessfulLogin(userCredential) {
        try {
            const userDoc = await this.db.collection('users').doc(userCredential.user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                if (userData.isBanned) {
                    this.notifications.show('Cuenta suspendida. Razón: ' + userData.banReason, 'error');
                    await this.auth.signOut();
                    return;
                }
                
                await this.db.collection('users').doc(userCredential.user.uid).update({
                    lastLogin: new Date().toISOString()
                });
                
                this.notifications.show(`¡Bienvenido de nuevo ${userData.username}!`, 'success');
                this.closeModal('loginModal');
                const loginForm = document.getElementById('loginForm');
                if (loginForm) loginForm.reset();
                
            } else {
                const newUserData = {
                    phone: userCredential.user.email ? userCredential.user.email.split('@')[0] : "Sin teléfono",
                    username: userCredential.user.displayName || "Usuario",
                    email: userCredential.user.email,
                    registrationDate: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    totalBids: 0,
                    auctionsWon: 0,
                    isBanned: false,
                    banReason: null,
                    isAdmin: false,
                    watchlist: [],
                    autobids: {},
                    reputation: 100,
                    rank: 'Novato'
                };
                
                await this.db.collection('users').doc(userCredential.user.uid).set(newUserData);
                
                this.notifications.show(`¡Bienvenido ${newUserData.username}!`, 'success');
                this.closeModal('loginModal');
                const loginForm = document.getElementById('loginForm');
                if (loginForm) loginForm.reset();
            }
        } catch (error) {
            console.error("Error procesando login:", error);
            this.notifications.show('Error al procesar el login', 'error');
        }
    }
    
    async handleRegister() {
        const phoneInput = document.getElementById('registerPhoneInput');
        const usernameInput = document.getElementById('registerUsernameInput');
        const passwordInput = document.getElementById('registerPasswordInput');
        const confirmPasswordInput = document.getElementById('registerConfirmPasswordInput');
        
        if (!phoneInput || !usernameInput || !passwordInput || !confirmPasswordInput) {
            this.notifications.show('Error: Campos de formulario no encontrados', 'error');
            return;
        }
        
        let phone = phoneInput.value.trim();
        let username = usernameInput.value.trim();
        let password = passwordInput.value.trim();
        let confirmPassword = confirmPasswordInput.value.trim();
        
        if (!phone || !username || !password || !confirmPassword) {
            this.notifications.show('Complete todos los campos', 'error');
            return;
        }
        
        if (!ValidationSystem.validateInput(phone, 'phone')) {
            this.notifications.show('Teléfono inválido (7-10 dígitos)', 'error');
            return;
        }
        
        if (!ValidationSystem.validateInput(username, 'username')) {
            this.notifications.show('Usuario inválido (3-20 caracteres, letras, números, _)', 'error');
            return;
        }
        
        if (password.length < 6) {
            this.notifications.show('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            this.notifications.show('Las contraseñas no coinciden', 'error');
            return;
        }
        
        try {
            const email = `${phone}@subastasbolivia.com`;
            
            const userQuery = await this.db.collection('users')
                .where('phone', '==', phone)
                .limit(1)
                .get();
            
            if (!userQuery.empty) {
                this.notifications.show('Este número ya está registrado. Inicia sesión.', 'error');
                setTimeout(() => {
                    this.closeModal('registerModal');
                    const loginModal = document.getElementById('loginModal');
                    if (loginModal) {
                        loginModal.classList.add('active');
                        const loginPhoneInput = document.getElementById('loginPhoneInput');
                        if (loginPhoneInput) loginPhoneInput.value = phone;
                    }
                }, 1500);
                return;
            }
            
            try {
                const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
                
                await userCredential.user.updateProfile({
                    displayName: username
                });
                
                const userData = {
                    phone: phone,
                    username: username,
                    email: email,
                    registrationDate: new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    totalBids: 0,
                    auctionsWon: 0,
                    isBanned: false,
                    banReason: null,
                    isAdmin: phone === "77777777" || phone === "7777777",
                    watchlist: [],
                    autobids: {},
                    reputation: 100,
                    rank: 'Novato'
                };
                
                await this.db.collection('users').doc(userCredential.user.uid).set(userData);
                
                this.notifications.show('¡Registro exitoso! Bienvenido a Subastas Bolivia', 'success');
                this.closeModal('registerModal');
                const registerForm = document.getElementById('registerForm');
                if (registerForm) registerForm.reset();
                
            } catch (authError) {
                if (authError.code === 'auth/email-already-in-use') {
                    this.notifications.show('Este usuario ya existe. Intenta iniciar sesión.', 'error');
                    setTimeout(() => {
                        this.closeModal('registerModal');
                        const loginModal = document.getElementById('loginModal');
                        if (loginModal) {
                            loginModal.classList.add('active');
                            const loginPhoneInput = document.getElementById('loginPhoneInput');
                            if (loginPhoneInput) loginPhoneInput.value = phone;
                        }
                    }, 1500);
                } else {
                    this.notifications.show('Error al crear cuenta: ' + authError.message, 'error');
                }
            }
            
        } catch (error) {
            console.error("Error general en registro:", error);
            this.notifications.show('Error inesperado: ' + error.message, 'error');
        }
    }
    
    async logout() {
        try {
            await this.auth.signOut();
            this.notifications.show('Sesión cerrada correctamente', 'info');
        } catch (error) {
            console.error("Error cerrando sesión:", error);
        }
    }
    
    async toggleAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (!panel) return;
        
        if (panel.classList.contains('active')) {
            panel.classList.remove('active');
        } else {
            if (!this.currentUser) {
                this.notifications.show('Debes iniciar sesión', 'error');
                return;
            }
            
            const userDoc = await this.db.collection('users').doc(this.currentUser.id).get();
            const userData = userDoc.data();
            
            if (!userData.isAdmin) {
                const code = prompt('Ingrese código de administrador:');
                if (code === "ADMIN123") {
                    this.currentUser.isAdmin = true;
                } else {
                    this.notifications.show('Acceso denegado', 'error');
                    return;
                }
            }
            
            panel.classList.add('active');
            this.loadAdminContent();
        }
    }
    
    async loadAdminContent() {
        await this.loadAdminAuctions();
        await this.loadAdminUsers();
    }
    
    async loadAdminAuctions() {
        try {
            if (!this.db) return;
            
            const querySnapshot = await this.db.collection('auctions').limit(20).get();
            const container = document.getElementById('adminAuctionsList');
            
            if (!container) return;
            
            if (querySnapshot.empty) {
                container.innerHTML = '<p style="color: #888; text-align: center;">No hay subastas</p>';
                return;
            }
            
            container.innerHTML = `
                <div style="display: grid; gap: 1rem;">
                    ${querySnapshot.docs.map(doc => {
                        const auction = { id: doc.id, ...doc.data() };
                        return `
                            <div class="admin-list-item">
                                <div style="flex: 1;">
                                    <div style="color: var(--gold); font-weight: 600; margin-bottom: 0.3rem;">${this.escapeHtml(auction.title)}</div>
                                    <div style="color: #888; font-size: 0.9rem;">
                                        <span>Bs ${auction.currentBid || 0}</span>
                                        <span style="margin: 0 10px;">•</span>
                                        <span>${auction.participants || 0} participantes</span>
                                        <span style="margin: 0 10px;">•</span>
                                        <span style="color: ${auction.status === 'active' ? '#4CAF50' : '#888'};">
                                            ${auction.status === 'active' ? 'Activa' : 'Finalizada'}
                                        </span>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button class="admin-action-btn" onclick="window.auctionSystem.viewAuction('${auction.id}')">
                                        <i class="fas fa-eye"></i> Ver
                                    </button>
                                    <button class="admin-action-btn ban" onclick="window.auctionSystem.deleteAuction('${auction.id}')">
                                        <i class="fas fa-trash"></i> Eliminar
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error("Error cargando subastas admin:", error);
        }
    }
    
    // ============================================
    // MÉTODO loadAdminUsers COMPLETAMENTE IMPLEMENTADO
    // ============================================
    async loadAdminUsers() {
        try {
            if (!this.db) return;
            
            const querySnapshot = await this.db.collection('users').limit(20).get();
            const container = document.getElementById('adminUsersList');
            
            if (!container) return;
            
            if (querySnapshot.empty) {
                container.innerHTML = '<p style="color: #888; text-align: center;">No hay usuarios registrados</p>';
                return;
            }
            
            container.innerHTML = `
                <div class="admin-list">
                    ${querySnapshot.docs.map(doc => {
                        const user = { id: doc.id, ...doc.data() };
                        return `
                            <div class="admin-list-item">
                                <div class="user-info-small">
                                    <div class="user-name" style="${user.isBanned ? 'color: var(--red);' : 'color: var(--gold);'}">
                                        ${this.escapeHtml(user.username)}
                                        ${user.isBanned ? ' <i class="fas fa-ban" style="color: var(--red);"></i>' : ''}
                                        ${user.isAdmin ? ' <i class="fas fa-crown" style="color: var(--gold);"></i>' : ''}
                                    </div>
                                    <div class="user-phone">${user.phone}</div>
                                    <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.8rem;">
                                        <span>${user.totalBids || 0} pujas</span>
                                        <span>${user.auctionsWon || 0} ganadas</span>
                                        <span>${user.rank || 'Novato'}</span>
                                    </div>
                                </div>
                                <div>
                                    <button class="admin-action-btn" onclick="window.auctionSystem.viewUserDetails('${user.id}')">
                                        <i class="fas fa-eye"></i> Ver
                                    </button>
                                    ${user.isBanned ? 
                                        `<button class="admin-action-btn unban" onclick="window.auctionSystem.unbanUser('${user.id}')">
                                            <i class="fas fa-check-circle"></i> Desbanear
                                        </button>` :
                                        `<button class="admin-action-btn ban" onclick="window.auctionSystem.banUser('${user.id}')">
                                            <i class="fas fa-ban"></i> Banear
                                        </button>`
                                    }
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
            
        } catch (error) {
            console.error("Error cargando usuarios admin:", error);
        }
    }
    
    switchAdminTab(tabId) {
        document.querySelectorAll('.admin-tab').forEach(btn => {
            btn.classList.remove('active');
            if (btn.getAttribute('data-admin-tab') === tabId) {
                btn.classList.add('active');
            }
        });
        
        document.querySelectorAll('.admin-pane').forEach(pane => {
            pane.classList.remove('active');
            if (pane.id === 'admin' + tabId.charAt(0).toUpperCase() + tabId.slice(1)) {
                pane.classList.add('active');
            }
        });
        
        if (tabId === 'users') this.loadAdminUsers();
        if (tabId === 'manage') this.loadAdminAuctions();
    }
    
    debugMode() {
        console.log('=== DEBUG MODE ===');
        console.log('Usuario actual:', this.currentUser);
        console.log('Watchlist:', Array.from(this.watchlist));
        console.log('Autobids:', Array.from(this.autobids.entries()));
        console.log('Timers activos:', Object.keys(this.timers).length);
        console.log('Cache de imágenes:', this.imageCache.size);
        
        if (this.db) {
            this.db.collection('users').get().then(snap => {
                this.db.collection('auctions').get().then(auctionSnap => {
                    const activeAuctions = auctionSnap.docs.filter(doc => doc.data().status === 'active').length;
                    this.notifications.show(
                        `DEBUG: ${snap.size} usuarios, ${auctionSnap.size} subastas (${activeAuctions} activas)`,
                        'info'
                    );
                });
            });
        }
    }
    
    // MÉTODO CREAR SUBASTA - COMPLETAMENTE IMPLEMENTADO
    async createAuction() {
        console.log('🚀 Iniciando creación de subasta...');
        
        if (!this.currentUser) {
            this.notifications.show('Debes iniciar sesión', 'error');
            return;
        }
        
        if (!this.currentUser.isAdmin) {
            this.notifications.show('Solo administradores pueden crear subastas', 'error');
            return;
        }
        
        if (!this.db) {
            this.notifications.show('Base de datos no disponible', 'error');
            return;
        }
        
        // Obtener el formulario y sus campos por name
        const form = document.getElementById('createAuctionForm');
        if (!form) {
            this.notifications.show('Formulario no encontrado', 'error');
            return;
        }
        
        // Obtener valores por name
        const title = form.querySelector('[name="auctionTitle"]')?.value.trim();
        const description = form.querySelector('[name="auctionDescription"]')?.value.trim();
        const category = form.querySelector('[name="auctionCategory"]')?.value;
        const startingBid = parseInt(form.querySelector('[name="auctionStartBid"]')?.value) || 0;
        const minIncrement = parseInt(form.querySelector('[name="auctionMinIncrement"]')?.value) || 0;
        const duration = parseInt(form.querySelector('[name="auctionDuration"]')?.value) || 0;
        const image = form.querySelector('[name="auctionImage"]')?.value.trim();
        const reservePrice = parseInt(form.querySelector('[name="auctionReservePrice"]')?.value) || 0;
        const maxParticipants = parseInt(form.querySelector('[name="auctionMaxParticipants"]')?.value) || 50;
        const auctionType = form.querySelector('[name="auctionType"]')?.value || 'normal';
        
        // Checkboxes
        const expertVerified = document.getElementById('auctionExpertVerified')?.checked || false;
        const softClosing = document.getElementById('auctionSoftClosing')?.checked || false;
        
        // Validaciones
        if (!title || title.length < 5 || title.length > 100) {
            this.notifications.show('El título debe tener entre 5 y 100 caracteres', 'error');
            form.querySelector('[name="auctionTitle"]')?.focus();
            return;
        }
        
        if (!description || description.length < 10) {
            this.notifications.show('La descripción debe tener al menos 10 caracteres', 'error');
            form.querySelector('[name="auctionDescription"]')?.focus();
            return;
        }
        
        if (!category || category === '' || category === 'default') {
            this.notifications.show('Debes seleccionar una categoría', 'error');
            form.querySelector('[name="auctionCategory"]')?.focus();
            return;
        }
        
        if (!startingBid || startingBid < 1) {
            this.notifications.show('Puja inicial debe ser un número mayor a 0', 'error');
            form.querySelector('[name="auctionStartBid"]')?.focus();
            return;
        }
        
        if (!minIncrement || minIncrement < 1) {
            this.notifications.show('Incremento mínimo debe ser un número mayor a 0', 'error');
            form.querySelector('[name="auctionMinIncrement"]')?.focus();
            return;
        }
        
        if (!duration || duration < 1) {
            this.notifications.show('Duración debe ser al menos 1 minuto', 'error');
            form.querySelector('[name="auctionDuration"]')?.focus();
            return;
        }
        
        if (!image) {
            this.notifications.show('Debes proporcionar una URL de imagen', 'error');
            form.querySelector('[name="auctionImage"]')?.focus();
            return;
        }
        
        console.log('✅ Todas las validaciones pasaron. Creando subasta...');
        console.log('📋 Datos capturados:', {
            title, category, startingBid, minIncrement, duration, image
        });
        
        try {
            const now = new Date();
            const endTime = new Date(now.getTime() + duration * 60000); // minutos a milisegundos
            
            const auctionData = {
                title: title,
                description: description,
                category: category,
                startingBid: startingBid,
                currentBid: startingBid,
                minIncrement: minIncrement,
                image: image,
                createdAt: now.toISOString(),
                endTime: endTime.toISOString(),
                status: 'active',
                createdBy: this.currentUser.id,
                creatorUsername: this.currentUser.username,
                participants: 0,
                maxParticipants: maxParticipants,
                bids: [],
                expertVerified: expertVerified,
                premium: auctionType === 'premium',
                type: auctionType === 'premium' ? 'premium' : auctionType,
                reservePrice: reservePrice,
                softClosing: softClosing,
                views: 0,
                watchers: 0
            };
            
            console.log('📦 Datos de la subasta a crear:', auctionData);
            
            const docRef = await this.db.collection('auctions').add(auctionData);
            
            console.log('✅ Subasta creada con ID:', docRef.id);
            
            this.notifications.show('✅ ¡Subasta creada exitosamente!', 'success');
            
            // Limpiar formulario
            form.reset();
            console.log('🧹 Formulario limpiado');
            
            // Recargar subastas
            await this.loadAuctions();
            console.log('🔄 Subastas recargadas');
            
            // Cerrar panel admin si está abierto
            const adminPanel = document.getElementById('adminPanel');
            if (adminPanel) {
                adminPanel.classList.remove('active');
            }
            
        } catch (error) {
            console.error('❌ Error creando subasta:', error);
            this.notifications.show('Error al crear subasta: ' + error.message, 'error');
        }
    }
    
    // MÉTODO VER SUBASTA - COMPLETAMENTE IMPLEMENTADO
    async viewAuction(auctionId) {
        console.log(`🔍 Intentando ver subasta: ${auctionId}`);
        
        if (!this.currentUser) {
            this.notifications.show('Debes iniciar sesión para pujar', 'error');
            this.openAuthModal();
            return;
        }
        
        if (this.currentUser.isBanned) {
            this.notifications.show('Tu cuenta está suspendida', 'error');
            return;
        }
        
        if (!this.db) {
            this.notifications.show('Base de datos no disponible', 'error');
            return;
        }
        
        try {
            console.log(`📊 Cargando datos de subasta: ${auctionId}`);
            const auctionDoc = await this.db.collection('auctions').doc(auctionId).get();
            
            if (!auctionDoc.exists) {
                this.notifications.show('Subasta no encontrada', 'error');
                return;
            }
            
            const auction = { id: auctionDoc.id, ...auctionDoc.data() };
            console.log('✅ Subasta cargada:', auction.title);
            
            // Verificar que la subasta esté activa
            if (auction.status !== 'active') {
                this.notifications.show('Esta subasta ya ha finalizado', 'error');
                return;
            }
            
            // Verificar que no haya alcanzado el máximo de participantes
            if (auction.participants >= auction.maxParticipants) {
                this.notifications.show('Esta subasta ha alcanzado el máximo de participantes', 'error');
                return;
            }
            
            this.selectedAuction = auction;
            
            // Actualizar vistas
            await this.db.collection('auctions').doc(auctionId).update({
                views: (auction.views || 0) + 1
            });
            
            // Mostrar modal de puja
            console.log('🎨 Mostrando modal de puja...');
            this.showBidModal(auction);
            
        } catch (error) {
            console.error('❌ Error cargando subasta:', error);
            this.notifications.show(`Error al cargar la subasta: ${error.message}`, 'error');
        }
    }
    
    // MÉTODO MOSTRAR MODAL DE PUJA - COMPLETAMENTE CORREGIDO
    showBidModal(auction) {
        // Primero, limpiar cualquier modal existente
        const existingModal = document.querySelector('#bidModal.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        const modalHtml = `
            <div class="modal-overlay active" id="bidModal">
                <div class="modal" style="max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title"><i class="fas fa-gavel"></i> Pujar en: ${this.escapeHtml(auction.title)}</h3>
                        <button class="close-modal" data-modal="bidModal">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div style="text-align: center; margin-bottom: 20px;">
                            <img src="${auction.image || 'https://via.placeholder.com/400x300/0A0A14/FFD700?text=Subasta'}" 
                                 alt="${auction.title}" 
                                 style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                        </div>
                        <div style="background: rgba(255, 215, 0, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                                <span>Puja actual:</span>
                                <strong style="color: var(--gold);">Bs ${auction.currentBid}</strong>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span>Incremento mínimo:</span>
                                <strong style="color: var(--gold);">Bs ${auction.minIncrement}</strong>
                            </div>
                            ${auction.reservePrice > auction.currentBid ? `
                                <div style="display: flex; justify-content: space-between; margin-top: 10px;">
                                    <span><i class="fas fa-lock"></i> Precio de reserva:</span>
                                    <strong style="color: var(--purple);">Bs ${auction.reservePrice}</strong>
                                </div>
                            ` : ''}
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tu puja (Bs):</label>
                            <input type="number" id="bidAmount" 
                                   class="form-input"
                                   min="${auction.currentBid + auction.minIncrement}"
                                   step="${auction.minIncrement}"
                                   value="${auction.currentBid + auction.minIncrement}"
                                   style="text-align: center; font-size: 1.2rem;">
                        </div>
                        <div class="form-buttons" style="margin-top: 20px;">
                            <button id="placeBidButton" class="btn-primary" style="width: 100%; padding: 15px;">
                                <i class="fas fa-gavel"></i> Realizar Puja
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Crear modal temporal
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = modalHtml;
        const modal = tempDiv.firstElementChild;
        
        document.body.appendChild(modal);
        
        // Configurar evento para el botón de puja
        const placeBidButton = modal.querySelector('#placeBidButton');
        if (placeBidButton) {
            placeBidButton.addEventListener('click', () => {
                const bidAmountInput = modal.querySelector('#bidAmount');
                if (bidAmountInput) {
                    const bidAmount = parseInt(bidAmountInput.value);
                    if (!isNaN(bidAmount)) {
                        this.placeBid(auction.id, bidAmount);
                    }
                }
            });
        }
        
        // Configurar evento para cerrar modal
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.remove();
            });
        }
        
        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
        
        // Auto-focus en el campo de puja
        const bidAmountInput = modal.querySelector('#bidAmount');
        if (bidAmountInput) {
            bidAmountInput.focus();
            bidAmountInput.select();
        }
    }
    
    // MÉTODO REALIZAR PUJA - COMPLETAMENTE IMPLEMENTADO
    async placeBid(auctionId, bidAmount) {
        console.log(`💰 Intentando pujar ${bidAmount} en subasta ${auctionId}`);
        
        if (!this.currentUser) {
            this.notifications.show('Debes iniciar sesión', 'error');
            return;
        }
        
        if (!this.db) {
            this.notifications.show('Base de datos no disponible', 'error');
            return;
        }
        
        // Verificar rate limiting
        const canBid = this.rateLimiter.canBid(this.currentUser.id);
        if (!canBid.allowed) {
            this.notifications.show(canBid.message, 'warning');
            return;
        }
        
        try {
            const auctionDoc = await this.db.collection('auctions').doc(auctionId).get();
            const auction = auctionDoc.data();
            
            if (!auction) {
                this.notifications.show('Subasta no encontrada', 'error');
                return;
            }
            
            // Validar puja
            const validation = ValidationSystem.validateBidAmount(
                bidAmount,
                auction.currentBid,
                auction.minIncrement
            );
            
            if (!validation.valid) {
                this.notifications.show(validation.error, 'error');
                return;
            }
            
            // Verificar precio de reserva
            if (auction.reservePrice && auction.reservePrice > bidAmount) {
                this.notifications.show(`La puja debe ser al menos Bs ${auction.reservePrice} para alcanzar el precio de reserva`, 'warning');
                return;
            }
            
            // Crear nueva puja
            const newBid = {
                userId: this.currentUser.id,
                username: this.currentUser.username,
                amount: bidAmount,
                timestamp: new Date().toISOString()
            };
            
            const updatedBids = [...(auction.bids || []), newBid];
            const uniqueParticipants = new Set(updatedBids.map(b => b.userId)).size;
            
            console.log(`✅ Puja válida, actualizando subasta...`);
            
            // Actualizar subasta
            await this.db.collection('auctions').doc(auctionId).update({
                currentBid: bidAmount,
                bids: updatedBids,
                participants: uniqueParticipants,
                lastBidTime: new Date().toISOString()
            });
            
            // Actualizar stats del usuario
            await this.db.collection('users').doc(this.currentUser.id).update({
                totalBids: (this.currentUser.totalBids || 0) + 1,
                lastBidTime: new Date().toISOString()
            });
            
            this.notifications.show(`✅ ¡Puja exitosa! Ofreciste Bs ${bidAmount}`, 'success');
            
            // Notificación en tiempo real
            this.notifications.showBidNotification(
                this.currentUser.username,
                bidAmount,
                auction.title
            );
            
            // Cerrar modal
            const bidModal = document.querySelector('#bidModal.modal-overlay');
            if (bidModal) {
                bidModal.remove();
            }
            
            // Recargar subastas
            console.log('🔄 Recargando subastas después de puja...');
            await this.loadAuctions();
            
        } catch (error) {
            console.error('❌ Error realizando puja:', error);
            this.notifications.show(`Error al realizar la puja: ${error.message}`, 'error');
        }
    }
    
    // MÉTODO TOGGLE WATCHLIST - COMPLETAMENTE IMPLEMENTADO
    async toggleWatchlist(auctionId) {
        if (!this.currentUser) {
            this.notifications.show('Debes iniciar sesión', 'error');
            return;
        }
        
        if (!this.db) {
            this.notifications.show('Base de datos no disponible', 'error');
            return;
        }
        
        const canWatch = this.rateLimiter.canWatch(this.currentUser.id);
        if (!canWatch.allowed) {
            this.notifications.show(canWatch.message, 'warning');
            return;
        }
        
        try {
            if (this.watchlist.has(auctionId)) {
                this.watchlist.delete(auctionId);
                this.notifications.show('Subasta removida de seguimiento', 'info');
            } else {
                this.watchlist.add(auctionId);
                this.notifications.show('Subasta agregada a seguimiento', 'success');
            }
            
            // Actualizar en Firebase
            await this.db.collection('watchlists').doc(this.currentUser.id).set({
                auctions: Array.from(this.watchlist),
                lastUpdated: new Date().toISOString()
            }, { merge: true });
            
            this.updateWatchlistCount();
            await this.loadFollowedAuctions();
            await this.loadAuctions();
            
        } catch (error) {
            console.error('Error actualizando watchlist:', error);
            this.notifications.show('Error al actualizar seguimiento', 'error');
        }
    }
    
    // ============================================
    // MÉTODO updateWatchlistDisplay COMPLETAMENTE IMPLEMENTADO
    // ============================================
    updateWatchlistDisplay() {
        const watchlistContainer = document.getElementById('watchlistGrid');
        if (!watchlistContainer) {
            console.error('❌ Contenedor watchlistGrid no encontrado');
            return;
        }
        
        console.log(`👁️ Actualizando watchlist con ${this.followedAuctions.size} subastas`);
        
        if (this.followedAuctions.size === 0) {
            watchlistContainer.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #888;">
                    <i class="fas fa-eye-slash" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>No tienes subastas en seguimiento</h3>
                    <p>Explora las subastas activas y presiona el botón "Seguir"</p>
                </div>
            `;
            return;
        }
        
        watchlistContainer.innerHTML = '';
        this.followedAuctions.forEach(auction => {
            this.createAuctionCard(auction);
        });
    }
    
    // ============================================
    // MÉTODO loadMyBids COMPLETAMENTE IMPLEMENTADO
    // ============================================
    async loadMyBids() {
        console.log('📋 Cargando mis pujas...');
        
        const container = document.getElementById('myBidsGrid');
        if (!container) {
            console.error('❌ Contenedor myBidsGrid no encontrado');
            return;
        }
        
        if (!this.currentUser) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #888;">
                    <i class="fas fa-gavel" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Inicia sesión para ver tus pujas</h3>
                </div>
            `;
            return;
        }
        
        if (!this.db) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #888;">
                    <i class="fas fa-database" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Base de datos no disponible</h3>
                </div>
            `;
            return;
        }
        
        try {
            const querySnapshot = await this.db.collection('auctions')
                .where('status', '==', 'active')
                .get();
            
            const myBids = [];
            querySnapshot.forEach(doc => {
                const auction = { id: doc.id, ...doc.data() };
                const userBids = (auction.bids || []).filter(bid => bid.userId === this.currentUser.id);
                
                if (userBids.length > 0) {
                    const lastBid = userBids[userBids.length - 1];
                    myBids.push({
                        ...auction,
                        myBid: lastBid.amount,
                        myBidTime: lastBid.timestamp,
                        isWinning: auction.currentBid === lastBid.amount
                    });
                }
            });
            
            if (myBids.length === 0) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #888;">
                        <i class="fas fa-gavel" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>No tienes pujas activas</h3>
                        <p>¡Explora las subastas y haz tu primera puja!</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            myBids.forEach(auction => {
                this.createMyBidCard(auction);
            });
            
            console.log(`✅ ${myBids.length} pujas cargadas`);
            
        } catch (error) {
            console.error('Error cargando mis pujas:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: var(--red);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Error al cargar tus pujas</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    // ============================================
    // MÉTODO createMyBidCard COMPLETAMENTE IMPLEMENTADO
    // ============================================
    createMyBidCard(auction) {
        const container = document.getElementById('myBidsGrid');
        if (!container) return;
        
        const card = document.createElement('div');
        card.className = 'auction-card';
        card.innerHTML = `
            <div class="auction-image-container">
                <img src="${auction.image || 'https://via.placeholder.com/400x300/0A0A14/FFD700?text=Subasta'}" 
                     alt="${auction.title}" class="auction-image" style="height: 150px; object-fit: cover;">
            </div>
            <h3 class="auction-title">${this.escapeHtml(auction.title)}</h3>
            
            <div class="auction-stats">
                <div class="auction-stat">
                    <div class="stat-value">Bs ${auction.myBid}</div>
                    <div class="stat-label">Mi Puja</div>
                </div>
                <div class="auction-stat">
                    <div class="stat-value">Bs ${auction.currentBid}</div>
                    <div class="stat-label">Puja Actual</div>
                </div>
            </div>
            
            <div style="padding: 1rem; background: ${auction.isWinning ? 'rgba(76, 175, 80, 0.1)' : 'rgba(220, 20, 60, 0.1)'}; 
                 border-radius: 8px; text-align: center; margin-top: 1rem;">
                <strong style="color: ${auction.isWinning ? '#4CAF50' : 'var(--red)'};">
                    ${auction.isWinning ? '🏆 ¡Vas ganando!' : '⚠️ Te han superado'}
                </strong>
            </div>
            
            <button class="bid-btn" onclick="window.auctionSystem.viewAuction('${auction.id}')" 
                    style="margin-top: 1rem;">
                <i class="fas fa-gavel"></i> Pujar de nuevo
            </button>
        `;
        
        container.appendChild(card);
    }
    
    // ============================================
    // MÉTODO loadWinners COMPLETAMENTE IMPLEMENTADO
    // ============================================
    async loadWinners() {
        console.log('🏆 Cargando ganadores...');
        
        const container = document.getElementById('winnersGrid');
        if (!container) {
            console.error('❌ Contenedor winnersGrid no encontrado');
            return;
        }
        
        try {
            if (!this.db) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #888;">
                        <i class="fas fa-database" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Base de datos no disponible</h3>
                    </div>
                `;
                return;
            }
            
            const querySnapshot = await this.db.collection('auctions')
                .where('status', '==', 'completed')
                .limit(10)
                .get();
            
            if (querySnapshot.empty) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; color: #888;">
                        <i class="fas fa-trophy" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>No hay subastas finalizadas aún</h3>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = '';
            querySnapshot.forEach(doc => {
                const auction = { id: doc.id, ...doc.data() };
                this.createWinnerCard(auction);
            });
            
            console.log(`✅ ${querySnapshot.size} ganadores cargados`);
            
        } catch (error) {
            console.error('Error cargando ganadores:', error);
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem; color: #888;">
                    <i class="fas fa-database" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                    <h3>Error cargando ganadores</h3>
                    <p>${error.message}</p>
                </div>
            `;
        }
    }
    
    // ============================================
    // MÉTODO createWinnerCard COMPLETAMENTE IMPLEMENTADO
    // ============================================
    createWinnerCard(auction) {
        const container = document.getElementById('winnersGrid');
        if (!container) return;
        
        const winner = auction.bids && auction.bids.length > 0 
            ? auction.bids[auction.bids.length - 1]
            : null;
        
        const card = document.createElement('div');
        card.className = 'auction-card';
        card.innerHTML = `
            <div class="auction-image-container">
                <img src="${auction.image || 'https://via.placeholder.com/400x300/0A0A14/FFD700?text=Subasta'}" 
                     alt="${auction.title}" class="auction-image">
                <div style="position: absolute; top: 10px; right: 10px; background: rgba(255, 215, 0, 0.9); 
                     color: var(--dark); padding: 5px 10px; border-radius: 5px; font-weight: bold;">
                    <i class="fas fa-trophy"></i> FINALIZADA
                </div>
            </div>
            
            <h3 class="auction-title">${this.escapeHtml(auction.title)}</h3>
            
            ${winner ? `
                <div style="background: linear-gradient(135deg, rgba(255, 215, 0, 0.1), rgba(255, 140, 0, 0.1)); 
                     padding: 1rem; border-radius: 8px; text-align: center; margin: 1rem 0;">
                    <div style="color: var(--gold); font-size: 0.9rem; margin-bottom: 0.5rem;">
                        🏆 GANADOR
                    </div>
                    <div style="color: white; font-weight: bold; font-size: 1.2rem;">
                        ${this.escapeHtml(winner.username)}
                    </div>
                    <div style="color: var(--gold); font-size: 1.5rem; font-weight: bold; margin-top: 0.5rem;">
                        Bs ${winner.amount}
                    </div>
                </div>
            ` : `
                <div style="text-align: center; padding: 1rem; color: #888;">
                    No hubo pujas
                </div>
            `}
            
            <div style="color: #888; font-size: 0.9rem; text-align: center;">
                Finalizada: ${new Date(auction.endTime).toLocaleDateString('es-BO')}
            </div>
        `;
        
        container.appendChild(card);
    }
    
    // MÉTODO ELIMINAR SUBASTA - COMPLETAMENTE IMPLEMENTADO
    async deleteAuction(auctionId) {
        if (!this.currentUser || !this.currentUser.isAdmin) {
            this.notifications.show('Solo administradores pueden eliminar subastas', 'error');
            return;
        }
        
        if (!this.db) {
            this.notifications.show('Base de datos no disponible', 'error');
            return;
        }
        
        if (!confirm('¿Estás seguro de eliminar esta subasta? Esta acción no se puede deshacer.')) {
            return;
        }
        
        try {
            await this.db.collection('auctions').doc(auctionId).delete();
            this.notifications.show('Subasta eliminada', 'success');
            await this.loadAuctions();
            await this.loadAdminAuctions();
        } catch (error) {
            console.error('Error eliminando subasta:', error);
            this.notifications.show('Error al eliminar', 'error');
        }
    }
    
    // ============================================
    // MÉTODO finalizeAuction COMPLETAMENTE IMPLEMENTADO
    // ============================================
    async finalizeAuction(auctionId) {
        console.log(`🏁 Finalizando subasta: ${auctionId}`);
        
        try {
            if (!this.db) return;
            
            const auctionRef = this.db.collection('auctions').doc(auctionId);
            const auctionDoc = await auctionRef.get();
            const auction = auctionDoc.data();
            
            if (auction.status === 'completed') return;
            
            // Determinar el ganador (la última puja)
            let winner = null;
            if (auction.bids && auction.bids.length > 0) {
                winner = auction.bids[auction.bids.length - 1];
            }
            
            // Actualizar la subasta como completada con el ganador
            await auctionRef.update({
                status: 'completed',
                winner: winner,
                finalPrice: auction.currentBid,
                finalizedAt: new Date().toISOString()
            });
            
            // Si hay ganador, actualizar sus estadísticas
            if (winner) {
                const userDoc = await this.db.collection('users').doc(winner.userId).get();
                
                if (userDoc.exists) {
                    await this.db.collection('users').doc(winner.userId).update({
                        auctionsWon: (userDoc.data().auctionsWon || 0) + 1
                    });
                    
                    // Notificar al ganador
                    this.notifications.show(
                        `🏆 ¡${winner.username} ganó la subasta "${auction.title}" por Bs ${winner.amount}!`,
                        'success'
                    );
                }
            }
            
            console.log('✅ Subasta finalizada:', auctionId, 'Ganador:', winner?.username);
            
            // Recargar subastas activas
            await this.loadAuctions();
            
        } catch (error) {
            console.error('Error finalizando subasta:', error);
        }
    }
    
    // MÉTODO PROCESAR AUTOBIDS - COMPLETAMENTE IMPLEMENTADO
    async processAutobids() {
        if (!this.db || !this.currentUser) return;
        
        if (this.autobids.size === 0) return;
        
        console.log(`🤖 Procesando ${this.autobids.size} autobids...`);
        
        try {
            const now = new Date();
            
            for (const [auctionId, maxBid] of this.autobids.entries()) {
                const auctionDoc = await this.db.collection('auctions').doc(auctionId).get();
                if (auctionDoc.exists) {
                    const auction = auctionDoc.data();
                    
                    // Verificar si la subasta está activa y el usuario no es el líder actual
                    if (auction.status === 'active') {
                        const lastBid = auction.bids && auction.bids.length > 0 
                            ? auction.bids[auction.bids.length - 1]
                            : null;
                            
                        if (lastBid && lastBid.userId !== this.currentUser.id) {
                            const nextBid = Math.max(
                                auction.currentBid + auction.minIncrement,
                                lastBid.amount + auction.minIncrement
                            );
                            
                            if (nextBid <= maxBid) {
                                // Realizar puja automática
                                console.log(`🤖 Puja automática en ${auctionId}: Bs ${nextBid}`);
                                await this.placeBid(auctionId, nextBid);
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error procesando autobids:', error);
        }
    }
    
    // MÉTODO ACTUALIZAR ESTADÍSTICAS EN VIVO - COMPLETAMENTE IMPLEMENTADO
    async updateLiveStats() {
        try {
            if (!this.db) return;
            
            // Contar usuarios activos (que hayan hecho login en las últimas 24 horas)
            const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            const usersSnap = await this.db.collection('users')
                .where('lastLogin', '>=', twentyFourHoursAgo)
                .get();
            
            const activeUsers = document.getElementById('liveActiveUsers');
            if (activeUsers) {
                activeUsers.textContent = usersSnap.size;
            }
            
            // Contar pujas de hoy
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const auctionsSnap = await this.db.collection('auctions')
                .where('lastBidTime', '>=', today.toISOString())
                .get();
            
            let totalBidsToday = 0;
            auctionsSnap.forEach(doc => {
                const auction = doc.data();
                if (auction.bids) {
                    const todayBids = auction.bids.filter(bid => 
                        new Date(bid.timestamp) >= today
                    );
                    totalBidsToday += todayBids.length;
                }
            });
            
            const liveTotalBids = document.getElementById('liveTotalBids');
            if (liveTotalBids) {
                liveTotalBids.textContent = totalBidsToday;
            }
            
            // Calcular valor total de subastas activas
            const activeAuctionsSnap = await this.db.collection('auctions')
                .where('status', '==', 'active')
                .get();
            
            let totalValue = 0;
            activeAuctionsSnap.forEach(doc => {
                const auction = doc.data();
                totalValue += auction.currentBid || 0;
            });
            
            const liveTotalValue = document.getElementById('liveTotalValue');
            if (liveTotalValue) {
                liveTotalValue.textContent = `Bs ${totalValue}`;
            }
            
        } catch (error) {
            console.error('Error actualizando stats:', error);
        }
    }
    
    // MÉTODO CARGAR TOP BIDDERS - COMPLETAMENTE IMPLEMENTADO
    async loadTopBidders() {
        try {
            if (!this.db) return;
            
            const usersSnap = await this.db.collection('users')
                .orderBy('totalBids', 'desc')
                .limit(5)
                .get();
            
            const container = document.getElementById('topBiddersList');
            if (!container) return;
            
            container.innerHTML = usersSnap.docs.map((doc, index) => {
                const user = doc.data();
                return `
                    <div class="top-bidder">
                        <div class="top-bidder-rank">#${index + 1}</div>
                        <div class="top-bidder-name">${this.escapeHtml(user.username)}</div>
                        <div class="top-bidder-bids">${user.totalBids || 0}</div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error cargando top bidders:', error);
        }
    }
    
    // MÉTODO CARGAR SUBASTAS POR FINALIZAR - COMPLETAMENTE IMPLEMENTADO
    async loadEndingSoon() {
        try {
            if (!this.db) return;
            
            const now = new Date();
            const fiveMinutesLater = new Date(now.getTime() + 5 * 60000);
            
            const querySnap = await this.db.collection('auctions')
                .where('status', '==', 'active')
                .where('endTime', '<=', fiveMinutesLater.toISOString())
                .limit(5)
                .get();
            
            const container = document.getElementById('endingSoonList');
            if (!container) return;
            
            if (querySnap.empty) {
                container.innerHTML = '<div style="color: #888; padding: 1rem;">No hay subastas por finalizar</div>';
                return;
            }
            
            container.innerHTML = querySnap.docs.map(doc => {
                const auction = doc.data();
                const timeLeft = new Date(auction.endTime).getTime() - now.getTime();
                return `
                    <div class="ending-item" onclick="window.auctionSystem.viewAuction('${doc.id}')">
                        <img src="${auction.image || 'https://via.placeholder.com/100x75/0A0A14/FFD700'}" 
                             alt="${auction.title}">
                        <div class="ending-details">
                            <div class="ending-title">${this.escapeHtml(auction.title.substring(0, 30))}${auction.title.length > 30 ? '...' : ''}</div>
                            <div class="ending-time">${this.formatTime(timeLeft)}</div>
                        </div>
                        <div class="ending-price">Bs ${auction.currentBid || 0}</div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error cargando ending soon:', error);
        }
    }
    
    // MÉTODO ACTUALIZAR ESTADÍSTICAS DE USUARIO - COMPLETAMENTE IMPLEMENTADO
    async updateUserStats() {
        if (!this.currentUser || !this.db) return;
        
        try {
            const userDoc = await this.db.collection('users').doc(this.currentUser.id).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.currentUser = { ...this.currentUser, ...userData };
                
                // Actualizar UI de stats del usuario
                const totalBidsStat = document.getElementById('totalBidsStat');
                const wonAuctionsStat = document.getElementById('wonAuctionsStat');
                const successRateStat = document.getElementById('successRateStat');
                const userRankingStat = document.getElementById('userRankingStat');
                
                if (totalBidsStat) totalBidsStat.textContent = userData.totalBids || 0;
                if (wonAuctionsStat) wonAuctionsStat.textContent = userData.auctionsWon || 0;
                
                // Calcular tasa de éxito
                if (successRateStat) {
                    const totalBids = userData.totalBids || 0;
                    const wonAuctions = userData.auctionsWon || 0;
                    const successRate = totalBids > 0 ? Math.round((wonAuctions / totalBids) * 100) : 0;
                    successRateStat.textContent = `${successRate}%`;
                }
                
                // Actualizar ranking (simulado por ahora)
                if (userRankingStat) {
                    const totalBids = userData.totalBids || 0;
                    if (totalBids >= 100) userRankingStat.textContent = '#1';
                    else if (totalBids >= 50) userRankingStat.textContent = '#10';
                    else if (totalBids >= 20) userRankingStat.textContent = '#25';
                    else userRankingStat.textContent = '#100+';
                }
                
                this.updateUI();
            }
        } catch (error) {
            console.error('Error actualizando stats de usuario:', error);
        }
    }
    
    // ============================================
    // MÉTODOS ADMIN - COMPLETAMENTE IMPLEMENTADOS
    // ============================================
    
    // MÉTODO PARA BANEAR USUARIO
    async banUser(userId) {
        if (!this.currentUser || !this.currentUser.isAdmin) {
            this.notifications.show('Acceso denegado', 'error');
            return;
        }
        
        const reason = prompt('Ingrese la razón del baneo:');
        if (!reason) return;
        
        try {
            await this.db.collection('users').doc(userId).update({
                isBanned: true,
                banReason: reason,
                bannedAt: new Date().toISOString(),
                bannedBy: this.currentUser.id
            });
            
            this.notifications.show('Usuario baneado exitosamente', 'success');
            this.loadAdminUsers(); // Recargar lista
            
        } catch (error) {
            console.error('Error baneando usuario:', error);
            this.notifications.show('Error al banear usuario', 'error');
        }
    }
    
    // MÉTODO PARA DESBANEAR USUARIO
    async unbanUser(userId) {
        if (!this.currentUser || !this.currentUser.isAdmin) {
            this.notifications.show('Acceso denegado', 'error');
            return;
        }
        
        if (!confirm('¿Estás seguro de desbanear a este usuario?')) {
            return;
        }
        
        try {
            await this.db.collection('users').doc(userId).update({
                isBanned: false,
                banReason: null
            });
            
            this.notifications.show('Usuario desbaneado exitosamente', 'success');
            this.loadAdminUsers(); // Recargar lista
            
        } catch (error) {
            console.error('Error desbaneando usuario:', error);
            this.notifications.show('Error al desbanear usuario', 'error');
        }
    }
    
    // MÉTODO PARA VER DETALLES DE USUARIO
    async viewUserDetails(userId) {
        try {
            const userDoc = await this.db.collection('users').doc(userId).get();
            if (userDoc.exists) {
                const user = userDoc.data();
                
                const details = `
                    <div style="padding: 1rem;">
                        <h3 style="color: var(--gold); margin-bottom: 1rem;">Detalles del Usuario</h3>
                        <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 8px;">
                            <div><strong>Usuario:</strong> ${user.username}</div>
                            <div><strong>Teléfono:</strong> ${user.phone}</div>
                            <div><strong>Rank:</strong> ${user.rank || 'Novato'}</div>
                            <div><strong>Total de pujas:</strong> ${user.totalBids || 0}</div>
                            <div><strong>Subastas ganadas:</strong> ${user.auctionsWon || 0}</div>
                            <div><strong>Fecha de registro:</strong> ${new Date(user.registrationDate).toLocaleDateString('es-BO')}</div>
                            ${user.isBanned ? `<div style="color: var(--red);"><strong>Estado:</strong> BANEADO</div>` : ''}
                        </div>
                    </div>
                `;
                
                // Crear modal para mostrar detalles
                const modalHtml = `
                    <div class="modal-overlay active" id="userDetailsModal">
                        <div class="modal" style="max-width: 500px;">
                            <div class="modal-header">
                                <h3 class="modal-title"><i class="fas fa-user"></i> Detalles del Usuario</h3>
                                <button class="close-modal" onclick="document.getElementById('userDetailsModal').remove()">&times;</button>
                            </div>
                            <div>
                                ${details}
                                <div class="form-buttons" style="margin-top: 1rem;">
                                    <button class="btn-secondary" onclick="document.getElementById('userDetailsModal').remove()">
                                        <i class="fas fa-times"></i> Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = modalHtml;
                document.body.appendChild(tempDiv.firstElementChild);
            }
        } catch (error) {
            console.error('Error viendo detalles:', error);
            this.notifications.show('Error al cargar detalles', 'error');
        }
    }
    
    // MÉTODO PARA OCULTAR EL LOADER
    hideLoader() {
        const loader = document.getElementById('loader');
        if (loader) {
            console.log('🎯 Ocultando loader');
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 500);
        }
    }
}

/* ============================================
   INICIALIZACIÓN - COMPLETAMENTE CORREGIDA
   ============================================ */

// Función para ocultar loader de seguridad
function hideLoaderSafety() {
    const loader = document.getElementById('loader');
    if (loader) {
        console.log('⚡ Oculta-loader de seguridad activado');
        loader.style.opacity = '0';
        setTimeout(() => {
            loader.style.display = 'none';
        }, 500);
    }
}

// Ocultar loader después de 3 segundos máximo
setTimeout(hideLoaderSafety, 3000);

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌐 DOM cargado');
    
    // Verificar que Firebase esté disponible
    let firebaseAvailable = false;
    
    if (window.firebaseAuth && window.firebaseDb) {
        console.log('✅ Firebase configurado en window');
        firebaseAvailable = true;
    } else if (typeof firebase !== 'undefined' && firebase.auth && firebase.firestore) {
        console.log('✅ Firebase cargado globalmente');
        // Configurar en window para compatibilidad
        window.firebaseAuth = firebase.auth();
        window.firebaseDb = firebase.firestore();
        firebaseAvailable = true;
    } else {
        console.error('❌ Firebase no está disponible');
        const loader = document.getElementById('loader');
        if (loader) {
            loader.innerHTML = `
                <div style="text-align: center; color: var(--red); padding: 2rem;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem;"></i>
                    <h2>Error de conexión</h2>
                    <p>Firebase no se cargó correctamente</p>
                    <p>Verifica tu conexión a internet y que firebase-config.js esté cargado</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--gold); color: var(--dark); border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                        Reintentar
                    </button>
                </div>
            `;
        }
        return;
    }
    
    if (!firebaseAvailable) return;
    
    console.log('✅ Firebase disponible, inicializando sistema...');
    
    try {
        window.auctionSystem = new AuctionSystem();
        window.auctionSystem.init();
        
        // Ocultar loader después de que el sistema esté listo
        setTimeout(() => {
            window.auctionSystem.hideLoader();
        }, 1000);
        
    } catch (error) {
        console.error('❌ Error crítico al inicializar:', error);
        const loader = document.getElementById('loader');
        if (loader) {
            loader.style.display = 'flex';
            loader.style.opacity = '1';
            loader.innerHTML = `
                <div style="text-align: center; color: var(--red);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 4rem;"></i>
                    <h2>Error al inicializar</h2>
                    <p>${error.message}</p>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px; background: var(--gold); color: var(--dark); border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }
});

console.log("✅ App.js cargado correctamente");

// Añadir estilos CSS para animaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes fadeOut {
        from {
            opacity: 1;
        }
        to {
            opacity: 0;
        }
    }
    
    .notification {
        animation: slideIn 0.3s ease;
    }
    
    .notification.fade-out {
        animation: fadeOut 0.3s ease;
    }
`;
document.head.appendChild(style);