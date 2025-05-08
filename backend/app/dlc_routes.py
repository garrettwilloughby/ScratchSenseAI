import os
import subprocess
from flask import Blueprint, request, jsonify
from flask_cors import cross_origin
from .utils.file_helpers import commit_results, commit_videos
from config import UPLOAD_FOLDER, CONFIG_PATH
from app.algorithm import main
import deeplabcut
import traceback
from pathlib import Path

dlc_bp = Blueprint('deeplabcut', __name__)


@dlc_bp.route('/dlc')
def home():
    """A check to see if this blue print works."""
    return '<p>Hello, Deeplabcut!</p>'


@dlc_bp.route("/create_training_dataset", methods=["POST"])
@cross_origin()  # Enable CORS for this route only
def create_training_dataset():
    try:
        print("Creating training dataset...")
        deeplabcut.create_training_dataset(
            CONFIG_PATH, net_type='resnet_50', augmenter_type='imgaug')
        # Add this line
        print(f"Dataset should be saved in: {CONFIG_PATH}/training_dataset")
        return jsonify({"message": "Training dataset created successfully."}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error creating training dataset: {str(e)}"}), 500


@dlc_bp.route("/train_network", methods=["POST"])
@cross_origin()
def train_network():
    """Triggers DeepLabCut training and returns an immediate JSON response."""

    try:
        # Start training synchronously (blocking call)
        deeplabcut.train_network(
            CONFIG_PATH, shuffle=1, displayiters=10, saveiters=500, maxiters=200000
        )

        return jsonify({"status": "success", "message": "Training started successfully."})

    except Exception as e:
        traceback.print_exc()
        return jsonify({"status": "error", "message": str(e)}), 500


@dlc_bp.route("/evaluate_network", methods=["POST"])
@cross_origin()  # Enable CORS for this route only
def evaluate_network():
    """Evaluates the trained model and generates validation metrics."""
    try:
        print("Evaluating the network...")
        deeplabcut.evaluate_network(CONFIG_PATH, plotting=True)
        return jsonify({"message": "Evaluation completed successfully."}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error evaluating the network: {str(e)}"}), 500


@dlc_bp.route("/analyze", methods=["POST"])
@cross_origin()  # Enable CORS for this route only
def analyze_videos():
    """Analyzes a specific video using the trained model."""
    try:
        data = request.json
        video_type = data.get("video_type", "mp4")
        video = data.get("filename")

        if not UPLOAD_FOLDER or not os.path.exists(UPLOAD_FOLDER):
            return jsonify({"message": "Invalid video folder path"}), 400

        video_path = os.path.join(UPLOAD_FOLDER, video)
        if not os.path.exists(video_path):
            return jsonify({"message": "Specified video file does not exist."}), 400

        print(f"Analyzing video: {video_path}")

        # Extract a clean video ID (filename without extension)
        video_id = Path(video).stem
        print(f"Extracted video ID: {video_id}")

        # Run DeepLabCut analysis here
        deeplabcut.analyze_videos(
            CONFIG_PATH, [video_path], videotype=video_type)

        # Find matching .h5 files based on video ID
        h5_files = [f for f in os.listdir(UPLOAD_FOLDER)
                    if f.endswith(".h5") and f.startswith(video_id)]

        if not h5_files:
            return jsonify({"message": "No .h5 analysis files found."}), 400

        # Use creation time to get latest h5
        latest_h5 = max(
            [os.path.join(UPLOAD_FOLDER, f) for f in h5_files],
            key=os.path.getctime
        )

        print(f"Running post-analysis on: {latest_h5}")
        main(latest_h5)

        return jsonify({"message": "Video analysis completed successfully."}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error analyzing videos: {str(e)}"}), 500


@dlc_bp.route("/plot_trajectories", methods=["POST"])
@cross_origin()  # Enable CORS for this route only
def plot_trajectories():
    """Plots the movement trajectories of analyzed videos."""
    try:
        data = request.json
        if not data:
            return jsonify({"message": "No JSON payload provided."}), 400

        video_folder = UPLOAD_FOLDER
        video = data.get("filename")
        video_type = data.get("video_type", "mp4")

        if not video:
            return jsonify({"message": "No video filename provided."}), 400

        if not os.path.exists(video_folder):
            return jsonify({"message": "Invalid or missing video folder path."}), 400

        video_path = os.path.join(video_folder, video)
        if not os.path.exists(video_path):
            return jsonify({"message": f"Video file not found: {video}"}), 404

        print(f"[INFO] Plotting trajectories for: {video_path}")

        # Try plotting with error isolation
        try:
            deeplabcut.plot_trajectories(
                CONFIG_PATH, [video_path], videotype=video_type)
        except Exception as plot_err:
            print("[ERROR] DeepLabCut failed during plotting:")
            traceback.print_exc()
            return jsonify({"message": f"DeepLabCut plotting failed: {str(plot_err)}"}), 500

        return jsonify({"message": "Trajectory plotting completed successfully."}), 200

    except Exception as e:
        print("[ERROR] Unexpected server error during trajectory plotting:")
        traceback.print_exc()
        return jsonify({"message": f"Unexpected error: {str(e)}"}), 500


@dlc_bp.route("/create_labeled_video", methods=["POST"])
@cross_origin()  # Enable CORS for this route only
def create_labeled_video():
    """Generates labeled videos with detected keypoints overlaid for a specific video."""
    try:
        data = request.json
        video_type = data.get("video_type", "mp4")
        # This should be the original video's full path
        original_path = data.get("filename")

        if not original_path or not os.path.exists(original_path):
            return jsonify({"message": "Invalid or missing video file path."}), 400

        # Extract video number from filename (e.g., "5_video.mp4" → 5)
        original_filename = os.path.basename(original_path)
        video_id = original_filename.split("_")[0]

        # Define paths
        labeled_video_name = f"{video_id}_video_labeled.mp4"
        labeled_video_path = os.path.join(UPLOAD_FOLDER, labeled_video_name)

        # Generate labeled video using DLC
        print(f"Creating labeled video for: {original_path}")
        deeplabcut.create_labeled_video(
            CONFIG_PATH, [original_path], videotype=video_type)

        # DLC saves labeled video in same dir as original with '_labeled' suffix
        # So we grab that path first
        original_labeled_path = original_path.replace(".mp4", "_labeled.mp4")

        if not os.path.exists(original_labeled_path):
            return jsonify({"message": f"Labeled video not found at {original_labeled_path}"}), 500

        # Encode with FFmpeg to standardize format
        ffmpeg_command = [
            "ffmpeg", "-i", original_labeled_path,
            "-vcodec", "libx264", "-acodec", "aac", "-strict", "experimental",
            labeled_video_path
        ]
        subprocess.run(ffmpeg_command, check=True)

        os.remove(original_labeled_path)  # cleanup DLC's raw labeled video

        # Save info to DB
        data = [{
            "name": labeled_video_name,
            "filepath": labeled_video_path,
            "original_file_name": labeled_video_name
        }]
        commit_videos(data)

        return jsonify({"message": f"Labeled video created and saved as {labeled_video_path}"}), 200

    except subprocess.CalledProcessError as e:
        return jsonify({"message": f"FFmpeg Error: {str(e)}"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error creating labeled video: {str(e)}"}), 500


@dlc_bp.route("/extract_frames", methods=["POST"])
@cross_origin()
def extract_frames():
    """Extracts frames from a specific video for labeling."""
    try:
        data = request.json
        video = data.get("filename")  # Just the filename, no full path
        video_folder = UPLOAD_FOLDER

        if not video:
            return jsonify({"message": "Missing video filename."}), 400

        video_path = os.path.join(video_folder, video)

        if not os.path.exists(video_path):
            return jsonify({"message": f"Video not found at path: {video_path}"}), 400

        print(f"Extracting frames from: {video_path}...")

        # Call the DeepLabCut method with the correct positional and keyword arguments
        deeplabcut.extract_frames(
            CONFIG_PATH, [video_path])

        return jsonify({"message": "Frames extracted successfully."}), 200

    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error extracting frames: {str(e)}"}), 500


@dlc_bp.route("/label_frames", methods=["POST"])
@cross_origin()
def label_frames():
    """Opens the labeling GUI to manually annotate frames."""
    try:
        print("Opening labeling GUI...")
        deeplabcut.label_frames(CONFIG_PATH)

        return jsonify({"message": "Labeling GUI opened successfully."}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error opening labeling GUI: {str(e)}"}), 500


@dlc_bp.route("/check_labels", methods=["POST"])
@cross_origin()
def check_labels():
    """Checks labeled frames to verify annotations."""
    try:
        print("Checking labels...")
        deeplabcut.check_labels(CONFIG_PATH)

        return jsonify({"message": "Labels checked successfully."}), 200
    except Exception as e:
        traceback.print_exc()
        return jsonify({"message": f"Error checking labels: {str(e)}"}), 500
