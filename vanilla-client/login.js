const loginBtn = document.getElementById("loginBtn");

document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        loginBtn.setAttribute("disabled", true);
        loginBtn.innerText = "Logging In...";

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${baseUrl}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            const { access_token, refresh_token } = result;

            if (response.ok) {
                localStorage.setItem("jwt_token", access_token);
                localStorage.setItem("refresh_token", refresh_token);
                window.location.href = "";
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error("Error:", error);
            alert("Unexpected error!");
        } finally {
            loginBtn.removeAttribute("disabled");
            loginBtn.innerText = "Login";
        }
    });

document.addEventListener("DOMContentLoaded", async function () {
    if (await verifyUserLogin()) {
        window.location.href = "ghp-home.html";
    }

    const loadingOverlay = document.getElementById("loadingOverlay");
    loadingOverlay.classList.add("hidden");
});
