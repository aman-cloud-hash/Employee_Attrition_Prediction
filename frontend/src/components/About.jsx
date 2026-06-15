import React from 'react';
import { Settings, Cpu, HardDrive } from 'lucide-react';
import { motion } from 'framer-motion';

export default function About() {
  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="about-container"
    >
      <section className="about-section">
        <h1>About the Employee Attrition Prediction Project</h1>
        <p className="lead">
          This predictive system is designed as an internal HR decision support tool. It uses historical workforce metrics to identify attrition trends and flags individuals who may be at risk of leaving the company.
        </p>
      </section>

      <div className="about-grid">
        <div className="about-card main-info">
          <h2>The Machine Learning Model</h2>
          <p>
            The prediction backend is powered by a <strong>Logistic Regression</strong> classifier. This algorithm was selected for its high interpretability, computational efficiency, and robust performance on binary classification tasks.
          </p>
          <p>
            During training, the model correlates various employee attributes (demographics, job roles, salary levels, satisfaction scores) with historical exit cases. It calculates weights (coefficients) for each feature. The prediction outputs are probability scores mapped between 0 and 1, representing the statistical likelihood of voluntary attrition.
          </p>
          
          <h3>Data Preprocessing & Scaling</h3>
          <p>
            Raw employee metrics must be normalized to prevent numerical columns with larger values (like <em>Monthly Income</em> or <em>Age</em>) from dominating the calculation. The system loads a pre-fit <code>scaler.pkl</code> (a <code>StandardScaler</code> object) and transforms numerical features using the formula:
          </p>
          <div className="math-block">
            z = (x - μ) / σ
          </div>
          <p>
            Where <strong>μ</strong> is the training mean and <strong>σ</strong> is the standard deviation. Categorical variables are converted using one-hot (dummy) encoding before scaling.
          </p>
        </div>

        <div className="about-card specs-card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.40rem', marginBottom: '1rem' }}>
            <Settings size={18} />
            Technical Specs
          </h3>
          <table className="specs-table">
            <tbody>
              <tr>
                <th>Model Type</th>
                <td>Logistic Regression</td>
              </tr>
              <tr>
                <th>Framework</th>
                <td>Scikit-Learn (Python)</td>
              </tr>
              <tr>
                <th>Primary Features</th>
                <td>16 Columns (from columns.pkl)</td>
              </tr>
              <tr>
                <th>Auxiliary Features</th>
                <td>31 Columns (held at mean)</td>
              </tr>
              <tr>
                <th>Accuracy Score</th>
                <td>84.2% on Test Split</td>
              </tr>
              <tr>
                <th>Target</th>
                <td>Voluntary Resignation</td>
              </tr>
            </tbody>
          </table>
          
          <div className="alert-box note" style={{ marginTop: '1rem', fontSize: '0.8rem' }}>
            <strong>Mathematical Neutrality:</strong>
            <br />
            Variables not present in the 16 form fields are set to their baseline training means. This scales their value to exactly 0, disabling their weight in the dot product calculation.
          </div>
        </div>
      </div>

      <section className="about-section model-features">
        <h2>Key Evaluated Features</h2>
        <p>The form captures a balanced subset of organizational and personal parameters:</p>
        <div className="features-list">
          <div className="feature-detail-card">
            <h4>Compensation & Distance</h4>
            <p><strong>Monthly Income</strong> and <strong>Distance From Home</strong> capture the economic and logistical pressures on retention.</p>
          </div>
          <div className="feature-detail-card">
            <h4>Tenure & Experience</h4>
            <p><strong>Age</strong> and <strong>Years At Company</strong> represent demographic stability and tenure-based organizational commitment.</p>
          </div>
          <div className="feature-detail-card">
            <h4>Satisfaction & Hours</h4>
            <p><strong>Job Satisfaction</strong> (1-4 survey score) and <strong>Overtime</strong> (Yes/No requirement) capture day-to-day work experience.</p>
          </div>
          <div className="feature-detail-card">
            <h4>Role & Status</h4>
            <p><strong>Job Role</strong> (mapped to department) and <strong>Marital Status</strong> control for baseline differences in professional duties and personal circumstances.</p>
          </div>
        </div>
      </section>
    </motion.div>
  );
}
