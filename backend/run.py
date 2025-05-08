from app import create_app, db
from app.models.database import db
from flask_cors import CORS  # Import CORS


app = create_app()


CORS(app, support_credentials=True)

app.config['MAX_CONTENT_LENGTH'] = 1 * 1024 * 1024 * 1024    # 1GB
# Initialize the database tables
with app.app_context():
    db.create_all()


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=8080)
