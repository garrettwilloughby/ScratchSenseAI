# ScratchSenseAI

A tool for detecting and analyzing scratching behavior using AI and DeepLabCut.

## Getting Started

### Prerequisites

#### Required Downloads (Mac):
- [Anaconda (Miniconda)](https://www.anaconda.com/docs/getting-started/miniconda/install#macos-linux-installation)
- [Node.js and npm](https://nodejs.org/en/download/)
- [Python](https://www.python.org/downloads/)

## Mac:

1. Clone this repository `git clone https://github.com/garrettwilloughby/Senior-Design.git`
2. Install the ScratchSense model [Google Drive](https://drive.google.com/drive/folders/11jlGR6Ucsduge_vpA_GitBmvsnez-NZ3?usp=drive_link)
3. Place the ScratchSense Folder into the backend folder

### Frontend:

1. Navigate to /frontend `cd frontend`
2. Install dependencies for frontend `npm install`
3. Run the frontend `npm run start`

### Backend:

1. Navivate to /backend `cd backend`
2. Create virtual environment `conda create -n deeplabcut-env python=3.10.8 -y`
3. Activate virtual environment `conda activate deeplabcut-env`
4. Install deeplabcut `conda install -c conda-forge deeplabcut`
5. Install rest of requirements `pip install -r requirements.txt`
6. Run the backend `python run.py`
