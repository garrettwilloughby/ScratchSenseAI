import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';  
import DataPage from './pages/data-page';
import TrainingPage from './pages/training-page';
import UploadPage from './pages/upload-page';
import EvaluationMetrics from './pages/model-evaluation';
import SettingsPage from './pages/settings-page';
import HomePage from './pages/home-page';

function App() {
  return (
    <Router>
      <div>
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container-fluid">
            <a className="navbar-brand" href="/">
              Scratch Sense AI
            </a>
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarNav">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/upload">Upload</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/data">Data</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/training">Training</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/metrics">Metrics</Link>
                </li>
                <li className="nav-item">
                  <Link className="nav-link text-white" to="/settings">Settings</Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/data" element={<DataPage />} />
          <Route path="/upload" element={<UploadPage />} />
          <Route path="/training" element={<TrainingPage />} />
          <Route path="/metrics" element={<EvaluationMetrics />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
