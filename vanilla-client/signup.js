const signUpBtn = document.getElementById("signUpBtn");

document
    .getElementById("registerForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        signUpBtn.setAttribute("disabled", true);
        signUpBtn.innerText = "Signing Up...";

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${baseUrl}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            alert(result.message);

            if (response.ok) {
                window.location.href = "login.html"; // Redirect to login page after successful registration
            }
        } catch (error) {
            console.error("Error:", error);
        } finally {
            signUpBtn.removeAttribute("disabled");
            signUpBtn.innerText = "Register";
        }
    });

document.addEventListener("DOMContentLoaded", async function () {
    if (await verifyUserLogin()) {
        window.location.href = "ghp-home.html";
    }

    const loadingOverlay = document.getElementById("loadingOverlay");
    loadingOverlay.classList.add("hidden");
});
