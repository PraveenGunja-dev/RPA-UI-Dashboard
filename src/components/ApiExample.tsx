import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Example component showing how to access API endpoints
const ApiExample: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Example function to increment visit count
  const incrementVisitCount = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Correct endpoint for incrementing visit count
      const response = await axios.post('/visits/increment');
      setData(response.data);
    } catch (err) {
      setError('Failed to increment visit count');
      console.error('Error incrementing visit count:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example function to fetch visit count
  const fetchVisitCount = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Correct endpoint for fetching visit count
      const response = await axios.get('/visits/count');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch visit count');
      console.error('Error fetching visit count:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example function to fetch BSE alerts
  const fetchBseAlerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Correct endpoint for BSE alerts
      const response = await axios.get('/bse-alerts');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch BSE alerts');
      console.error('Error fetching BSE alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example function to fetch SEBI analysis data
  const fetchSebiAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Correct endpoint for SEBI analysis data
      const response = await axios.get('/sebi-analysis-data');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch SEBI analysis data');
      console.error('Error fetching SEBI analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Example function to fetch RBI analysis data
  const fetchRbiAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Correct endpoint for RBI analysis data
      const response = await axios.get('/rbi-analysis-data');
      setData(response.data);
    } catch (err) {
      setError('Failed to fetch RBI analysis data');
      console.error('Error fetching RBI analysis data:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">API Example</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <button 
          onClick={incrementVisitCount}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition-colors"
          disabled={loading}
        >
          Increment Visit Count
        </button>
        
        <button 
          onClick={fetchVisitCount}
          className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-4 rounded transition-colors"
          disabled={loading}
        >
          Fetch Visit Count
        </button>
        
        <button 
          onClick={fetchBseAlerts}
          className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded transition-colors"
          disabled={loading}
        >
          Fetch BSE Alerts
        </button>
        
        <button 
          onClick={fetchSebiAnalysis}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-4 rounded transition-colors"
          disabled={loading}
        >
          Fetch SEBI Analysis
        </button>
        
        <button 
          onClick={fetchRbiAnalysis}
          className="bg-pink-500 hover:bg-pink-600 text-white font-bold py-3 px-4 rounded transition-colors"
          disabled={loading}
        >
          Fetch RBI Analysis
        </button>
      </div>

      {loading && <p className="text-center py-4">Loading...</p>}
      
      {error && <p className="text-red-500 bg-red-50 p-4 rounded mb-4">{error}</p>}
      
      {data && (
        <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <h3 className="font-bold text-lg mb-3 text-gray-800">Response Data:</h3>
          <pre className="bg-gray-50 p-4 rounded overflow-auto max-h-80 text-sm">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-bold text-lg mb-3 text-blue-800">How API Calls Work:</h3>
        <ul className="list-disc pl-5 space-y-3 text-gray-700">
          <li>
            <strong>Direct endpoints:</strong> Requests to <code className="bg-gray-100 px-1 rounded">/bse-alerts</code>, <code className="bg-gray-100 px-1 rounded">/sebi-analysis-data</code>, <code className="bg-gray-100 px-1 rounded">/rbi-analysis-data</code>, <code className="bg-gray-100 px-1 rounded">/visits/count</code>, <code className="bg-gray-100 px-1 rounded">/visits/increment</code> 
            are handled directly by the FastAPI backend
          </li>
          <li>
            <strong>No CORS issues:</strong> Since all requests go through the same server, there are no CORS restrictions
          </li>
          <li>
            <strong>Error handling:</strong> If you see HTML responses instead of JSON, it usually means:
            <ul className="list-circle pl-6 mt-2 space-y-1">
              <li>The endpoint doesn't exist on the backend</li>
              <li>There's a server error returning an HTML error page</li>
            </ul>
          </li>
          <li>
            <strong>Production ready:</strong> The same code works in development and production environments
          </li>
        </ul>
      </div>

      <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-bold text-lg mb-3 text-yellow-800">Troubleshooting Tips:</h3>
        <ul className="list-disc pl-5 space-y-2 text-gray-700">
          <li>Make sure your FastAPI backend is running</li>
          <li>Check that the endpoints exist in your backend code</li>
          <li>Check browser developer tools Network tab to see the actual requests and responses</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiExample;