const DEV_BASE_URL = "http://localhost:5000";
const PROD_BASE_URL = "http://your-production-url.com";
const hostname = window.location.hostname;

const baseUrl = ["127.0.0.1", "localhost"].includes(hostname)
    ? DEV_BASE_URL
    : PROD_BASE_URL;
