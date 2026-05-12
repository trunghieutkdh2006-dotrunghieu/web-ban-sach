const API = "window.location.origin/api/users";
let allUsers = [];
const DEFAULT_PASSWORD = "12345678";

async function loadUsers() {
    try {
        const res = await fetch(API);
        if (!res.ok) throw new Error("Loi");
        allUsers = await res.json();
        renderStats(allUsers);
        renderTable(allUsers);
    } catch (err) {
        document.getElementById("userTableBody").innerHTML = "<tr><td colspan='5' style='text-align:center;padding:40px;color:#888'>Khong the ket noi server</td></tr>";
        renderStats([]);
    }
}

function renderStats(users) {
    document.getElementById("statTotal").textContent = users.length;
    document.getElementById("statAdmin").textContent = users.filter(u => u.role === "admin").length;
    document.getElementById("statLocked").textContent = users.filter(u => u.isLocked).length;
}

function renderTable(users) {
    const tbody = document.getElementById("userTableBody");
    if (!users.length) {
        tbody.innerHTML = "<tr><td colspan='5' style='text-align:center;padding:40px'>Khong co tai khoan nao</td></tr>";
        return;
    }
    tbody.innerHTML = users.map(user => {
        const initial = (user.username || "U")[0].toUpperCase();
        const createdAt = user.createdAt ? new Date(user.createdAt).toLocaleDateString("vi-VN") : "-";
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
                <td><span class="badge ${user.role === 'admin' ? 'admin' : 'user'}">${user.role === 'admin' ? 'Admin' : 'User'}</span></td>
                <td><span class="badge ${user.isLocked ? 'locked' : 'unlocked'}">${user.isLocked ? 'Da khoa' : 'Hoat dong'}</span></td>
                <td>${createdAt}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-role" onclick="changeRole('${user._id}','${user.role}')">${user.role === 'admin' ? 'Hạ user' : 'Lên admin'}</button>
                        <button class="btn btn-lock" onclick="toggleLock('${user._id}',${user.isLocked})">${user.isLocked ? 'Mở khóa' : 'Khóa'}</button>
                        <button class="btn btn-delete" onclick="deleteUser('${user._id}','${user.username}')">Xóa</button>
                    </div>
                </td>
            </tr>`;
    }).join("");
}

function setupAdminEvents() {
    const searchInput = document.getElementById("searchInput");

    if (searchInput) {
        searchInput.addEventListener("input", e => {
            const q = e.target.value.toLowerCase().trim();

            const filtered = allUsers.filter(u =>
                (u.username || "").toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q)
            );

            renderTable(filtered);
        });
    }
}

function normalizeBoolean(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "number") return value === 1;
    if (typeof value === "string") {
        const lower = value.trim().toLowerCase();
        return lower === "true" || lower === "1" || lower === "yes" || lower === "x";
    }
    return false;
}

function normalizeRow(row) {
    return {
        username: String(row.username || row.Username || row.name || row.Name || "").trim(),
        email: String(row.email || row.Email || "").trim().toLowerCase(),
        password: String(row.password || row.Password || DEFAULT_PASSWORD).trim() || DEFAULT_PASSWORD,
        role: ["admin", "user"].includes(String(row.role || row.Role || "user").trim().toLowerCase())
            ? String(row.role || row.Role || "user").trim().toLowerCase()
            : "user",
        isLocked: normalizeBoolean(row.isLocked || row.IsLocked || row.locked || row.Locked)
    };
}

async function importExcel() {
    const fileInput = document.getElementById("importFileInput");
    if (!fileInput.files.length) {
        return alert("Vui lòng chọn file Excel hoặc CSV trước khi import.");
    }

    const file = fileInput.files[0];
    try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (!rows.length) {
            return alert("File không chứa dữ liệu hợp lệ.");
        }

        const users = rows.map(normalizeRow).filter(row => row.username && row.email);

        if (!users.length) {
            return alert("Không tìm thấy dòng dữ liệu người dùng hợp lệ trong file.");
        }

        const res = await fetch(API + "/import", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ users })
        });

        const result = await res.json();
        if (!res.ok) {
            throw new Error(result.message || "Lỗi import");
        }

        alert(`Import hoàn tất: ${result.createdCount} tài khoản được tạo, ${result.skipped.length} dòng bị bỏ qua.`);
        fileInput.value = "";
        loadUsers();
    } catch (err) {
        console.error(err);
        alert("Lỗi import file: " + err.message);
    }
}

function exportCSV() {
    if (!allUsers.length) {
        return alert("Không có dữ liệu để xuất.");
    }

    const header = ["username", "email", "role", "isLocked", "createdAt"];
    const rows = allUsers.map(user => [
        user.username,
        user.email,
        user.role,
        user.isLocked ? "true" : "false",
        user.createdAt ? new Date(user.createdAt).toLocaleString("vi-VN") : ""
    ]);
    const csvContent = [header, ...rows].map(r => r.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "users_export.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function changeRole(id, currentRole) {
    const newRole = currentRole === "admin" ? "user" : "admin";
    if (!confirm("Đổi quyền thành " + newRole + "?")) return;
    const res = await fetch(API + "/" + id + "/role", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole })
    });
    if (res.ok) {
        const u = allUsers.find(u => u._id === id);
        if (u) u.role = newRole;
        renderStats(allUsers);
        renderTable(allUsers);
    }
}

async function toggleLock(id, isLocked) {
    if (!confirm(isLocked ? "Mở khóa?" : "Khoá tài khoản?")) return;
    const res = await fetch(API + "/" + id + "/lock", { method: "PATCH" });
    if (res.ok) {
        const data = await res.json();
        const u = allUsers.find(u => u._id === id);
        if (u) u.isLocked = data.isLocked;
        renderStats(allUsers);
        renderTable(allUsers);
    }
}

async function deleteUser(id, username) {
    if (!confirm("Xóa tài khoản " + username + "?")) return;
    const res = await fetch(API + "/" + id, { method: "DELETE" });
    if (res.ok) {
        allUsers = allUsers.filter(u => u._id !== id);
        renderStats(allUsers);
        renderTable(allUsers);
    }
}

function initAdminPage() {
    setupAdminEvents();
    loadUsers();
    window.addEventListener("error", event => {
        console.error("Admin page error:", event.message, event.error);
        document.getElementById("userTableBody").innerHTML = "<tr><td colspan='5' style='text-align:center;padding:40px;color:#888'>Có lỗi xảy ra. Vui lòng reload lại trang.</td></tr>";
        renderStats([]);
    });
}

if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAdminPage);
} else {
    initAdminPage();
}
