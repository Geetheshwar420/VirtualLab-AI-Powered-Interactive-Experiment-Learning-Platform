import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function BulkUploadStudents({ user, onLogout }) {
  const [csvText, setCsvText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCsvText(event.target.result);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) {
      throw new Error('CSV must have header row and at least one data row');
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const nameIdx = headers.indexOf('name');
    const emailIdx = headers.indexOf('email');
    const passwordIdx = headers.indexOf('password');

    if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1) {
      throw new Error('CSV must have columns: name, email, password');
    }

    const students = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') continue;
      
      const values = lines[i].split(',').map(v => v.trim());
      students.push({
        name: values[nameIdx],
        email: values[emailIdx],
        password: values[passwordIdx]
      });
    }

    return students;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setResult(null);

    if (!csvText.trim()) {
      setError('Please paste CSV data or upload a file');
      return;
    }

    try {
      const students = parseCSV(csvText);
      
      if (students.length === 0) {
        setError('No valid student records found');
        return;
      }

      setLoading(true);
      const response = await axios.post(
        '/api/bulk-upload/students',
        { students, filename: 'bulk_upload.csv' },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      setResult(response.data);
      setSuccess(`Successfully uploaded ${response.data.successful} students!`);
      setCsvText('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  const downloadTemplate = () => {
    const template = 'name,email,password\nJohn Doe,john@example.com,Password123!\nJane Smith,jane@example.com,Password456!';
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(template));
    element.setAttribute('download', 'student_template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div>
      <div className="header">
        <div>
          <h1>📤 Bulk Upload Students</h1>
          <p>Add multiple students at once via CSV</p>
        </div>
        <div className="nav-buttons">
          <button onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '800px' }}>
        <div className="card">
          <h2>📋 CSV Format</h2>
          <p style={{ color: '#666', marginBottom: '15px' }}>
            Your CSV file must have three columns: <strong>name</strong>, <strong>email</strong>, <strong>password</strong>
          </p>
          <p style={{ background: '#f0f0f0', padding: '10px', borderRadius: '6px', fontFamily: 'monospace', fontSize: '13px', marginBottom: '15px' }}>
            name,email,password<br/>
            John Doe,john@example.com,Password123!<br/>
            Jane Smith,jane@example.com,Password456!
          </p>
          <button onClick={downloadTemplate} style={{ background: '#3498db' }}>
            ⬇️ Download Template
          </button>
        </div>

        <div className="card">
          <h2>📤 Upload Students</h2>
          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Upload CSV File</label>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                style={{ padding: '10px', border: '1px solid #ddd', borderRadius: '6px' }}
              />
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0', color: '#999' }}>
              OR
            </div>

            <div className="form-group">
              <label>Paste CSV Data</label>
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Paste your CSV data here..."
                rows="8"
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
              />
            </div>

            <button type="submit" disabled={loading} style={{ width: '100%' }}>
              {loading ? 'Processing...' : '📤 Upload Students'}
            </button>
          </form>

          {result && (
            <div style={{ marginTop: '30px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
              <h3 style={{ marginBottom: '15px' }}>📊 Upload Results</h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{
                  background: '#e8f5e9',
                  padding: '15px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>
                    {result.successful}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                    Successful
                  </div>
                </div>

                <div style={{
                  background: '#fff3e0',
                  padding: '15px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>
                    {result.total}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                    Total
                  </div>
                </div>

                <div style={{
                  background: '#ffebee',
                  padding: '15px',
                  borderRadius: '6px',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#e74c3c' }}>
                    {result.failed}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                    Failed
                  </div>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '10px', color: '#e74c3c' }}>⚠️ Errors</h4>
                  <div style={{
                    background: '#ffebee',
                    padding: '15px',
                    borderRadius: '6px',
                    maxHeight: '200px',
                    overflowY: 'auto'
                  }}>
                    {result.errors.map((err, idx) => (
                      <div key={idx} style={{ fontSize: '13px', color: '#c33', marginBottom: '8px' }}>
                        • {err}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BulkUploadStudents;
