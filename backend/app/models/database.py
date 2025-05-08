from app import db

# Tables within database, see diagram for connections between tables


class Video(db.Model):
    __tablename__ = 'videos'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    filepath = db.Column(db.String(200), nullable=False)
    original_file_name = db.Column(db.String(200), nullable=False)


class Results(db.Model):
    __tablename__ = 'results'
    id = db.Column(db.Integer, primary_key=True)
    video_id = db.Column(db.Integer, nullable=False)
    classification = db.Column(db.String(255))
    time = db.Column(db.Float, nullable=False)
    source = db.Column(db.String(200))
    duration = db.Column(db.Integer, nullable=False)
    sequence = db.Column(db.Integer, nullable=False)


class OverallResults(db.Model):
    __tablename__ = 'overall_results'
    video_id = db.Column(db.Integer, nullable=False,
                         primary_key=True)
    scratch_instances = db.Column(db.Integer, nullable=False)
    duration_seconds = db.Column(db.Float, nullable=False)
