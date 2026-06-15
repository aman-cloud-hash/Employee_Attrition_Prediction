import React from 'react';
import { BarChart3, Target, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Dashboard({ setActiveTab }) {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="dashboard-wrapper"
    >
      {/* Hero section */}
      <motion.div variants={itemVariants} className="dashboard-hero">
        <h1>Predictive Workforce Analytics</h1>
        <p className="subtitle">
          Empower HR decision-making with data-driven attrition prediction. Assess employee retention risk levels using trained Machine Learning models.
        </p>
        <div className="hero-actions" style={{ marginTop: '1.5rem' }}>
          <button onClick={() => setActiveTab('predict')} className="btn btn-primary">
            Start New Evaluation
            <ChevronRight size={16} />
          </button>
          <button onClick={() => setActiveTab('about')} className="btn btn-secondary">
            Learn About the Model
          </button>
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div variants={itemVariants} className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon blue">
            <BarChart3 size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Dataset Baseline Attrition</span>
            <span className="kpi-value">16.1%</span>
            <span className="kpi-change text-neutral">Based on historical employee data</span>
          </div>
        </div>
        
        <div className="kpi-card">
          <div className="kpi-icon green">
            <Target size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Model Evaluation Accuracy</span>
            <span className="kpi-value">84.2%</span>
            <span className="kpi-change text-green">▲ 1.4% over baseline classifier</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon orange">
            <Zap size={24} />
          </div>
          <div className="kpi-data">
            <span className="kpi-label">Processing Time</span>
            <span className="kpi-value">&lt; 10ms</span>
            <span className="kpi-change text-green">Real-time API response</span>
          </div>
        </div>
      </motion.div>

      {/* Info Sections */}
      <motion.div variants={itemVariants} className="dashboard-info-sections">
        <div className="info-card">
          <h2>How Attrition Prediction Works</h2>
          <p>
            This portal leverages a Logistic Regression classification model trained on standard historical IBM HR dataset records. By evaluating multiple organizational parameters, the system outputs the likelihood of an employee voluntarily exiting.
          </p>
          
          <div className="steps-list">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-text">
                <strong>Input Employee Metrics:</strong> Enter key variables including income, satisfaction levels, overtime commitments, and tenure in the prediction panel.
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-text">
                <strong>Feature Normalization:</strong> The backend scales inputs using a pre-calculated StandardScaler to align numerical values with model coefficients.
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">3</div>
              <div className="step-text">
                <strong>Inference Output:</strong> The model evaluates features, outputs attrition probability, and presents HR-friendly recommendations.
              </div>
            </div>
          </div>
        </div>

        <div className="info-card side-panel">
          <h3>Primary Risk Indicators</h3>
          <p className="panel-desc">
            Analysis of the model's coefficients shows that the following factors are key drivers of attrition:
          </p>
          <ul className="indicator-list">
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.50rem' }}>
              <AlertTriangle size={16} className="text-danger" style={{ color: 'var(--color-danger-accent)', marginTop: '0.2rem', flexShrink: 0 }} />
              <span className="txt">
                <strong>Overtime:</strong> Employees working overtime exhibit the highest statistical correlation with voluntary exit.
              </span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.50rem' }}>
              <AlertTriangle size={16} style={{ color: '#f97316', marginTop: '0.2rem', flexShrink: 0 }} />
              <span className="txt">
                <strong>Job Satisfaction:</strong> Low scores in satisfaction heavily weight towards predictive risk.
              </span>
            </li>
            <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.50rem' }}>
              <AlertTriangle size={16} style={{ color: 'var(--color-primary)', marginTop: '0.2rem', flexShrink: 0 }} />
              <span className="txt">
                <strong>Tenure & Role:</strong> Early tenure (less than 2 years) combined with specific sales roles show higher baseline risk.
              </span>
            </li>
          </ul>
          <button onClick={() => setActiveTab('about')} className="more-link" style={{ background: 'none', border: 'none', padding: 0 }}>
            View complete feature analysis &rarr;
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
