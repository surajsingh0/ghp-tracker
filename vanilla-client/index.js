document.addEventListener("DOMContentLoaded", async () => {
    const isLoggedIn = await verifyUserLogin();

    if (!isLoggedIn) {
        window.location.href = "/landing.html";
    } else {
        window.location.href = "/ghp-home.html";
    }
});
