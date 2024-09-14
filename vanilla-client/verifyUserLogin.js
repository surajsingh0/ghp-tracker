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

        return response.status === 200;
    } catch (error) {
        console.error("Error verifying user login:", error);
        return false;
    }
}
