import { useState, useEffect } from 'react';
import { apiRequest } from '../utils/apiUtils';
import DataTable from '../components/datatable';
import Tooltip from '../components/toolTip';

const DataPage = () => {
  const [showFirstTable, setShowFirstTable] = useState(true); // State to toggle between tables
  const [results, setResults] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1); // Lifted state for pagination

  // Headers for the tables
  const headers1 = ['Video ID', '# of Scratches', 'Duration (seconds)'];
  const headers2 = ['Video ID',"Time","Duration","Classification",'Type'];
 
  // Fetch results on component mount
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const data = await apiRequest('/get_results', 'GET'); // Fetch results from API
        setResults(data);
      } catch (err) {
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    const fetchAllResults = async () => {
      try {
        const data = await apiRequest('/get_all_results', 'GET'); // Fetch results from API
        setAllResults(data);
      } catch (err) {
        setError('Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    const fetchFlags = async () => {
      try {
        const response = await fetch(`http://localhost:8080/get_results`);
        const data = await response.json();
        setFlags(data);
        console.log("all_flags", data);
      } catch (error) {
        console.error("Error fetching flags:", error);
      }
    };

    fetchResults();
    fetchAllResults();
    fetchFlags();
  }, []);

  // Transform API data to match headers2 format
  const formattedResults = results.map((item) => ({
    'Video ID': item.video_id,
    Time: item.time, // Assuming `label` stores timestamp
    Classification: item.classification,
    Type: item.source, // Use duration as is
    Duration: item.duration
  }));

  const formattedAllResults = allResults.map((item) => ({
    'Video ID': item.video_id,
    '# of Scratches': item.scratch_instances, // Assuming `label` stores timestamp
    'Duration (seconds)': item.duration_seconds,
   
  }));

  const handleToggleTable = () => {
    setShowFirstTable(!showFirstTable);
    setCurrentPage(1); // Reset pagination to first page
  };

  //console.log("formatted results", formattedResults);

  return (
    <div className="container mt-5">
      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center justify-content-between mb-3">
            <div className='d-flex'>
              <h5 className="card-title me-2 fw-bold">Toggle Tables</h5>
                
              <Tooltip 
                className="mx-5" 
                position="right"
                text="This page will display data from each video, as well as an overview of all the data. By using the switch on top right side of the table, users can switch between data tables.
                
                The bottom right corner features an export to csv button that allows users to export the current data table to a CSV.">
              </Tooltip>

            </div>
            <div className="form-check form-switch d-flex align-items-center gap-2 mx-3" style={{ minWidth: '200px' }}>
              <label
                className="form-check-label mx-5"
                htmlFor="toggleSwitch"
                style={{ minWidth: '120px', textAlign: 'right' }} // Prevents label from resizing
              >
                {showFirstTable ? 'Videos Overview' : 'Video'}
              </label>
              <input
                type="checkbox"
                className="form-check-input"
                id="toggleSwitch"
                checked={!showFirstTable}
                onChange={handleToggleTable}
              />
            </div>
          </div>
          {loading ? (
            <p>Loading...</p>
          ) : error ? (
            <p>{error}</p>
          ) : showFirstTable ? (
            // if Model is selected then show model data
            // if flag then show flag data
            // if both, the combine data on video_id
            <DataTable headers={headers1} data={formattedAllResults} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          ) : (
            <DataTable headers={headers2} data={formattedResults} currentPage={currentPage} setCurrentPage={setCurrentPage} />
          )}
        </div>
      </div>
    </div>
  );
};

export default DataPage;
