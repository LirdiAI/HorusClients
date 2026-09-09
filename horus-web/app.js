import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where, orderBy, limit, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyBRe1jb0BzT3NL_aZcJktjn-dMlzVU1knk",
    authDomain: "horusweb-66ab6.firebaseapp.com",
    projectId: "horusweb-66ab6",
    storageBucket: "horusweb-66ab6.firebasestorage.app",
    messagingSenderId: "706747176842",
    appId: "1:706747176842:web:98956db78f57b43ec6da73"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const els = {
    navAuth: document.getElementById('navAuthBtn'),
    devPanel: document.getElementById('devPanelBtn'),
    authMod: document.getElementById('authModal'),
    profMod: document.getElementById('profileModal'),
    devMod: document.getElementById('devModal'),
    verifyMod: document.getElementById('verifyModal'),
    payMod: document.getElementById('paymentModal'),
    moderMod: document.getElementById('moderModal'),
    moderBtn: document.getElementById('moderPanelBtn'),
    toggleAuth: document.getElementById('toggleAuthMode'),
    submitAuth: document.getElementById('submitAuthBtn')
};

const musicBtn = document.getElementById('musicPanelBtn');
const musicModal = document.getElementById('musicModal');
const closeMusicBtn = document.getElementById('closeMusicBtn');
const tabSearch = document.getElementById('musicTabSearch');
const tabPlaylist = document.getElementById('musicTabPlaylist');
const searchSection = document.getElementById('musicSearchSection');
const playlistSection = document.getElementById('musicPlaylistSection');
const searchInput = document.getElementById('musicSearchInput');
const searchBtn = document.getElementById('musicSearchBtn');
const searchResults = document.getElementById('musicSearchResults');
const playlistTracks = document.getElementById('musicPlaylistTracks');
const playlistCount = document.getElementById('playlistCount');
const playerBar = document.getElementById('musicPlayerBar');
const audioPlayer = document.getElementById('globalAudioPlayer');
const playerTitle = document.getElementById('playerTrackTitle');
const playerArtist = document.getElementById('playerTrackArtist');
const suggestionsBox = document.getElementById('musicSuggestionsBox');

const moderTargetInput = document.getElementById('moderTargetInput');
const moderReasonInput = document.getElementById('moderReasonInput');
const moderBanBtn = document.getElementById('moderBanBtn');
const moderUnbanBtn = document.getElementById('moderUnbanBtn');
const moderActionMsg = document.getElementById('moderActionMsg');

const checkCustomServerBtn = document.getElementById('checkCustomServerBtn');
const customServerIpInput = document.getElementById('customServerIpInput');
const customServerResult = document.getElementById('customServerResult');

let isLoginMode = true;
let generatedCode = null;
let profileUnsubscribe = null;
let myPlaylist = [];
let debounceTimer = null;

// Piped API работает без ошибок CORS и не блокирует веб-браузеры
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.moomoo.me",
    "https://pipedapi.syncpundit.io"
];

const SERVERS_TO_TRACK = [
    { name: "ReallyWorld", ip: "mc.reallyworld.ru" },
    { name: "SparkGrief", ip: "mc.sparkgrief.pw" },
    { name: "HiveGrief", ip: "mc.hivegrief.pw" },
    { name: "HolyWorld", ip: "mc.holyworld.ru" },
    { name: "FunTime", ip: "play.funtime.su" },
    { name: "MST Network", ip: "play.mstnw.net" },
    { name: "SunRise", ip: "play.sunmc.ru" },
    { name: "SpookyHost", ip: "mc.spookyhost.ru" },
    { name: "GriefCraft", ip: "mc.griefcraft.ru" },
    { name: "AresMine", ip: "mc.aresmine.ru" },
    { name: "WellMore", ip: "mc.wellmore.net" },
    { name: "TeslaCraft", ip: "play.teslacraft.org" },
    { name: "MineBlaze", ip: "play.mineblaze.ru" },
    { name: "DexLand", ip: "mc.dexland.ru" },
    { name: "VimeWorld", ip: "mc.vimeworld.com" },
    { name: "GriefLife", ip: "mc.grieflife.ru" },
    { name: "Hypixel", ip: "play.hypixel.net" },
    { name: "2b2t", ip: "2b2t.org" },
    { name: "Cubecraft", ip: "play.cubecraft.net" },
    { name: "JartexNetwork", ip: "play.jartexnetwork.com" },
    { name: "PikaNetwork", ip: "play.pika-network.net" },
    { name: "DonutSMP", ip: "donutsmp.net" },
    { name: "Minemen Club", ip: "play.minemen.club" }
];

els.navAuth.onclick = () => auth.currentUser ? els.profMod.classList.remove('hidden') : els.authMod.classList.remove('hidden');
els.devPanel.onclick = () => { 
    els.devMod.classList.remove('hidden'); 
    loadInventory(); 
    loadUsersList(); 
};

document.getElementById('closeAuth').onclick = () => els.authMod.classList.add('hidden');
document.getElementById('closeProfile').onclick = () => els.profMod.classList.add('hidden');
document.getElementById('closeDev').onclick = () => els.devMod.classList.add('hidden');
document.getElementById('closePayment').onclick = () => els.payMod.classList.add('hidden');
document.getElementById('closeModer').onclick = () => els.moderMod.classList.add('hidden');
els.moderBtn.onclick = () => els.moderMod.classList.remove('hidden');

document.querySelectorAll('.btn-buy').forEach(button => {
    button.onclick = () => {
        const title = button.getAttribute('data-title');
        const price = button.getAttribute('data-price');
        document.getElementById('paymentItemTitle').innerText = title;
        document.getElementById('paymentItemPrice').innerText = price;
        els.payMod.classList.remove('hidden');
    };
});

els.toggleAuth.onclick = () => {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? "Вход" : "Регистрация";
    els.submitAuth.innerText = isLoginMode ? "Войти" : "Создать аккаунт";
    els.toggleAuth.innerText = isLoginMode ? "Нет аккаунта? Зарегистрироваться" : "Уже есть аккаунт? Войти";
    
    const emailField = document.getElementById('emailInput');
    if (isLoginMode) {
        document.getElementById('usernameInput').classList.add('hidden');
        emailField.placeholder = "Email или Никнейм";
    } else {
        document.getElementById('usernameInput').classList.remove('hidden');
        emailField.placeholder = "Email (Gmail)";
    }
};

els.submitAuth.onclick = async () => {
    const loginOrEmail = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('passwordInput').value.trim();
    const username = document.getElementById('usernameInput').value.trim();

    if (!loginOrEmail || !password) {
        return alert("Заполните все поля!");
    }

    try {
        if (isLoginMode) {
            let targetEmail = loginOrEmail;

            if (!loginOrEmail.includes('@')) {
                const userQuery = query(collection(db, "users"), where("username", "==", loginOrEmail), limit(1));
                const querySnapshot = await getDocs(userQuery);

                if (querySnapshot.empty) {
                    return alert("Пользователь с таким никнеймом не найден!");
                }

                const userDoc = querySnapshot.docs[0].data();
                targetEmail = userDoc.email;
            }

            await signInWithEmailAndPassword(auth, targetEmail, password);
        } else {
            if (username.length < 3) return alert("Никнейм минимум 3 символа!");
            if (!loginOrEmail.includes('@')) return alert("Для регистрации введите корректный Email!");

            const checkNameQuery = query(collection(db, "users"), where("username", "==", username), limit(1));
            const checkNameSnap = await getDocs(checkNameQuery);
            if (!checkNameSnap.empty) {
                return alert("Этот никнейм уже занят другим пользователем!");
            }

            const userCred = await createUserWithEmailAndPassword(auth, loginOrEmail, password);
            await setDoc(doc(db, "users", userCred.user.uid), {
                username: username,
                email: loginOrEmail,
                role: "User",
                telegram: "Не привязан",
                hwid: "",
                uid: userCred.user.uid,
                playTime: 0,
                emailVerified: false,
                subExpires: "Нет",
                isBanned: false
            });
            alert("Аккаунт создан! Теперь войдите в систему.");
        }
        els.authMod.classList.add('hidden');
    } catch (e) { 
        alert("Ошибка: " + e.message); 
    }
};

document.getElementById('logoutBtn').onclick = async () => {
    if (profileUnsubscribe) profileUnsubscribe();
    await signOut(auth);
    els.profMod.classList.add('hidden');
    musicModal.classList.add('hidden');
    if (audioPlayer) {
        audioPlayer.pause();
        audioPlayer.src = "";
    }
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        els.navAuth.innerText = "Профиль";
        document.getElementById('profUid').innerText = user.uid;

        profileUnsubscribe = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();

                const isBanned = data.isBanned === true;
                const bannedBox = document.getElementById('bannedBox');
                const normalContent = document.getElementById('profileContentNormal');

                if (isBanned) {
                    bannedBox.classList.remove('hidden');
                    normalContent.classList.add('hidden');

                    document.getElementById('banProfUser').innerText = data.username || "—";
                    document.getElementById('banProfEmail').innerText = user.email || "—";
                    document.getElementById('banProfUid').innerText = user.uid || "—";
                    document.getElementById('banProfReason').innerText = data.banReason || "Не указана";
                    document.getElementById('banProfBy').innerText = data.bannedBy || "Модерация";

                    els.moderBtn.classList.add('hidden');
                    musicBtn.classList.add('hidden');
                    els.devPanel.classList.add('hidden');
                    return;
                } else {
                    bannedBox.classList.add('hidden');
                    normalContent.classList.remove('hidden');
                }

                document.getElementById('profUser').innerText = data.username;
                document.getElementById('profRole').innerText = data.role;
                document.getElementById('profTg').innerText = data.telegram || "Не привязан";
                
                const hoursPlayed = Math.floor((data.playTime || 0) / 3600);
                document.getElementById('profPlayTime').innerText = hoursPlayed + " ч.";
                
                const hwidEl = document.getElementById('profHwid');
                if (data.hwid && data.hwid.trim() !== "") {
                    hwidEl.innerText = data.hwid;
                    hwidEl.style.color = "#4ade80";
                } else {
                    hwidEl.innerText = "Не привязан";
                    hwidEl.style.color = "#f59e0b";
                }

                const isVerified = data.emailVerified;
                const emailStatHtml = isVerified 
                    ? "<span style='color:#4ade80'>(Подтвержден)</span>" 
                    : `<span style='color:#e11d48; cursor:pointer' id='resendE'>Отправить письмо</span>`;
                
                document.getElementById('profEmail').innerHTML = `${user.email} ${emailStatHtml}`;

                const rs = document.getElementById('resendE');
                if (rs) {
                    rs.onclick = async () => {
                        generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
                        rs.innerText = "Отправка...";
                        try {
                            await emailjs.send("service_sinh5nr", "template_ktkgewj", {
                                to_email: user.email,
                                code: generatedCode
                            });
                            document.getElementById('verifyInfoText').innerText = `Код был отправлен на ${user.email}`;
                            els.verifyMod.classList.remove('hidden');
                            rs.innerText = "Отправить письмо";
                        } catch (err) {
                            alert("Ошибка отправки письма: " + JSON.stringify(err));
                            rs.innerText = "Отправить письмо";
                        }
                    };
                }

                const roleNorm = (data.role || "").toLowerCase();

                if (data.username === "HowillOwner") {
                    els.devPanel.classList.remove('hidden');
                } else {
                    els.devPanel.classList.add('hidden');
                }

                if (["owner", "admin", "moder"].includes(roleNorm) || data.username === "HowillOwner") {
                    els.moderBtn.classList.remove('hidden');
                } else {
                    els.moderBtn.classList.add('hidden');
                }

                if (["owner", "admin"].includes(roleNorm) || data.username === "HowillOwner") {
                    musicBtn.classList.remove('hidden');
                } else {
                    musicBtn.classList.add('hidden');
                }
            }
        });

        loadProfileLeaderboard();
        loadServersStatus();
    } else {
        els.navAuth.innerText = "Войти";
        els.devPanel.classList.add('hidden');
        els.moderBtn.classList.add('hidden');
        musicBtn.classList.add('hidden');
    }
});

document.getElementById('confirmCodeBtn').onclick = async () => {
    const inputCode = document.getElementById('codeInput').value.trim();
    if (inputCode === generatedCode) {
        await updateDoc(doc(db, "users", auth.currentUser.uid), { emailVerified: true });
        alert("Почта успешно подтверждена!");
        els.verifyMod.classList.add('hidden');
    } else {
        alert("Неверный код подтверждения!");
    }
};

document.getElementById('saveTelegramBtn').onclick = async () => {
    const tgVal = document.getElementById('telegramInput').value.trim();
    if (!tgVal || !auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { telegram: tgVal });
    alert("Telegram сохранен!");
};

const loadProfileLeaderboard = async () => {
    const list = document.getElementById('profileLeaderboardList');
    if (!list) return;
    list.innerHTML = '<p style="color:gray;text-align:center;font-size:13px;">Загрузка топа...</p>';
    const q = query(collection(db, "users"), orderBy("playTime", "desc"), limit(5));
    const snap = await getDocs(q);
    let html = "", rank = 1;
    snap.forEach(d => {
        const data = d.data();
        html += `<div class="leader-row"><span style="color:#c084fc">#${rank} ${data.username}</span> <span>${Math.floor((data.playTime||0)/3600)} ч.</span></div>`;
        rank++;
    });
    list.innerHTML = html || "<p style='text-align:center;font-size:13px;'>Нет данных</p>";
};

function renderServerCard(container, srv) {
    const safeId = srv.ip.replace(/[^a-zA-Z0-9]/g, '_');
    const item = document.createElement('div');
    item.className = 'server-card';
    item.innerHTML = `
        <div>
            <div class="server-title">${srv.name}</div>
            <div class="server-ip">${srv.ip}</div>
        </div>
        <div class="server-status-box">
            <span class="online-counter" id="online-${safeId}">...</span>
            <span class="status-dot dot-offline" id="dot-${safeId}"></span>
        </div>
    `;
    container.appendChild(item);

    fetch(`https://api.mcstatus.io/v2/status/java/${srv.ip}`)
        .then(res => res.json())
        .then(data => {
            const countEl = document.getElementById(`online-${safeId}`);
            const dotEl = document.getElementById(`dot-${safeId}`);
            if (data && data.online) {
                const onlinePlayers = data.players ? data.players.online.toLocaleString() : "0";
                if (countEl) countEl.innerText = `${onlinePlayers} онлайн`;
                if (dotEl) dotEl.className = 'status-dot dot-online';
            } else {
                if (countEl) {
                    countEl.innerText = 'Оффлайн';
                    countEl.style.color = '#e11d48';
                }
                if (dotEl) dotEl.className = 'status-dot dot-offline';
            }
        })
        .catch(() => {
            const countEl = document.getElementById(`online-${safeId}`);
            if (countEl) countEl.innerText = 'Недоступен';
        });
}

async function loadServersStatus() {
    const list = document.getElementById('serversStatusList');
    if (!list) return;

    list.innerHTML = '';
    SERVERS_TO_TRACK.forEach(srv => renderServerCard(list, srv));
}

if (checkCustomServerBtn && customServerIpInput) {
    const runCustomCheck = () => {
        const ip = customServerIpInput.value.trim();
        if (!ip) return;

        customServerResult.innerHTML = '';
        renderServerCard(customServerResult, { name: "Пользовательский сервер", ip: ip });
    };

    checkCustomServerBtn.onclick = runCustomCheck;
    customServerIpInput.onkeydown = (e) => {
        if (e.key === 'Enter') runCustomCheck();
    };
}

async function handleUserBan(shouldBan) {
    const target = moderTargetInput.value.trim();
    const reason = moderReasonInput ? moderReasonInput.value.trim() : "";

    if (!target) {
        moderActionMsg.style.color = "#e11d48";
        moderActionMsg.innerText = "Введите UID или никнейм!";
        return;
    }

    moderActionMsg.style.color = "gray";
    moderActionMsg.innerText = "Поиск пользователя...";

    try {
        let userDocRef = doc(db, "users", target);
        let userSnap = await getDoc(userDocRef);

        if (!userSnap.exists()) {
            const q = query(collection(db, "users"), where("username", "==", target), limit(1));
            const querySnap = await getDocs(q);
            if (!querySnap.empty) {
                userDocRef = doc(db, "users", querySnap.docs[0].id);
                userSnap = querySnap.docs[0];
            } else {
                moderActionMsg.style.color = "#e11d48";
                moderActionMsg.innerText = "Пользователь не найден!";
                return;
            }
        }

        const userData = userSnap.data();

        if (userData.username === "HowillOwner" || (userData.role || "").toLowerCase() === "owner") {
            moderActionMsg.style.color = "#e11d48";
            moderActionMsg.innerText = "Нельзя заблокировать владельца!";
            return;
        }

        const currentModSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        const modName = currentModSnap.exists() ? currentModSnap.data().username : "Модератор";

        // Формируем данные для обновления БД
        let updateData = {};
        
        if (shouldBan) {
            // Если БАНИМ: ставим статус бана и СБРАСЫВАЕМ все привилегии
            updateData = {
                isBanned: true,
                banReason: reason || "Нарушение правил",
                bannedBy: modName,
                bannedAt: Date.now(),
                role: "User",        // Сброс роли до обычной
                subExpires: "Нет",   // Аннулирование подписки
                hwid: "",            // Удаление привязки ПК
                hwidReset: true      // Сброс флага HWID
            };
        } else {
            // Если РАЗБАНИВАЕМ: просто снимаем табличку бана (привилегии придется выдавать заново)
            updateData = {
                isBanned: false,
                banReason: null,
                bannedBy: null,
                bannedAt: null
            };
        }

        await updateDoc(userDocRef, updateData);

        moderActionMsg.style.color = shouldBan ? "#e11d48" : "#22c55e";
        moderActionMsg.innerText = shouldBan 
            ? `Пользователь ${userData.username} забанен и обнулен!` 
            : `Пользователь ${userData.username} разбанен!`;
        moderTargetInput.value = "";
        if (moderReasonInput) moderReasonInput.value = "";
        
        // Обновляем список пользователей в панели, чтобы сразу увидеть сброс
        if (typeof loadUsersList === 'function') {
            loadUsersList();
        }

    } catch (err) {
        moderActionMsg.style.color = "#e11d48";
        moderActionMsg.innerText = "Ошибка: " + err.message;
    }
}

if (moderBanBtn && moderUnbanBtn) {
    moderBanBtn.onclick = () => handleUserBan(true);
    moderUnbanBtn.onclick = () => handleUserBan(false);
}

const loadInventory = async () => {
    const inv = document.getElementById('keysInventory');
    inv.innerHTML = 'Загрузка...';
    const snap = await getDocs(collection(db, "codes"));
    let html = "";
    snap.forEach(d => {
        const data = d.data();
        const stat = data.used ? `<span class="status-used">Использован</span>` : `<span class="status-free">Доступен</span>`;
        html += `<div class="inventory-item"><span>${d.id} (${data.type||""})</span>${stat}</div>`;
    });
    inv.innerHTML = html || "Пусто";
};
document.getElementById('loadKeysBtn').onclick = loadInventory;

const loadUsersList = async () => {
    const usersBox = document.getElementById('usersList');
    if (!usersBox) return;
    usersBox.innerHTML = 'Загрузка...';
    try {
        const snap = await getDocs(collection(db, "users"));
        let html = "";
        snap.forEach(d => {
            const data = d.data();
            const hwidText = (data.hwid && data.hwid.trim() !== "") ? data.hwid : "Не привязан";
            const roleNorm = (data.role || "").toLowerCase();
            
            let subText = "Нет";
            if (["beta", "owner", "moder", "komini", "admin"].includes(roleNorm)) {
                subText = "Навсегда";
            } else if (data.subExpires) {
                if (data.subExpires === "Навсегда") {
                    subText = "Навсегда";
                } else if (data.subExpires !== "Нет") {
                    const remSec = (data.subExpires - Date.now()) / 1000;
                    if (remSec > 0) {
                        subText = Math.floor(remSec / 86400) + " дн.";
                    } else {
                        subText = "Истекла";
                    }
                }
            }

            html += `
            <div class="inventory-item" style="flex-direction: column; align-items: flex-start; padding: 10px 0;">
                <div style="display:flex; justify-content:space-between; width:100%;">
                    <span style="color:#c084fc; font-weight:bold; font-size: 14px;">${data.username}</span>
                    <span style="color:${data.isBanned ? '#e11d48' : '#22c55e'}; font-size: 12px; background:#251838; padding:2px 6px; border-radius:4px;">${data.isBanned ? "Banned" : (data.role || "User")}</span>
                </div>
                <span style="font-size: 11px; color:gray; font-family: monospace; margin-top: 4px;">UID: ${data.uid}</span>
                <span style="font-size: 11px; color:#f59e0b; font-family: monospace; margin-top: 2px;">HWID: ${hwidText}</span>
                <span style="font-size: 11px; color:#38bdf8; font-family: monospace; margin-top: 2px;">Подписка: ${subText}</span>
            </div>`;
        });
        usersBox.innerHTML = html || "Пользователи не найдены";
    } catch (e) {
        usersBox.innerHTML = "Ошибка загрузки списка";
    }
};
document.getElementById('loadUsersBtn').onclick = loadUsersList;

const keyTypeSelect = document.getElementById('keyTypeSelect');
const customDaysInput = document.getElementById('customDaysInput');

keyTypeSelect.addEventListener('change', () => {
    if (keyTypeSelect.value === 'custom') {
        customDaysInput.classList.remove('hidden');
    } else {
        customDaysInput.classList.add('hidden');
    }
});

document.getElementById('generateCodeBtn').onclick = async () => {
    let keyType = keyTypeSelect.value;
    
    if (keyType === 'custom') {
        const days = customDaysInput.value.trim();
        if (!days || days <= 0) {
            alert("Введите корректное количество дней!");
            return;
        }
        keyType = `Подписка на ${days} дн`;
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const length = Math.floor(Math.random() * 7) + 7;
    let randomPart = '';
    for (let i = 0; i < length; i++) {
        randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const separator = Math.random() > 0.5 ? '-' : '_';
    const code = `HORUS${separator}${randomPart}`;

    await setDoc(doc(db, "codes", code), { 
        used: false, 
        type: keyType, 
        createdAt: new Date() 
    });
    
    if (keyTypeSelect.value === 'custom') customDaysInput.value = '';
    loadInventory();
};

document.getElementById('activateCodeBtn').onclick = async () => {
    const codeInput = document.getElementById('promoCodeInput');
    const msgEl = document.getElementById('keyMsg');
    const code = codeInput.value.trim().toUpperCase();
    
    if (!code || !auth.currentUser) return;
    
    const ref = doc(db, "codes", code);
    const snap = await getDoc(ref);
    
    if (snap.exists() && !snap.data().used) {
        const keyType = snap.data().type || "Доступ";
        await updateDoc(ref, { used: true, activatedBy: auth.currentUser.uid });
        
        const uSnap = await getDoc(doc(db, "users", auth.currentUser.uid));
        let currentRole = "User";
        if (uSnap.exists()) currentRole = uSnap.data().role || "User";

        if (keyType === "Сброс HWID") {
            await updateDoc(doc(db, "users", auth.currentUser.uid), { 
                hwid: "",
                hwidReset: true 
            });
        } else {
            let nr = "User";
            const roleNorm = currentRole.toLowerCase();
            if (["owner", "admin", "moder"].includes(roleNorm)) {
                nr = currentRole;
            } else if (keyType.includes("BETA")) {
                nr = "Beta";
            }
            
            let exp = "Нет";
            if (keyType.toLowerCase().includes("навсегда") || ["beta", "owner", "moder", "komini", "admin"].includes(nr.toLowerCase())) {
                exp = "Навсегда";
            } else {
                const match = keyType.match(/\d+/);
                if (match) {
                    const days = parseInt(match[0]);
                    exp = Date.now() + days * 24 * 60 * 60 * 1000;
                }
            }

            await updateDoc(doc(db, "users", auth.currentUser.uid), { 
                role: nr,
                subExpires: exp 
            });
        }
        
        msgEl.className = "msg-success";
        msgEl.innerText = `${keyType} Активирована!`;
        codeInput.value = "";
    } else {
        msgEl.className = "msg-error";
        msgEl.innerText = "Такого ключа не существует!";
    }
};

document.getElementById('setRoleBtn').onclick = async () => {
    const tu = document.getElementById('targetUidInput').value.trim();
    const nr = document.getElementById('roleSelect').value;
    if (!tu) return;
    await updateDoc(doc(db, "users", tu), { role: nr });
    alert("Роль выдана!");
};

// ==================== ЛОГИКА МУЗЫКАЛЬНОГО МОДУЛЯ (PIPED API) ====================

function switchMusicTab(activeTabBtn, inactiveTabBtn, showSection, hideSection) {
    activeTabBtn.classList.add('active');
    inactiveTabBtn.classList.remove('active');
    hideSection.classList.remove('active-section');
    hideSection.classList.add('hidden');
    showSection.classList.remove('hidden');
    requestAnimationFrame(() => showSection.classList.add('active-section'));
}

musicBtn.onclick = () => {
    musicModal.classList.remove('hidden');
    switchMusicTab(tabSearch, tabPlaylist, searchSection, playlistSection);
    loadUserPlaylist();
};

closeMusicBtn.onclick = () => musicModal.classList.add('hidden');
tabSearch.onclick = () => switchMusicTab(tabSearch, tabPlaylist, searchSection, playlistSection);
tabPlaylist.onclick = () => {
    switchMusicTab(tabPlaylist, tabSearch, playlistSection, searchSection);
    loadUserPlaylist();
};

// Piped API работает без ошибок CORS и не блокирует веб-браузеры
const PIPED_INSTANCES = [
    "https://pipedapi.kavin.rocks",
    "https://pipedapi.tokhmi.xyz",
    "https://pipedapi.moomoo.me",
    "https://pipedapi.syncpundit.io"
];

// Функция для ПАРАЛЛЕЛЬНОГО запроса (кто первый ответил - тот и выводится)
async function fetchFromPiped(endpoint) {
    const promises = PIPED_INSTANCES.map(async (host) => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000); 
            
            const res = await fetch(`${host}${endpoint}`, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (!res.ok) throw new Error('Bad response');
            const data = await res.json();
            return { host, data };
        } catch (err) {
            throw err;
        }
    });

    try {
        return await Promise.any(promises); // Ждем первый успешный ответ
    } catch (error) {
        return null; // Все сервера упали
    }
}

async function playTrack(title, artist, videoId) {
    playerTitle.innerText = title;
    playerArtist.innerText = artist;
    playerBar.classList.remove('hidden');

    // Получаем аудиопоток
    const result = await fetchFromPiped(`/streams/${videoId}`);

    if (result && result.data && result.data.audioStreams) {
        const audioStreams = result.data.audioStreams;
        if (audioStreams.length > 0) {
            // Выбираем лучший аудиопоток
            audioPlayer.src = audioStreams[0].url;
            audioPlayer.play();
            return;
        }
    }
    
    alert("Не удалось загрузить аудиопоток для этого трека :(");
}

async function performMusicSearch() {
    const query = searchInput.value.trim();
    if (!query) return;

    suggestionsBox.classList.add('hidden');
    searchResults.innerHTML = '<p style="color:gray; text-align:center; grid-column: 1 / -1;">Поиск по всей базе музыки...</p>';

    // Ищем треки через Piped
    const result = await fetchFromPiped(`/search?q=${encodeURIComponent(query)}&filter=all`);

    if (!result || !result.data || !result.data.items) {
        searchResults.innerHTML = '<p style="color:#e11d48; text-align:center; grid-column: 1 / -1;">Серверы временно перегружены. Попробуйте еще раз через мгновение.</p>';
        return;
    }

    // Отбираем только видео/стримы, исключаем каналы и плейлисты
    const tracks = result.data.items.filter(item => item.type === 'stream');

    if (tracks.length === 0) {
        searchResults.innerHTML = '<p style="color:gray; text-align:center; grid-column: 1 / -1;">Ничего не найдено</p>';
        return;
    }

    searchResults.innerHTML = '';
    tracks.forEach(track => {
        // У Piped URL имеет вид /watch?v=ID
        const videoId = track.url.split('?v=')[1];
        const title = track.title;
        const artist = track.uploaderName;
        const artwork = track.thumbnail;
            
        const isFav = myPlaylist.some(item => item.videoId === videoId);

        const card = document.createElement('div');
        card.className = 'track-card';
        card.innerHTML = `
            <div class="track-card-header">
                <img src="${artwork}" class="track-artwork" alt="cover">
                <div class="track-meta">
                    <p class="track-title" title="${title}">${title}</p>
                    <p class="track-artist">${artist}</p>
                </div>
            </div>
            <div class="track-card-actions">
                <button class="btn-play-track">▶ Слушать</button>
                <button class="btn-fav-track">${isFav ? '✓ В плейлисте' : '+ В плейлист'}</button>
            </div>
        `;

        card.querySelector('.btn-play-track').onclick = () => playTrack(title, artist, videoId);
        const favBtn = card.querySelector('.btn-fav-track');
        favBtn.onclick = () => togglePlaylistTrack({ id: videoId, title, artist, artwork }, favBtn);

        searchResults.appendChild(card);
    });
}

searchBtn.onclick = performMusicSearch;
searchInput.onkeydown = (e) => { 
    if (e.key === 'Enter') performMusicSearch(); 
};

window.handleYouTubeSuggestions = (data) => {
    if (!data || !data[1] || data[1].length === 0) {
        suggestionsBox.classList.add('hidden');
        suggestionsBox.innerHTML = '';
        return;
    }

    const suggestions = data[1];
    suggestionsBox.innerHTML = '';

    suggestions.forEach(([itemText]) => {
        const item = document.createElement('div');
        item.className = 'suggestion-item';
        item.innerText = itemText;
        
        item.onclick = () => {
            searchInput.value = itemText;
            suggestionsBox.classList.add('hidden');
            performMusicSearch();
        };

        suggestionsBox.appendChild(item);
    });

    suggestionsBox.classList.remove('hidden');
};

function fetchSuggestions(query) {
    const oldScript = document.getElementById('yt-suggest-script');
    if (oldScript) oldScript.remove();

    const script = document.createElement('script');
    script.id = 'yt-suggest-script';
    script.src = `https://suggestqueries-clients6.youtube.com/complete/search?client=youtube&ds=yt&q=${encodeURIComponent(query)}&callback=handleYouTubeSuggestions`;
    document.body.appendChild(script);
}

searchInput.addEventListener('input', () => {
    const val = searchInput.value.trim();
    clearTimeout(debounceTimer);

    if (val.length < 2) {
        suggestionsBox.classList.add('hidden');
        suggestionsBox.innerHTML = '';
        return;
    }

    debounceTimer = setTimeout(() => {
        fetchSuggestions(val);
    }, 250);
});

document.addEventListener('click', (e) => {
    if (!searchInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.classList.add('hidden');
    }
});

searchInput.addEventListener('focus', () => {
    if (suggestionsBox.children.length > 0 && searchInput.value.trim().length >= 2) {
        suggestionsBox.classList.remove('hidden');
    }
});

async function loadUserPlaylist() {
    if (!auth.currentUser) return;
    playlistTracks.innerHTML = '<p style="color:gray; text-align:center; grid-column: 1 / -1;">Загрузка плейлиста...</p>';

    try {
        const snap = await getDocs(collection(db, "users", auth.currentUser.uid, "playlist"));
        myPlaylist = [];

        snap.forEach(d => {
            myPlaylist.push({ docId: d.id, ...d.data() });
        });

        playlistCount.innerText = myPlaylist.length;

        if (myPlaylist.length === 0) {
            playlistTracks.innerHTML = '<p style="color:gray; text-align:center; grid-column: 1 / -1;">В плейлисте пока нет песен</p>';
            return;
        }

        playlistTracks.innerHTML = '';
        myPlaylist.forEach(track => {
            const card = document.createElement('div');
            card.className = 'track-card';
            card.innerHTML = `
                <div class="track-card-header">
                    <img src="${track.artwork}" class="track-artwork" alt="cover">
                    <div class="track-meta">
                        <p class="track-title" title="${track.title}">${track.title}</p>
                        <p class="track-artist">${track.artist}</p>
                    </div>
                </div>
                <div class="track-card-actions">
                    <button class="btn-play-track">▶ Слушать</button>
                    <button class="btn-fav-track" style="color: #e11d48;">🗑 Удалить</button>
                </div>
            `;

            card.querySelector('.btn-play-track').onclick = () => playTrack(track.title, track.artist, track.videoId);
            card.querySelector('.btn-fav-track').onclick = async () => {
                await deleteDoc(doc(db, "users", auth.currentUser.uid, "playlist", track.docId));
                loadUserPlaylist();
            };

            playlistTracks.appendChild(card);
        });
    } catch (e) {
        playlistTracks.innerHTML = `<p style="color:#e11d48; text-align:center; grid-column: 1 / -1;">Ошибка загрузки: ${e.message}</p>`;
    }
}

async function togglePlaylistTrack(track, btn) {
    if (!auth.currentUser) return;
    const existing = myPlaylist.find(i => i.videoId === track.id);

    if (existing) {
        await deleteDoc(doc(db, "users", auth.currentUser.uid, "playlist", existing.docId));
        btn.innerText = '+ В плейлист';
        btn.style.color = 'white';
    } else {
        await setDoc(doc(db, "users", auth.currentUser.uid, "playlist", String(track.id)), {
            videoId: track.id,
            title: track.title,
            artist: track.artist,
            artwork: track.artwork,
            addedAt: Date.now()
        });
        btn.innerText = '✓ В плейлисте';
        btn.style.color = '#4ade80';
    }
    await loadUserPlaylist();
}