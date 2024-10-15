from flask import Flask
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from flask_migrate import Migrate
import sys

from models import db
from routes import main as main_blueprint
from config import config

migrate = Migrate()

def create_app(config_name):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    CORS(app)

    # Initialize extensions
    db.init_app(app)
    bcrypt = Bcrypt(app)
    jwt = JWTManager(app)
    migrate.init_app(app, db)

    # Register blueprints
    app.register_blueprint(main_blueprint)

    return app

if __name__ == '__main__':
    # Determine the configuration from the command line argument
    if len(sys.argv) > 1:
        config_name = sys.argv[1].lower()
        if config_name not in ['dev', 'prod', 'testing']:
            print("Invalid configuration. Use 'dev', 'prod', or 'testing'.")
            sys.exit(1)
        config_name = {
            'dev': 'development',
            'prod': 'production',
            'testing': 'testing'
        }[config_name]
    else:
        config_name = 'development'

    app = create_app(config_name)

    # Use Gunicorn for production mode
    if config_name == 'production':
        try:
            from gunicorn_server import run_gunicorn
            run_gunicorn(app)
        except ImportError:
            print("Gunicorn is not installed. Please install it to run in production.")
            sys.exit(1)
    else:
        with app.app_context():
            db.create_all()
        app.run()