Getting Started:

navigate to /backend
conda create -n deeplabcut-env python=3.10.8 -y
conda activate deeplabcut-env
conda install -c conda-forge deeplabcut
pip install -r requirements.txt
python run.py

APIs to build:

/upload - upload videos (POST)
/get - get data from model (GET)
