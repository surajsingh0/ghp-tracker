document
    .getElementById("loginForm")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const username = document.getElementById("username").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("http://localhost:5000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();
            alert(result.message || `Access Token: ${result.access_token}`);

            if (response.ok) {
                localStorage.setItem("jwt_token", result.access_token); // Save token for future requests
                window.location.href = "/"; // Redirect to homepage or another protected route
            }
        } catch (error) {
            console.error("Error:", error);
        }
    });

document.addEventListener("DOMContentLoaded", async function () {
    if (await verifyUserLogin()) {
        window.location.href = "/ghp-home.html";
    }
});
