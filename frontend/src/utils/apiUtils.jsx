// apiUtils.jsx

/**
 * ABOUT THIS FUNCTION!!
 * 
 * @param {string} endpoint - The API endpoint to call (e.g., '/api/results')
 * @param {string} method - The HTTP method (GET, POST, PUT, DELETE)
 * @param {object} [data=null] - The request body for POST/PUT requests (optional)
 * @param {object} [headers={}] - Optional headers for the request (optional)
 * @returns {Promise<object>} - The response data
 */
export const apiRequest = async (endpoint, method = 'GET', data = null, headers = {}) => {
    const API_BASE_URL = 'http://localhost:8080';
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json',  // Ensure JSON content type
            ...headers,  // Merge any additional headers
        },
        body: data ? JSON.stringify(data) : null,  // Convert JS object to JSON string
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        console.error('API Request Error:', error);
        throw new Error(error.message || 'An error occurred');
    }
};
