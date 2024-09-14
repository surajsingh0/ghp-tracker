# GHP (Goal Habit Progression)

GHP is a web application designed to help users track and manage their goals and habits.

## Directory Structure

-   `vanilla-client/` - Contains the frontend code.
-   `flask-backend-api/` - Contains the backend code.

## Installation and Setup

### Backend Setup (Flask)

1. **Navigate to the backend directory:**

    ```bash
    cd flask-backend-api
    ```

2. **Create and activate a virtual environment:**

    - **On Windows:**

        ```bash
        python -m venv venv
        venv\Scripts\activate
        ```

    - **On macOS/Linux:**

        ```bash
        python -m venv venv
        source venv/bin/activate
        ```

3. **Install the required Python packages:**

    ```bash
    pip install -r requirements.txt
    ```

4. **Set up environment variables:**

    Create a `.env` file in the `flask-backend-api` directory with the following content:

    ```
    JWT_SECRET_KEY=your-secret-key
    ```

    Replace `your-secret-key` with a secure key.

5. **Initialize the database:**

    Open a Python shell:

    ```bash
    python
    ```

    And run:

    ```python
    from app import db
    db.create_all()
    ```

6. **Run the Flask backend:**

    ```bash
    python app.py
    ```

    The backend will be accessible at `http://127.0.0.1:5000`.

### Frontend Setup (Vanilla JavaScript)

1. **Navigate to the frontend directory:**

    ```bash
    cd ../vanilla-client
    ```

2. **Choose a method to run the frontend:**

    - **Using Python’s Built-in HTTP Server:**

        If you prefer not to use `run.bat`, you can start a simple HTTP server using Python. Run one of the following commands based on your Python version:

        - **For Python 3.x:**

            ```bash
            python -m http.server 8000
            ```

        - **For Python 2.x:**

            ```bash
            python -m SimpleHTTPServer 8000
            ```

        The frontend will be accessible at `http://localhost:8000`.

    - **Using Node.js (if applicable):**

        If your project uses a Node.js server and you have a `package.json` with a `start` script, you can use:

        ```bash
        npm install
        npm start
        ```

        The frontend will be accessible at `http://localhost:3000`.

## Usage

-   **Backend API**: Access the backend API at `http://127.0.0.1:5000`. Refer to the backend code for details on available endpoints.
-   **Frontend**: Access the frontend application at `http://localhost:8000/3000
