// Function to refresh the access token using the refresh token
async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
        const response = await fetch("http://localhost:5000/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${refreshToken}`,
            },
        });

        if (response.ok) {
            const { access_token } = await response.json();
            localStorage.setItem("jwt_token", access_token);
            return true;
        } else {
            console.error("Failed to refresh token");
        }
    } catch (error) {
        console.error("Error refreshing token:", error);
    }
    return false;
}

async function refreshAndRequest(response, requestCallback) {
    if (response.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            return await requestCallback();
        } else {
            console.error("Token refresh failed. Redirecting to login...");
            alert("Try logging in!");
            return false;
        }
    }
}

async function verifyUserLogin() {
    const token = localStorage.getItem("jwt_token");

    if (!token) {
        return false;
    }

    try {
        const response = await fetch("http://localhost:5000/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({}),
        });

        if (response.status === 200 || response.ok) {
            return true;
        } else {
            return await refreshAndRequest(response, verifyUserLogin);
        }
    } catch (error) {
        console.error("Error verifying user login:", error);
    }
    return false;
}
