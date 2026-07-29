from flask import Flask
from flask_sock import Sock
from app.config import Config

# Module-level Sock instance so routes.py can import it
sock = Sock()

def create_app():
    app = Flask(__name__, template_folder='../templates', static_folder='../static')
    app.config.from_object(Config)

    # Initialise WebSocket extension
    sock.init_app(app)

    # Register blueprints/routes
    from routes import api_blueprint
    app.register_blueprint(api_blueprint)

    return app
