import React, { useState } from 'react';
import ExportCSVButton from '../utils/convertToCSV';

const DataTable = ({ headers = [], data = [], currentPage, setCurrentPage }) => {
  const [filters, setFilters] = useState(
    headers.reduce((acc, header) => {
      acc[header] = '';
      return acc;
    }, {})
  );
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const [suggestions, setSuggestions] = useState({});

  const rowsPerPage = 11;

  const timeHeaders = ['Duration', 'Time', 'PlaybackTime']; // Add any header you want formatted as mm:ss

  const formatTime = (totalSeconds) => {
    if (isNaN(totalSeconds) || totalSeconds == null) return '';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handlePageClick = (page) => {
    if (page >= 1 && page <= Math.ceil(data.length / rowsPerPage)) {
      setCurrentPage(page);
    }
  };

  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;

  const filteredData = data.filter((row) => {
    return headers.every((header) => {
      const filterValue = filters[header]?.toLowerCase() ?? '';
      const cellValue = row[header]?.toString().toLowerCase() ?? '';
      return filterValue === '' || cellValue.includes(filterValue);
    });
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (sortConfig.key === null) return 0;
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const currentData = sortedData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / rowsPerPage);

  const handleFilterChange = (e, header) => {
    const value = e.target.value;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [header]: value,
    }));

    const filteredSuggestions = Array.from(
      new Set(
        data
          .map((row) => row[header])
          .filter((val) => val !== null && val !== undefined)
          .map((val) => val.toString())
          .filter((val) => val.includes(value))
          .slice(0, 5)
      )
    );

    setSuggestions((prevSuggestions) => ({
      ...prevSuggestions,
      [header]: filteredSuggestions,
    }));
  };

  const handleSortClick = (header) => {
    let direction = 'asc';
    if (sortConfig.key === header && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({
      key: header,
      direction,
    });
  };

  const filledData = [
    ...currentData,
    ...Array(rowsPerPage - currentData.length).fill(null),
  ];

  const maxPageButtons = 10;
  const pageStart = Math.max(currentPage - Math.floor(maxPageButtons / 2), 1);
  const pageEnd = Math.min(pageStart + maxPageButtons - 1, totalPages);

  return (
    <div className="card-body">
      <table className="table table-bordered table-striped mt-1" style={{ height: '400px' }}>
        <thead className="thead-dark">
          <tr>
            {headers.map((header, index) => (
              <th key={index}>
                {header}
                <div className="d-flex align-items-center">
                  <input
                    type="text"
                    value={filters[header] || ''}
                    onChange={(e) => handleFilterChange(e, header)}
                    className="form-control form-control-sm"
                    placeholder={`Filter ${header}`}
                  />
                  <button
                    onClick={() => handleSortClick(header)}
                    className="btn btn-sm ms-2"
                    style={{
                      borderRadius: '50%',
                      padding: '0.5rem',
                      minWidth: '30px',
                      minHeight: '30px',
                    }}
                  >
                    {sortConfig.key === header && sortConfig.direction === 'asc' ? (
                      <span>&uarr;</span>
                    ) : (
                      <span>&darr;</span>
                    )}
                  </button>
                </div>
                {filters[header] && suggestions[header] && suggestions[header].length > 0 && (
                  <ul className="list-group position-absolute" style={{ zIndex: 999 }}>
                    {suggestions[header].map((suggestion, idx) => (
                      <li
                        key={idx}
                        className="list-group-item list-group-item-action"
                        onClick={() => {
                          setFilters((prevFilters) => ({
                            ...prevFilters,
                            [header]: suggestion,
                          }));
                          setSuggestions((prevSuggestions) => ({
                            ...prevSuggestions,
                            [header]: [],
                          }));
                        }}
                      >
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filledData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row ? (
                headers.map((header, colIndex) => (
                  <td key={colIndex} title={row[header]}>
                    {timeHeaders.includes(header)
                      ? formatTime(row[header])
                      : row[header]}
                  </td>
                ))
              ) : (
                <td colSpan={headers.length}>&nbsp;</td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-2 d-flex align-items-center">
        <div className="d-flex justify-content-center flex-grow-1">
          <button
            onClick={() => handlePageClick(currentPage - 1)}
            className="btn btn-sm btn-outline-secondary me-2"
            disabled={currentPage === 1}
          >
            &laquo; Previous
          </button>
          {Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageClick(pageStart + i)}
              className={`btn btn-sm me-1 ${
                currentPage === pageStart + i ? 'btn-secondary' : 'btn-outline-secondary'
              }`}
              style={{ minWidth: '45px', maxWidth: '45px' }}
            >
              {pageStart + i}
            </button>
          ))}
          <button
            onClick={() => handlePageClick(currentPage + 1)}
            className="btn btn-sm btn-outline-secondary ms-2"
            disabled={currentPage === totalPages}
          >
            Next &raquo;
          </button>
        </div>
        <div className="ms-auto">
          <ExportCSVButton data={data} filename="datatable_export.csv" />
        </div>
      </div>
    </div>
  );
};

export default DataTable;
