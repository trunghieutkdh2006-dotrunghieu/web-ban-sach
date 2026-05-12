const API_BASE_URL = window.location.origin + "/api/auth";
// =================================
// 1. CHỨC NĂNG ẨN/HIỆN MẬT KHẨU
// =================================
function togglePass(id, icon) {
    const input = document.getElementById(id);
    if (input.type === "password") {
        input.type = "text";
        icon.classList.remove("fa-eye");
        icon.classList.add("fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.remove("fa-eye-slash");
        icon.classList.add("fa-eye");
    }
}

// =================================
// 2. CHỨC NĂNG ĐĂNG NHẬP
// =================================
const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPass").value;

        if (!email || !password) {
            alert("Vui lòng nhập đầy đủ thông tin!");
            return;
        }

        try {
            // Gửi yêu cầu đến API (Port 5001)
            const response = await fetch(`${API_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
});

            const data = await response.json();

            if (response.ok) {
                // Lưu user vào localStorage để kiểm tra quyền truy cập ở các trang sau
                localStorage.setItem("user", JSON.stringify(data.user));
                alert("Đăng nhập thành công!");

                // Điều hướng dựa trên quyền (role)
                if (data.user && data.user.role === "admin") {
                    window.location.assign("admin-index.html");
                } else {
                    window.location.assign("index.html");
                }
            } else {
                alert(data.message || "Tài khoản hoặc mật khẩu không đúng!");
            }
        } catch (error) {
            console.error("Lỗi kết nối:", error);
            alert("Lỗi kết nối server hoặc MongoDB chưa chạy!");
        }
    });
}

// =================================
// 3. CHỨC NĂNG ĐĂNG KÝ (NẾU CÓ)
// =================================
const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const name = document.getElementById("regName").value;
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPass").value;

        try {
            const response = await fetch(`${API_BASE_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
});

            const data = await response.json();

            if (response.ok) {
                alert("Đăng ký thành công! Hãy đăng nhập.");
                window.location.href = "login.html";
            } else {
                alert(data.message || "Đăng ký thất bại!");
            }
        } catch (error) {
            console.error("Lỗi:", error);
            alert("Lỗi kết nối server!");
        }
    });
}