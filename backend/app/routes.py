
import os
import subprocess
import deeplabcut
from flask_cors import cross_origin
from flask import *
from app.models.database import Video, Results, db, OverallResults
from .utils.file_helpers import commit_videos
from app.algorithm import main
from config import UPLOAD_FOLDER, CONFIG_PATH

bp = Blueprint('main', __name__)
# Main test route


@bp.route('/')
def home():
    """Test route to check if route tree is runing"""
    return '<p>Hello, world!</p>'


@bp.route('/clear_database', methods=['POST'])
@cross_origin()   # Enable CORS for this route only
def clear_database():
    """Clears database. Deletes all tables then creates them without data."""
    try:
        db.drop_all()  # Drops all tables
        db.create_all()  # Recreates tables

        return jsonify({"message": "Database reset successfully"}), 200
    except Exception as e:
        db.session.rollback()  # If error, revert changes
        return jsonify({"error": str(e)}), 500


@bp.route('/upload', methods=['POST'])
@cross_origin()  # Enable CORS for this route only
def upload_video():
    """API to upload videos to the deeplabcut model"""
    try:
        # Check if a file is included in the request
        if 'video' not in request.files:
            return jsonify({"message": "No file part"}), 400

        video = request.files['video']
        print(video)

        # If no video is selected
        if video.filename == '':
            return jsonify({"message": "No selected file"}), 400

        # Check the file extension
        allowed_extensions = {'mp4', 'mov', 'avi'}
        if not video.filename.lower().endswith(tuple(allowed_extensions)):
            return jsonify({"message": "Invalid file format"}), 400

        next_video_id = get_next_video_id()
        next_video_name = f"{next_video_id}_video.mp4"
        temp_path = os.path.join(
            UPLOAD_FOLDER, f"temp_{next_video_id}_video.mp4")
        final_path = os.path.join(UPLOAD_FOLDER, next_video_name)

        # Save the file temporarily
        video.save(temp_path)

        # Encode the video using FFmpeg, makes the video run in-browser
        ffmpeg_command = [
            "ffmpeg", "-i", temp_path,
            "-vcodec", "libx264", "-acodec", "aac", "-strict", "experimental",
            final_path
        ]
        subprocess.run(ffmpeg_command, check=True)

        # Remove the temporary file
        os.remove(temp_path)

        # Format JSON for the database
        data = [{
            "name": next_video_name,
            "filepath": final_path,
            "original_file_name": video.filename
        }]

        # Commit to database
        print(data)
        commit_videos(data)

        # Add new video to DLC config without copying video
        try:
            print("Attempting to add video to DeepLabCut config...")
            deeplabcut.add_new_videos(
                CONFIG_PATH, [final_path], copy_videos=False)
            print("add_new_videos completed successfully")
        except Exception as dlc_err:
            print("DeepLabCut error while adding video:", dlc_err)
            return jsonify({"message": f"DeepLabCut Error: {str(dlc_err)}"}), 500

        return jsonify({"message": f"Video uploaded and encoded successfully to {final_path}"}), 200

    except subprocess.CalledProcessError as e:
        return jsonify({"message": f"FFmpeg Error: {str(e)}"}), 500
    except Exception as e:
        return jsonify({"message": f"Error: {str(e)}"}), 500


@bp.route('/delete_video/<int:video_id>', methods=['DELETE'])
@cross_origin()  # Enable CORS for this route only
def delete_video(video_id):
    """API to delete a video and its associated flags and overall results from the database."""
    try:
        # Fetch the video by ID
        video = Video.query.get(video_id)
        if not video:
            return jsonify({"message": "Video not found"}), 404

        # Fetch and delete associated flags
        flags = Results.query.filter_by(video_id=video_id).all()
        if flags:
            for flag in flags:
                db.session.delete(flag)

        # Fetch and delete associated overall result
        overall_result = OverallResults.query.filter_by(
            video_id=video_id).first()
        if overall_result:
            db.session.delete(overall_result)

        # Delete the video record from the database
        db.session.delete(video)

        # Commit the changes to the database
        db.session.commit()

        # Optionally, remove the video file from the server
        if os.path.exists(video.filepath):
            os.remove(video.filepath)

        return jsonify({"message": "Video, associated flags, and overall results deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"message": f"Error: {str(e)}"}), 500


@bp.route('/process_results', methods=['POST'])
@cross_origin()  # Enable CORS for this route only
def process_results():
    """API that processes each .h5 file in the videos directory using the main function."""

    for filename in os.listdir(UPLOAD_FOLDER):

        if filename.endswith('.h5'):
            print(filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            main(file_path)

    # Always returns 201 to avoid database conflicts
    return jsonify({
        "message": "Model results processed successfully!"
    }), 201


@bp.route('/get_results', methods=['GET'])
@cross_origin()  # Enable CORS for this route only
def get_results():
    """Fetch all records from the Results table and return as JSON"""
    try:
        results = Results.query.all()  # Fetch all entries from the database
        # Convert results to a list of dictionaries
        results_list = [
            {
                "video_id": r.video_id,
                "time": r.time,
                "classification": r.classification,
                "source": r.source,
                "duration": r.duration
            }
            for r in results
        ]

        # Return JSON response with HTTP 200 status
        return jsonify(results_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Handle errors gracefully


@bp.route('/get_all_results', methods=['GET'])
@cross_origin()  # Enable CORS for this route only
def get_all_results():
    """Fetch all records from the Results table and return as JSON"""
    try:
        results = OverallResults.query.all()  # Fetch all entries from the database

        # Convert results to a list of dictionaries
        results_list = [
            {
                "video_id": r.video_id,
                "scratch_instances": r.scratch_instances,
                "duration_seconds": r.duration_seconds,
            }
            for r in results
        ]

        # Return JSON response with HTTP 200 status
        return jsonify(results_list), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500  # Handle errors gracefully


@bp.route('/get_videos', methods=['GET'])
@cross_origin()  # Enable CORS for this route only
def get_videos():
    """Fetches list of video names and paths from the database."""

    # Fetch videos from the database (Assuming Video model exists)
    videos_in_db = Video.query.all()

    # Format response
    videos = [{'video_id': video.id, 'name': video.name, 'path': video.filepath, 'original_name': video.original_file_name}
              for video in videos_in_db]

    return jsonify({'videos': videos})


@bp.route("/set_flag", methods=["POST"])
@cross_origin()  # Enable CORS for this route only
def set_flag():
    data = request.json
    video_id = data.get("video_id")
    time = data.get("time")
    duration = data.get("duration", 0)  # Default to 0 if not provided
    sequence = data.get("sequence")
    classification = data.get("classification")
    source = data.get("source")

    if video_id is None or time is None:
        return jsonify({"error": "Missing required fields"}), 400

    try:
        # Add the new flag
        new_flag = Results(video_id=video_id, time=time,
                           classification=classification, source=source, duration=duration, sequence=sequence)
        db.session.add(new_flag)

        # Update the overall results for this video
        overall_result = OverallResults.query.filter_by(
            video_id=video_id).first()
        if overall_result:
            # Update count and duration
            if classification == "truePositive":
                overall_result.scratch_instances += 1
                overall_result.duration_seconds += duration if duration else 0
        else:
            # Create a new overall result record if it doesn't exist
            video = Video.query.get(video_id)
            if video:
                scratch_count = 1 if classification == "truePositive" else 0
                new_duration = duration if classification == "truePositive" and duration else 0
                new_overall = OverallResults(video_id=video_id,
                                             scratch_instances=scratch_count,
                                             duration_seconds=new_duration)
                db.session.add(new_overall)

        db.session.commit()
        return jsonify({"message": "Flag saved successfully and overall results updated"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route('/delete_flag/<int:flag_id>', methods=['DELETE'])
@cross_origin()  # Enable CORS for this route only
def delete_flag(flag_id):
    try:
        # Attempt to find the flag in the database
        flag = Results.query.get(flag_id)
        if not flag:
            return jsonify({"error": "Flag not found"}), 404

        # Get the video_id before deleting the flag
        video_id = flag.video_id

        # Delete the flag
        db.session.delete(flag)

        # Update the overall results for this video
        overall_result = OverallResults.query.filter_by(
            video_id=video_id).first()
        if overall_result:
            # Decrease the scratch count if the deleted flag was a true positive
            if flag.classification == "truePositive":
                if overall_result.scratch_instances > 0:
                    overall_result.scratch_instances -= 1

            # Decrease the duration if applicable
            if flag.duration and overall_result.duration_seconds >= flag.duration:
                overall_result.duration_seconds -= flag.duration

        # Commit all changes
        db.session.commit()

        return jsonify({"message": "Flag deleted successfully and overall results updated"}), 200
    except Exception as e:
        db.session.rollback()  # Rollback in case of errors
        return jsonify({"error": str(e)}), 500


@bp.route("/update_flag/<int:flag_id>", methods=["PATCH"])
@cross_origin()  # Enable CORS for this route only
def update_flag(flag_id):
    data = request.json
    classification = data.get("classification")
    duration = data.get("duration")  # Handle duration update if provided

    if classification is None:
        return jsonify({"error": "Missing classification field"}), 400

    try:
        flag = Results.query.get(flag_id)
        if flag is None:
            return jsonify({"error": "Flag not found"}), 404

        # Store old values before updating
        old_classification = flag.classification
        old_duration = flag.duration

        # Update flag fields
        flag.classification = classification
        if duration is not None:
            flag.duration = duration

        # Update overall results if classification or duration changed
        overall_result = OverallResults.query.filter_by(
            video_id=flag.video_id).first()
        if overall_result:
            # Handle classification change
            if old_classification != classification:
                # If changing from non-truePositive to truePositive
                if classification == "truePositive" and old_classification != "truePositive":
                    overall_result.scratch_instances += 1
                    overall_result.duration_seconds += flag.duration if flag.duration else 0

                # If changing from truePositive to something else
                elif old_classification == "truePositive" and classification != "truePositive":
                    if overall_result.scratch_instances > 0:
                        overall_result.scratch_instances -= 1
                    if old_duration and overall_result.duration_seconds >= old_duration:
                        overall_result.duration_seconds -= old_duration

            # Handle duration change when classification remains truePositive
            elif classification == "truePositive" and duration is not None and old_duration != duration:
                # Remove old duration and add new duration
                if old_duration and overall_result.duration_seconds >= old_duration:
                    overall_result.duration_seconds -= old_duration
                overall_result.duration_seconds += duration

        db.session.commit()
        return jsonify({"message": "Flag updated successfully and overall results updated"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500


@bp.route("/get_result/<int:video_id>", methods=["GET"])
@cross_origin()  # Enable CORS for this route only
def get_flags(video_id):
    results = Results.query.filter_by(video_id=video_id).all()
    return jsonify([{"id": results.id, "video_id": results.video_id, "time": results.time, "classification": results.classification, "source": results.source, "duration": results.duration} for results in results])


@bp.route('/videos/<filename>', methods=['GET'])
@cross_origin()  # Enable CORS for this route only
def serve_video(filename):
    """EXISTS AS A TEST DELETE LATER"""
    upload_folder = current_app.config['UPLOAD_FOLDER']
    video_path = os.path.join(upload_folder, filename)

    if not os.path.exists(video_path):
        return jsonify({'error': 'File not found'}), 404

    return send_file(video_path, mimetype='video/mp4', as_attachment=False)


@bp.route('/stream_video/<filename>', methods=['GET'])
@cross_origin()  # Enable CORS for this route only
def stream_video(filename):
    """Streams videos efficiently using Flask's send_file with range support"""
    file_path = os.path.join(UPLOAD_FOLDER, filename)

    # Check if file exists
    if not os.path.exists(file_path):
        current_app.logger.error(f"File {file_path} not found")
        return abort(404, description="File not found")

    # Get file size once
    file_size = os.path.getsize(file_path)
    current_app.logger.info(
        f"Serving file {filename} of size {file_size} bytes")

    # Handle Range requests for large videos (206 Partial Content)
    range_header = request.headers.get('Range', None)
    if range_header:
        try:
            # Parse the Range header
            byte1, byte2 = range_header.strip().replace('bytes=', '').split('-')
            byte1 = int(byte1)
            byte2 = int(byte2) if byte2 else file_size - 1

            # Ensure the byte range is within the file size
            if byte1 >= file_size:
                current_app.logger.error(
                    f"Requested range {byte1}-{byte2} exceeds file size {file_size}")
                return abort(416, description="Requested range not satisfiable")

            # Open the file and seek to the start of the range
            with open(file_path, 'rb') as f:
                f.seek(byte1)
                data = f.read(byte2 - byte1 + 1)

            # Create the response for partial content
            response = current_app.response_class(
                data,
                status=206,
                content_type='video/mp4',
                direct_passthrough=True
            )
            response.headers['Content-Range'] = f'bytes {byte1}-{byte2}/{file_size}'
            response.headers['Content-Length'] = str(len(data))
            response.headers['Accept-Ranges'] = 'bytes'
            return response
        except Exception as e:
            current_app.logger.error(f"Error handling range request: {str(e)}")
            return abort(500, description="Error handling range request")
    else:
        # If no range header, stream the full file
        current_app.logger.info(f"Sending full file {filename}")
        return send_file(
            file_path,
            mimetype='video/mp4',
            as_attachment=False,
            conditional=True,
            cache_timeout=0
        )


def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower(
           ) in current_app.config['ALLOWED_EXTENSIONS']


def get_next_video_id():
    """Get the next available video_id from the database. Return 0 if no videos exist."""
    last_video = Video.query.order_by(
        Video.id.desc()).first()  # Get the last inserted video
    return last_video.id + 1 if last_video else 1  # Return 0 if no videos exist
