import os
from app.models.database import Video, Results, OverallResults, db


"""Functions to help streamline the process of adding to the database"""


def handle_video_upload(file):
    # Find upload folder and make on if doesnt exist.
    upload_folder = 'uploads/'
    if not os.path.exists(upload_folder):
        os.makedirs(upload_folder)

    # Get file path, then save video to file path
    file_path = os.path.join(upload_folder, file.filename)
    file.save(file_path)
    return file_path


def commit_results(data):
    for entry in data:
        # Create a new Results entry, results id is automatically generated
        result = Results(
            time=entry["timestamp"],
            classification=entry["classification"],
            video_id=entry["video_id"],
            source=entry["source"],
            duration=entry["duration"],
            sequence=entry["sequence_number"]
        )

        # Add to session
        db.session.add(result)

    # Commit all entries to the database
    db.session.commit()


def commit_overall(data):
    for entry in data:
        # Create a new Overall Results entry, id is automatically generated
        result = OverallResults(
            video_id=entry["video_id"],
            scratch_instances=entry["scratch_instances"],
            duration_seconds=entry["duration_seconds"],
        )

        # Add to session
        db.session.add(result)

    # Commit all entries to the database
    db.session.commit()


def commit_videos(data):
    print(data)
    try:
        for entry in data:
            # Create a new Video entry
            result = Video(
                name=entry["name"],
                filepath=entry["filepath"],
                original_file_name=entry["original_file_name"],
            )

            # Add to session
            db.session.add(result)

        # Commit all entries to the database
        db.session.commit()
        print("Videos committed successfully! ✅")

    except Exception as e:
        print(f"Unexpected error: {e}")  # Catch all other errors
        db.session.rollback()
