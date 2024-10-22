from flask_migrate import Migrate
from app import create_app, db

# Migrate in production only
app = create_app('production')
migrate = Migrate(app, db)

if __name__ == '__main__':
    from flask.cli import cli
    cli()