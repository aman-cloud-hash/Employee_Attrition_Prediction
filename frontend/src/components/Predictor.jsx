import React, { useState } from 'react';
import { RefreshCw, Clipboard, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Predictor() {
  const [formData, setFormData] = useState({
    Age: '',
    MonthlyIncome: '',
    DistanceFromHome: '',
    YearsAtCompany: '',
    JobSatisfaction: '',
    OverTime: '',
    JobRole: '',
    MaritalStatus: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [fetchError, setFetchError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field-specific error
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const age = parseInt(formData.Age);
    const income = parseFloat(formData.MonthlyIncome);
    const distance = parseFloat(formData.DistanceFromHome);
    const years = parseFloat(formData.YearsAtCompany);

    // Age
    if (!formData.Age) nextErrors.Age = 'Age is required.';
    else if (isNaN(age) || age < 18 || age > 100) nextErrors.Age = 'Age must be between 18 and 100.';

    // Monthly Income
    if (!formData.MonthlyIncome) nextErrors.MonthlyIncome = 'Income is required.';
    else if (isNaN(income) || income < 10000 || income > 1000000) nextErrors.MonthlyIncome = 'Income must be between ₹10,000 and ₹1,000,000.';

    // Distance From Home
    if (!formData.DistanceFromHome) nextErrors.DistanceFromHome = 'Distance is required.';
    else if (isNaN(distance) || distance < 1 || distance > 100) nextErrors.DistanceFromHome = 'Distance must be between 1 and 100 km.';

    // Years At Company
    if (!formData.YearsAtCompany) nextErrors.YearsAtCompany = 'Years at company is required.';
    else if (isNaN(years) || years < 0 || years > 50) nextErrors.YearsAtCompany = 'Years must be between 0 and 50.';
    else if (!isNaN(age) && years > (age - 18)) {
      nextErrors.YearsAtCompany = `Years at company cannot exceed productive years (${Math.max(0, age - 18)} years).`;
    }

    // Dropdowns
    if (!formData.JobSatisfaction) nextErrors.JobSatisfaction = 'Satisfaction level is required.';
    if (!formData.OverTime) nextErrors.OverTime = 'Overtime requirement is required.';
    if (!formData.JobRole) nextErrors.JobRole = 'Job role is required.';
    if (!formData.MaritalStatus) nextErrors.MaritalStatus = 'Marital status is required.';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setResult(null);
    setFetchError(null);

    // Target API URL (dynamic production URL or fallback to proxy config)
    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const apiUrl = `${apiBaseUrl}/api/predict`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        if (data.errors) {
          const apiErrors = {};
          data.errors.forEach(err => {
            if (err.includes('Age')) apiErrors.Age = err;
            else if (err.includes('Income')) apiErrors.MonthlyIncome = err;
            else if (err.includes('Distance')) apiErrors.DistanceFromHome = err;
            else if (err.includes('Years')) apiErrors.YearsAtCompany = err;
            else if (err.includes('Satisfaction')) apiErrors.JobSatisfaction = err;
            else if (err.includes('OverTime')) apiErrors.OverTime = err;
            else if (err.includes('Role')) apiErrors.JobRole = err;
            else if (err.includes('Marital')) apiErrors.MaritalStatus = err;
          });
          setErrors(apiErrors);
        }
        setFetchError(data.message || 'Prediction failed. Check inputs.');
      }
    } catch (err) {
      console.error('API Error:', err);
      // Failover directly to host address if proxy isn't active
      if (!apiBaseUrl) {
        try {
          const directResponse = await fetch('http://127.0.0.1:5000/api/predict', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const directData = await directResponse.json();
          if (directData.success) {
            setResult(directData);
            setLoading(false);
            return;
          }
        } catch (directErr) {
          console.error('Direct fallback failed:', directErr);
        }
      }
      setFetchError('Connection Failure: Unable to reach prediction server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      Age: '',
      MonthlyIncome: '',
      DistanceFromHome: '',
      YearsAtCompany: '',
      JobSatisfaction: '',
      OverTime: '',
      JobRole: '',
      MaritalStatus: ''
    });
    setErrors({});
    setResult(null);
    setFetchError(null);
  };

  return (
    <div className="predictor-wrapper">
      <div className="page-header">
        <h1>Predict Employee Attrition Risk</h1>
        <p className="subtitle">Complete the fields below to calculate retention probability based on employee characteristics.</p>
      </div>

      <div className="prediction-container">
        {/* Input Form Column */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="prediction-card form-column"
        >
          <div className="card-header">
            <h2>Employee Parameters</h2>
            <p className="card-subtitle">Ensure all figures match official HR records.</p>
          </div>

          <form onSubmit={handleSubmit} novalidate>
            <div className="form-grid">
              {/* Age */}
              <div className="form-group">
                <label htmlFor="Age">Age</label>
                <input
                  type="number"
                  id="Age"
                  name="Age"
                  value={formData.Age}
                  onChange={handleInputChange}
                  placeholder="e.g., 34"
                  className={errors.Age ? 'invalid' : ''}
                />
                <span className="error-msg">{errors.Age}</span>
              </div>

              {/* Monthly Income */}
              <div className="form-group">
                <label htmlFor="MonthlyIncome">Monthly Income (₹)</label>
                <input
                  type="number"
                  id="MonthlyIncome"
                  name="MonthlyIncome"
                  value={formData.MonthlyIncome}
                  onChange={handleInputChange}
                  placeholder="e.g., 50000"
                  className={errors.MonthlyIncome ? 'invalid' : ''}
                />
                <span className="error-msg">{errors.MonthlyIncome}</span>
              </div>

              {/* Distance From Home */}
              <div className="form-group">
                <label htmlFor="DistanceFromHome">Distance From Home (km)</label>
                <input
                  type="number"
                  id="DistanceFromHome"
                  name="DistanceFromHome"
                  value={formData.DistanceFromHome}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  className={errors.DistanceFromHome ? 'invalid' : ''}
                />
                <span className="error-msg">{errors.DistanceFromHome}</span>
              </div>

              {/* Years At Company */}
              <div className="form-group">
                <label htmlFor="YearsAtCompany">Years At Company</label>
                <input
                  type="number"
                  id="YearsAtCompany"
                  name="YearsAtCompany"
                  value={formData.YearsAtCompany}
                  onChange={handleInputChange}
                  placeholder="e.g., 4"
                  className={errors.YearsAtCompany ? 'invalid' : ''}
                />
                <span className="error-msg">{errors.YearsAtCompany}</span>
              </div>

              {/* Job Satisfaction */}
              <div className="form-group">
                <label htmlFor="JobSatisfaction">Job Satisfaction Level</label>
                <select
                  id="JobSatisfaction"
                  name="JobSatisfaction"
                  value={formData.JobSatisfaction}
                  onChange={handleInputChange}
                  className={errors.JobSatisfaction ? 'invalid' : ''}
                >
                  <option value="" disabled>Select Level</option>
                  <option value="1">1 - Low Satisfaction</option>
                  <option value="2">2 - Medium Satisfaction</option>
                  <option value="3">3 - High Satisfaction</option>
                  <option value="4">4 - Very High Satisfaction</option>
                </select>
                <span className="error-msg">{errors.JobSatisfaction}</span>
              </div>

              {/* OverTime */}
              <div className="form-group">
                <label htmlFor="OverTime">Overtime Requirement</label>
                <select
                  id="OverTime"
                  name="OverTime"
                  value={formData.OverTime}
                  onChange={handleInputChange}
                  className={errors.OverTime ? 'invalid' : ''}
                >
                  <option value="" disabled>Select Requirement</option>
                  <option value="Yes">Yes (Regular Overtime)</option>
                  <option value="No">No (Standard Hours)</option>
                </select>
                <span className="error-msg">{errors.OverTime}</span>
              </div>

              {/* Job Role */}
              <div className="form-group full-width">
                <label htmlFor="JobRole">Job Role</label>
                <select
                  id="JobRole"
                  name="JobRole"
                  value={formData.JobRole}
                  onChange={handleInputChange}
                  className={errors.JobRole ? 'invalid' : ''}
                >
                  <option value="" disabled>Select Corporate Role</option>
                  <option value="Sales Executive">Sales Executive</option>
                  <option value="Research Scientist">Research Scientist</option>
                  <option value="Laboratory Technician">Laboratory Technician</option>
                  <option value="Manufacturing Director">Manufacturing Director</option>
                  <option value="Healthcare Representative">Healthcare Representative</option>
                  <option value="Manager">Manager</option>
                  <option value="Sales Representative">Sales Representative</option>
                  <option value="Research Director">Research Director</option>
                  <option value="Human Resources">Human Resources</option>
                </select>
                <span className="error-msg">{errors.JobRole}</span>
              </div>

              {/* Marital Status */}
              <div className="form-group full-width">
                <label htmlFor="MaritalStatus">Marital Status</label>
                <select
                  id="MaritalStatus"
                  name="MaritalStatus"
                  value={formData.MaritalStatus}
                  onChange={handleInputChange}
                  className={errors.MaritalStatus ? 'invalid' : ''}
                >
                  <option value="" disabled>Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                </select>
                <span className="error-msg">{errors.MaritalStatus}</span>
              </div>
            </div>

            <motion.button 
              type="submit" 
              className="btn btn-primary btn-block submit-btn"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {!loading ? (
                <span>Evaluate Attrition Risk</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.50rem' }}>
                  <div className="spinner" />
                  <span>Processing...</span>
                </div>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Results Column */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="prediction-card result-column"
        >
          <div className="card-header">
            <h2>Evaluation Report</h2>
            <p className="card-subtitle">Prediction results based on the trained classifier.</p>
          </div>

          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="skeleton-loader"
              >
                <div className="skeleton-block" />
                <div className="skeleton-text long" />
                <div className="skeleton-text medium" />
                <div className="skeleton-text short" />
              </motion.div>
            )}

            {!loading && fetchError && (
              <motion.div
                key="error"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="result-placeholder"
              >
                <div className="placeholder-icon" style={{ color: 'var(--color-danger-accent)' }}>⚠️</div>
                <p className="placeholder-title">Evaluation Failed</p>
                <p className="placeholder-desc">{fetchError}</p>
              </motion.div>
            )}

            {!loading && !result && !fetchError && (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="result-placeholder"
              >
                <div className="placeholder-icon">Clipboard</div>
                <p className="placeholder-title">Awaiting Evaluation</p>
                <p className="placeholder-desc">Fill out the employee metrics in the form and submit to generate a retention report.</p>
              </motion.div>
            )}

            {!loading && result && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 150 }}
                className="result-content"
              >
                {/* Result banner */}
                <div className={`result-banner ${result.risk_level === 'High' ? 'high-risk' : 'low-risk'}`}>
                  <span className="result-title">{result.result}</span>
                </div>

                {/* Risk score */}
                <div className="probability-section">
                  <div className="prob-header">
                    <span>Attrition Risk Score</span>
                    <span className="prob-percent">{result.probability}%</span>
                  </div>
                  <div className="prob-bar-container">
                    <motion.div
                      className={`prob-bar ${result.risk_level === 'High' ? 'danger' : 'success'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${result.probability}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="prob-desc">Indicates the statistical likelihood of this employee resigning.</p>
                </div>

                {/* System recommendation */}
                <div className="recommendation-section">
                  <h3>System Recommendation</h3>
                  <p className="recommendation-text">{result.message}</p>
                </div>

                {/* Metadata */}
                <div className="meta-section">
                  <div className="meta-row">
                    <span className="meta-label">Evaluation Engine:</span>
                    <span class="meta-val">Logistic Regression (47-col scaled)</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Validation Status:</span>
                    <span className="meta-val text-green" style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <CheckCircle size={12} />
                      Verified
                    </span>
                  </div>
                </div>

                <motion.button
                  onClick={handleReset}
                  className="btn btn-secondary btn-block"
                  whileTap={{ scale: 0.98 }}
                  style={{ marginTop: '0.5rem' }}
                >
                  <RefreshCw size={14} />
                  Clear Report & Reset
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
