const API = "http://localhost:5001/api/users";

let allUsers = [];

// =========================
// LOAD USERS
// =========================
async function loadUsers() {
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("Lỗi tải users");

        allUsers = await res.json();
        renderStats(allUsers);
        renderTable(allUsers);
    } catch (err) {
        console.error(err);
        document.getElementById("userTableBody").innerHTML = `
            <tr><td colspan="5" class="empty">
                <i class="fas fa-exclamation-circle"></i>
                Không thể kết nối server
            </td></tr>
        `;
    }
}

// =========================
// RENDER STATS
// =========================
function renderStats(users) {
    document.getElementById("statTotal").textContent  = users.length;
    document.getElementById("statAdmin").textContent  = users.filter(u => u.role === "admin").length;
    document.getElementById("statLocked").textContent = users.filter(u => u.isLocked).length;
}

// =========================
// RENDER TABLE
// =========================
function renderTable(users) {
    const tbody = document.getElementById("userTableBody");

    if (users.length === 0) {
        tbody.innerHTML = `
            <tr><td colspan="5" class="empty">
                <i class="fas fa-users"></i>
                Không có tài khoản nào
            </td></tr>
        `;
        return;
    }

    tbody.innerHTML = users.map(user => {
        const initial = (user.username || "U")[0].toUpperCase();
        const createdAt = user.createdAt
            ? new Date(user.createdAt).toLocaleDateString("vi-VN")
            : "—";

        return `
            <tr id="row-${user._id}">
                <td>
                    <div class="user-cell">
                        <div class="avatar">${initial}</div>
                        <div>
                            <div class="name">${user.username}</div>
                            <div class="email">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    <span class="badge ${user.role === 'admin' ? 'admin' : 'user'}">
                        ${user.role === 'admin' ? '👑 Admin' : '👤 User'}
                    </span>
                </td>
                <td>
                    <span class="badge ${user.isLocked ? 'locked' : 'unlocked'}">
                        ${user.isLocked ? '🔒 Đã khóa' : '✅ Hoạt động'}
                    </span>
                </td>
                <td>${createdAt}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-role"
                            onclick="changeRole('${user._id}', '${user.role}')">
                            ${user.role === 'admin' ? '👤 Hạ user' : '👑 Lên admin'}
                        </button>
                        <button class="btn btn-lock"
                            onclick="toggleLock('${user._id}', ${user.isLocked})">
                            ${user.isLocked ? '🔓 Mở khóa' : '🔒 Khóa'}
                        </button>
                        <button class="btn btn-delete"
                            onclick="deleteUser('${user._id}', '${user.username}')">
                            ❌ Xóa
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join("");
}

// =========================
// SEARCH
// =========================
document.getElementById("searchInput").addEventListener("input", (e) => {
    const q = e.target.value.toLowerCase();
    const filtered = allUsers.filter(u =>
        u.username.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
    );
    renderTable(filtered);
});

// =========================
// CHANGE ROLE
// =========================
async function changeRole(id, currentRole) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    const label = newRole === "admin" ? "nâng lên Admin" : "hạ xuống User";

    if (!confirm(`Bạn muốn ${label} tài khoản này?`)) return;

    try {
        const res = await fetch(`${API}/${id}/role`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ role: newRole })
        });

        if (res.ok) {
            // Cập nhật local cache
            const u = allUsers.find(u => u._id === id);
            if (u) u.role = newRole;
            renderStats(allUsers);
            renderTable(allUsers);
        } else {
            const data = await res.json();
            alert("Lỗi: " + data.message);
        }
    } catch (err) {
        alert("Không thể kết nối server.");
    }
}

// =========================
// TOGGLE LOCK
// =========================
async function toggleLock(id, isLocked) {
    const action = isLocked ? "mở khóa" : "khóa";
    if (!confirm(`Bạn muốn ${action} tài khoản này?`)) return;

    try {
        const res = await fetch(`${API}/${id}/lock`, { method: "PATCH" });

        if (res.ok) {
            const data = await res.json();
            const u = allUsers.find(u => u._id === id);
            if (u) u.isLocked = data.isLocked;
            renderStats(allUsers);
            renderTable(allUsers);
        } else {
            const data = await res.json();
            alert("Lỗi: " + data.message);
        }
    } catch (err) {
        alert("Không thể kết nối server.");
    }
}

// =========================
// DELETE USER
// =========================
async function deleteUser(id, username) {
    if (!confirm(`Xóa tài khoản "${username}"? Hành động này không thể hoàn tác.`)) return;

    try {
        const res = await fetch(`${API}/${id}`, { method: "DELETE" });

        if (res.ok) {
            allUsers = allUsers.filter(u => u._id !== id);
            renderStats(allUsers);
            renderTable(allUsers);
        } else {
            const data = await res.json();
            alert("Lỗi: " + data.message);
        }
    } catch (err) {
        alert("Không thể kết nối server.");
    }
}

// =========================
// INIT
// =========================
document.addEventListener("DOMContentLoaded", loadUsers);