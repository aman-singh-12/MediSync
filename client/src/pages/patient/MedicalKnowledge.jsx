import React, { useState } from 'react';
import axios from 'axios';

const MedicalKnowledge = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setAnswer('');
    setSources([]);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/rag/query`, 
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAnswer(response.data.answer);
      setSources(response.data.sources || []);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch answer. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Medical Knowledge Assistant</h1>
      <p className="text-gray-600 mb-6">Ask questions about our clinic policies, medical preparations, or general FAQs.</p>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. What should I know before a fasting blood test?"
            className="flex-1 border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Asking...' : 'Ask'}
          </button>
        </div>
      </form>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-6">
          {error}
        </div>
      )}

      {answer && (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-3">Answer:</h2>
          <div className="text-gray-800 whitespace-pre-wrap mb-4">{answer}</div>
          
          {sources.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Sources:</h3>
              <ul className="list-disc list-inside text-sm text-gray-600">
                {sources.map((source, idx) => (
                  <li key={idx}>{source}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MedicalKnowledge;
