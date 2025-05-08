import React from 'react';

const ExportCSVButton = ({ data, filename = 'data.csv' }) => {
  // This function converts the data table (an array of objects) into CSV format.
  const convertToCSV = (data) => {
    if (!data || !data.length) {
      return '';
    }

    // Extract the headers (assumes each object has the same keys)
    const headers = Object.keys(data[0]);
    const csvRows = [];

    // Create the header row
    csvRows.push(headers.join(','));

    // Loop over each row of data
    data.forEach(row => {
      const values = headers.map(header => {
        let cell = row[header];

        // Handle null or undefined values
        if (cell === null || cell === undefined) {
          cell = '';
        } else {
          cell = cell.toString();
        }

        // Escape double quotes in the cell value
        cell = cell.replace(/"/g, '""');

        // If the cell contains a comma, newline, or double quote, wrap it in double quotes
        if (cell.search(/("|,|\n)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      });
      csvRows.push(values.join(','));
    });

    // Join all rows with newlines
    return csvRows.join('\n');
  };

  // This function creates a downloadable CSV file and simulates a click on an anchor element.
  const downloadCSV = () => {
    const csvData = convertToCSV(data);
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    
    // Append the link, trigger the download, and then remove the link
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      className="dft-btn"
      onClick={downloadCSV}>
      Export to CSV
  </button>

  );
};

export default ExportCSVButton;
