import os

"""To store all important paths for backend."""
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'ScratchSense', 'videos')
CONFIG_PATH = os.path.join(BASE_DIR, 'ScratchSense', 'config.yaml')
