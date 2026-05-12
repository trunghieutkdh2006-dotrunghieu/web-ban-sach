const API = "http://localhost:5001/api/books";
const CATEGORY_API = "http://localhost:5001/api/categories";
const IMAGE_BASE_URL = "http://localhost:5001";

// =========================
// GLOBAL STATE
// =========================
let booksCache = [];
let currentCategory = "Tất cả";
let wishlist = validateWishlist(JSON.parse(localStorage.getItem("wishlist")));
let user = JSON.parse(localStorage.getItem("user")) || null;
const CART_KEY = "cart";

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function updateCartCount() {
    const cart = getCart();
    const count = cart.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
    const badge = document.getElementById("cart-count");
    if (badge) badge.innerText = count;
}

function normalizeCartItem(book) {
    return {
        id: book._id || book.id || "",
        title: book.title || book.name || "Sản phẩm",
        price: Number(book.price) || 0,
        image: book.image || "",
        quantity: 1,
        author: book.author || ""
    };
}

// =========================
// HELPERS
// =========================
function validateWishlist(value) {
    if (!Array.isArray(value)) return [];
    const valid = value
        .filter(item => item && typeof item === "object" && item._id)
        .reduce((acc, item) => {
            if (!acc.some(existing => existing._id === item._id)) acc.push(item);
            return acc;
        }, []);
    if (valid.length !== (value || []).length) {
        localStorage.setItem("wishlist", JSON.stringify(valid));
    }
    return valid;
}

// ✅ Xóa wishlist cũ không còn trong DB
function cleanWishlist() {
    const before = wishlist.length;
    wishlist = wishlist.filter(w => booksCache.some(b => b._id === w._id));
    if (wishlist.length !== before) {
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
    }
}

function getBookImage(book) {
    if (!book || !book.image || book.image === "undefined") return "img/default-book.png";
    if (book.image.startsWith("http")) return book.image;
    return `${IMAGE_BASE_URL}${book.image}`;
}

function getBookPdf(book) {
    if (!book || !book.samplePdf || book.samplePdf === "undefined") return null;
    if (book.samplePdf.startsWith("http")) return book.samplePdf;
    return `${IMAGE_BASE_URL}${book.samplePdf}`;
}

function openPdfPreview(bookId) {
    const book = booksCache.find(b => b._id === bookId);
    if (!book) return;
    const pdfUrl = getBookPdf(book);
    if (!pdfUrl) return alert('Chưa có file đọc thử cho sách này.');

    document.querySelector('.pdf-preview-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'pdf-preview-overlay';
    overlay.innerHTML = `
        <div class="pdf-preview-modal">
            <button class="pdf-close-btn" onclick="document.querySelector('.pdf-preview-overlay')?.remove()">Đóng</button>
            <iframe src="${pdfUrl}" allowfullscreen></iframe>
        </div>
    `;
    document.body.appendChild(overlay);
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", () => {
    loadBooks();
    loadCategories();
    initUserSystem();
    updateCartCount();
});

// =========================
// LOAD BOOKS
// =========================
async function loadBooks() {
    try {
        const res = await fetch(API);
        const books = await res.json();
        booksCache = books;

        // ✅ Dọn wishlist sau khi có dữ liệu DB
        cleanWishlist();

        renderBooks(books);
        renderAdminBooks(books);
        renderWishlistIcon();
        renderWishlistPopup();
    } catch (err) {
        console.error("Lỗi tải sách:", err);
    }
}

// =========================
// RENDER BOOKS
// =========================
function renderBooks(books) {
    const container = document.getElementById("new-books");
    if (!container) return;

    if (!books || books.length === 0) {
        container.innerHTML = '<div class="empty-state">Không có sách phù hợp.</div>';
        return;
    }

    if (currentCategory === 'Tất cả') {
        renderSections(books);
        return;
    }

    container.innerHTML = `
        <section class="book-section">
            <div class="section-header">
                <div>
                    <p class="section-tag">Thể loại</p>
                    <h2>${getSectionTitle(currentCategory)}</h2>
                </div>
                <a href="#" class="section-link" onclick="filterByCategory('Tất cả'); return false;">Xem tất cả →</a>
            </div>
            <div class="section-row">
                ${books.map(renderBookCard).join('')}
            </div>
        </section>
    `;
}

async function loadCategories() {
    try {
        const res = await fetch(CATEGORY_API);
        if (!res.ok) throw new Error("Không thể tải thể loại");
        const categories = await res.json();
        renderCategoryMenu(categories);
    } catch (err) {
        console.warn("Lỗi loadCategories:", err);
    }
}

function renderCategoryMenu(categories) {
    const dropdown = document.getElementById("categoryDropdown");
    if (!dropdown) return;
    dropdown.innerHTML = `
        <li><a href="#" onclick="filterByCategory('Tất cả'); return false;">Tất cả</a></li>
        ${categories.map(cat => `
            <li><a href="#" onclick="filterByCategory('${cat.name.replace(/'/g, "\\'")}'); return false;">${cat.name}</a></li>
        `).join('')}
    `;
}

function renderBookCard(book) {
    const id = book._id;
    const displayImage = getBookImage(book);
    const pdfButton = book.samplePdf ? `<button class="read-sample-btn is-primary" onclick="openPdfPreview('${id}')">📖 Đọc thử</button>` : "";
    return `
        <div class="book-card">
            <img src="${displayImage}" onclick="openBookDetail('${id}')" onerror="this.src='img/default-book.png'" />
            <div class="book-info">
                <h3 onclick="openBookDetail('${id}')">${book.title}</h3>
                <p>${book.author}</p>
                <h4>${Number(book.price).toLocaleString()}đ</h4>
                <div class="book-actions">
                    <button class="is-primary" onclick="addToCart('${id}')">🛒 Giỏ</button>
                    ${pdfButton}
                    <button onclick="toggleWishlist('${id}')">
                        ${isWishlisted(id) ? "❤️" : "🤍"}
                    </button>
                </div>
            </div>
        </div>
    `;
}

function getSectionLabel(category) {
    const key = String(category || '').toLowerCase();
    if (key.includes('ngoại')) return 'Sản phẩm ngoại văn';
    if (key.includes('tiếng anh') || key.includes('anh')) return 'Sách học tiếng Anh';
    if (key.includes('tiểu thuyết') || key.includes('truyện')) return 'Tiểu thuyết & Văn học';
    return 'Bộ sưu tập sách';
}

function getSectionTitle(category) {
    const key = String(category || '').toLowerCase();
    if (key.includes('ngoại')) return 'Ngoại văn nổi bật';
    if (key.includes('tiếng anh') || key.includes('anh')) return 'Sách tiếng Anh hot';
    if (key.includes('tiểu thuyết') || key.includes('truyện')) return 'Tiểu thuyết hấp dẫn';
    return category || 'Sách nổi bật';
}

function renderSections(books) {
    const container = document.getElementById('new-books');
    if (!container) return;

    const categories = Array.from(new Set(
        books
            .map(book => String(book.category || '').trim())
            .filter(category => category.length > 0)
    ));

    const preferred = ['Ngoại văn', 'Tiếng Anh', 'Tiểu thuyết', 'Học tiếng Anh'];
    const sections = [];

    preferred.forEach((name) => {
        const match = categories.find(cat => cat.toLowerCase().includes(name.toLowerCase()));
        if (match && !sections.includes(match)) sections.push(match);
    });

    categories.forEach((category) => {
        if (sections.length < 3 && !sections.includes(category)) sections.push(category);
    });

    const visibleSections = sections.slice(0, 3);
    if (visibleSections.length === 0) {
        container.innerHTML = '<div class="empty-state">Không có sách để hiển thị.</div>';
        return;
    }

    container.innerHTML = visibleSections.map(category => {
        const sectionBooks = books.filter(book => String(book.category || '').toLowerCase() === String(category).toLowerCase()).slice(0, 6);
        return `
            <section class="book-section">
                <div class="section-header">
                    <div>
                        <p class="section-tag">${getSectionLabel(category)}</p>
                        <h2>${getSectionTitle(category)}</h2>
                    </div>
                    <a href="#" class="section-link" onclick="filterByCategory('${category.replace(/'/g, "\\'")}'); return false;">Xem tất cả →</a>
                </div>
                <div class="section-row">
                    ${sectionBooks.map(renderBookCard).join('')}
                </div>
            </section>
        `;
    }).join('');
}

function filterByCategory(category) {
    currentCategory = category;
    const filteredBooks = category === 'Tất cả'
        ? booksCache
        : booksCache.filter(book => String(book.category || '').toLowerCase() === String(category).toLowerCase());
    renderBooks(filteredBooks);
}

// =========================
// BOOK DETAIL
// =========================
function openBookDetail(id) {
    const book = booksCache.find(b => b._id === id);
    if (!book) return;
    const displayImage = getBookImage(book);
    const pdfButton = book.samplePdf ? `<button class="read-sample-btn" onclick="openPdfPreview('${id}')">📖 Đọc thử</button>` : "";
    document.querySelector(".book-modal")?.remove();
    const modal = document.createElement("div");
    modal.className = "book-modal";
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeBookModal()">×</span>
            <img src="${displayImage}" onerror="this.src='img/default-book.png'" />
            <h2>${book.title}</h2>
            <p>${book.author}</p>
            <p>${Number(book.price).toLocaleString()}đ</p>
            <p>${book.description || ""}</p>
            <div class="book-actions">
                <button onclick="addToCart('${id}')">🛒 Thêm giỏ</button>
                ${pdfButton}
                <button onclick="toggleWishlist('${id}')">
                    ${isWishlisted(id) ? "❤️" : "🤍"}
                </button>
            </div>
        </div>
    `;
    modal.addEventListener('click', (event) => {
        if (event.target === modal) closeBookModal();
    });
    document.body.appendChild(modal);
    document.body.classList.add('modal-open');
}

function closeBookModal() {
    document.querySelector('.book-modal')?.remove();
    document.body.classList.remove('modal-open');
}

// =========================
// CART
// =========================
function addToCart(id) {
    const book = booksCache.find(b => b._id === id);
    if (!book) return;
    const cart = getCart();
    const existing = cart.find(item => item.id === id);
    if (existing) {
        existing.quantity = Number(existing.quantity || 0) + 1;
    } else {
        cart.push(normalizeCartItem(book));
    }
    saveCart(cart);
    updateCartCount();

    if (typeof Swal !== "undefined") {
        Swal.fire({
            icon: 'success',
            title: 'Đã thêm vào giỏ hàng',
            text: `${book.title} đã được thêm vào giỏ hàng.`,
            timer: 1200,
            showConfirmButton: false
        });
    } else {
        alert("Đã thêm vào giỏ 🛒");
    }
}

// =========================
// WISHLIST
// =========================
function toggleWishlist(id) {
    const book = booksCache.find(b => b._id === id);
    if (!book) return;
    const index = wishlist.findIndex(b => b._id === id);
    if (index === -1) wishlist.push(book);
    else wishlist.splice(index, 1);
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    renderBooks(booksCache);
    renderWishlistIcon();
    renderWishlistPopup();
}

function isWishlisted(id) {
    return wishlist.some(b => b._id === id);
}

function renderWishlistIcon() {
    const btn = document.querySelector('[title="Yêu thích"]');
    if (!btn) return;
    // ✅ Chỉ đếm sách còn tồn tại trong DB
    const count = wishlist.filter(w => booksCache.some(b => b._id === w._id)).length;
    btn.innerHTML = `<i class="far fa-heart"></i> <span class="heart-count">${count}</span>`;
}

function openCart() {
    window.location.href = "cart.html";
}

function clearWishlist() {
    if (!wishlist.length) return;
    if (!confirm("Bạn có chắc muốn xóa toàn bộ sách đã tim không?")) return;
    wishlist = [];
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
    renderBooks(booksCache);
    renderWishlistIcon();
    renderWishlistPopup();
}

function renderWishlistPopup() {
    const container = document.getElementById("wishlistItems");
    if (!container) return;
    if (!wishlist.length) {
        container.innerHTML = '<div class="heart-empty">Bạn chưa tim cuốn sách nào.</div>';
        return;
    }
    container.innerHTML = wishlist.map(book => {
        const imageUrl = getBookImage(book);
        return `
            <div class="heart-dropdown-item">
                <img src="${imageUrl}" alt="${book.title}" onerror="this.src='img/default-book.png'" />
                <div class="heart-dropdown-item-info">
                    <div class="title">${book.title}</div>
                    <div class="author">${book.author || "Không rõ tác giả"}</div>
                </div>
            </div>
        `;
    }).join("");
}

// =========================
// ADMIN
// =========================
function renderAdminBooks(books) {
    const container = document.getElementById("admin-books");
    if (!container) return;
    container.innerHTML = "";
    books.forEach(book => {
        const displayImage = getBookImage(book);
        container.innerHTML += `
            <div class="book-item">
                <img src="${displayImage}" onerror="this.src='img/default-book.png'" />
                <h3>${book.title}</h3>
                <p>${book.author}</p>
                <b>${Number(book.price).toLocaleString()}đ</b>
                <button onclick="deleteBook('${book._id}')">❌ Xoá</button>
            </div>
        `;
    });
}

async function deleteBook(id) {
    if (!confirm("Xoá sách?")) return;
    const res = await fetch(`${API}/${id}`, { method: "DELETE" });
    if (res.ok) {
        booksCache = booksCache.filter(b => b._id !== id);
        // ✅ Xóa khỏi wishlist luôn
        wishlist = wishlist.filter(w => w._id !== id);
        localStorage.setItem("wishlist", JSON.stringify(wishlist));
        renderBooks(booksCache);
        renderAdminBooks(booksCache);
        renderWishlistIcon();
    }
}

// =========================
// ADD BOOK FORM
// =========================
const addBookForm = document.getElementById("addBookForm");
if (addBookForm) {
    addBookForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const data = {
            title: document.getElementById("title").value,
            author: document.getElementById("author").value,
            price: Number(document.getElementById("price").value),
            image: document.getElementById("image").value,
            description: document.getElementById("description").value,
        };
        try {
            const res = await fetch(API + "/add", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            if (res.ok) {
                alert("Thêm sách thành công!");
                loadBooks();
                addBookForm.reset();
            } else {
                const errorData = await res.json();
                alert("Lỗi từ server: " + errorData.message);
            }
        } catch (err) {
            console.error("Lỗi kết nối:", err);
        }
    });
}

// =========================
// AUTH PANEL
// =========================
function toggleAuth(show) {
    const panel = document.getElementById("authPanel");
    if (!panel) return;
    if (show) panel.classList.add("active");
    else panel.classList.remove("active");
}

function switchAuthTab(tab) {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    const tabLogin = document.getElementById("tabLogin");
    const tabRegister = document.getElementById("tabRegister");
    const authTitle = document.getElementById("authTitle");
    const authSubtitle = document.getElementById("authSubtitle");

    if (tab === "login") {
        loginForm.style.display = "block";
        registerForm.style.display = "none";
        tabLogin.classList.add("active");
        tabRegister.classList.remove("active");
        authTitle.textContent = "Chào bạn trở lại!";
        authSubtitle.textContent = "Vui lòng đăng nhập để tiếp tục khám phá sách.";
    } else {
        loginForm.style.display = "none";
        registerForm.style.display = "block";
        tabLogin.classList.remove("active");
        tabRegister.classList.add("active");
        authTitle.textContent = "Tạo tài khoản mới";
        authSubtitle.textContent = "Đăng ký để khám phá hàng ngàn đầu sách hay.";
    }
}

// =========================
// USER SYSTEM
// =========================
function initUserSystem() {
    const userBtn = document.getElementById("userBtn");

    if (userBtn) {
        userBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (!user) {
                toggleAuth(true);
            } else {
                const menu = document.getElementById("userDropdown");
                if (menu) menu.classList.toggle("show");
            }
        });
    }

    updateUserUI();

    document.addEventListener("click", () => {
        document.getElementById("userDropdown")?.classList.remove("show");
    });

    // LOGIN
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = document.getElementById("loginEmail").value.trim();
            const pass = document.getElementById("loginPass").value;
            try {
                const res = await fetch("http://localhost:5001/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password: pass })
                });
                const data = await res.json();
                if (res.ok) {
                    loginSuccess(data.user, data.token);
                } else {
                    alert(data.message || "Sai email hoặc mật khẩu ❌");
                }
            } catch (err) {
                alert("Không thể kết nối server. Vui lòng thử lại.");
            }
        });
    }

    // REGISTER
    const registerForm = document.getElementById("registerForm");
    if (registerForm) {
        registerForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const username = document.getElementById("regName").value.trim();
            const email = document.getElementById("regEmail").value.trim();
            const pass = document.getElementById("regPass").value;
            try {
                const res = await fetch("http://localhost:5001/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, email, password: pass })
                });
                const data = await res.json();
                if (res.ok) {
                    alert("Đăng ký thành công! Vui lòng đăng nhập 🎉");
                    switchAuthTab("login");
                } else {
                    alert(data.message || "Đăng ký thất bại ❌");
                }
            } catch (err) {
                alert("Không thể kết nối server. Vui lòng thử lại.");
            }
        });
    }
}

// =========================
// LOGIN SUCCESS
// =========================
function loginSuccess(userObj, token) {
    user = {
        id: userObj.id,
        username: userObj.username,
        email: userObj.email,
        role: userObj.role,
        token: token || ""
    };
    localStorage.setItem("user", JSON.stringify(user));
    toggleAuth(false);
    updateUserUI();
    alert(`Đăng nhập thành công 🎉 Xin chào ${user.username}!`);
}

// =========================
// UPDATE UI
// =========================
function updateUserUI() {
    const userBtn = document.getElementById("userBtn");
    const menu = document.getElementById("userDropdown");
    if (!userBtn) return;

    if (user) {
        userBtn.innerHTML = `<i class="far fa-user-circle"></i> ${user.username}`;
        if (menu) {
            menu.innerHTML = `
                <a href="#" onclick="openProfile()">👤 Hồ sơ</a>
                <a href="#" onclick="openOrders()">📦 Lịch sử mua hàng</a>
                <a href="#" onclick="openSettings()">⚙️ Cài đặt</a>
                ${user.role === 'admin' ? '<a href="admin-index.html">👑 Admin Dashboard</a>' : ''}
                <a href="#" onclick="logout()">🚪 Đăng xuất</a>
            `;
        }
    } else {
        userBtn.innerHTML = `<i class="far fa-user-circle"></i>`;
        if (menu) {
            menu.innerHTML = `<a href="#" onclick="toggleAuth(true)">Đăng nhập</a>`;
        }
    }
}

// =========================
// LOGOUT
// =========================
function logout() {
    localStorage.removeItem("user");
    user = null;
    updateUserUI();
    document.getElementById("userDropdown")?.classList.remove("show");
    alert("Đã đăng xuất");
}

function openProfile() {
    if (!user) { toggleAuth(true); return; }
    window.location.href = "profile.html";
}

function openOrders() {
    if (!user) { toggleAuth(true); return; }
    window.location.href = "orders.html";
}

function openSettings() {
    if (!user) { toggleAuth(true); return; }
    window.location.href = "settings.html";
}

// =========================
// TOGGLE PASSWORD
// =========================
function togglePass(inputId, icon) {
    const input = document.getElementById(inputId);
    if (!input) return;
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}