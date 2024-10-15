import os
from gunicorn.app.base import BaseApplication

class GunicornServer(BaseApplication):
    def __init__(self, app, options=None):
        self.options = options or {}
        self.application = app
        super().__init__()

    def load_config(self):
        config = {key: value for key, value in self.options.items()
                  if key in self.cfg.settings and value is not None}
        for key, value in config.items():
            self.cfg.set(key.lower(), value)

    def load(self):
        return self.application

def run_gunicorn(app):
    port = os.getenv('PORT', '8000')
    workers = int(os.getenv('WORKERS', 4))

    options = {
        'bind': f'0.0.0.0:{port}',
        'workers': workers,
    }

    GunicornServer(app, options).run()
