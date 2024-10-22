const DEV_BASE_URL = "http://localhost:5000";
const PROD_BASE_URL =
    "https://cpuw44k4g0.execute-api.us-east-1.amazonaws.com/production";
const hostname = window.location.hostname;

const baseUrl = ["127.0.0.1", "localhost"].includes(hostname)
    ? DEV_BASE_URL
    : PROD_BASE_URL;
