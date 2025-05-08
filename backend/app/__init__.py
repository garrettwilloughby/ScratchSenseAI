from flask import Flask
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()  # Define db instance here


def create_app():
    app = Flask(__name__)

    # Configurations
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///data.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['UPLOAD_FOLDER'] = 'uploads'
    app.config['ALLOWED_EXTENSIONS'] = {'mp4', 'avi', 'mov'}

    # Initialize the db with app
    db.init_app(app)

    # Import routes
    from app.routes import bp
    from app.dlc_routes import dlc_bp
    app.register_blueprint(bp)
    app.register_blueprint(dlc_bp)

    return app
