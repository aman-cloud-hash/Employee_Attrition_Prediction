import React, { useState, useRef, useEffect } from 'react';
import { Mail, Phone, MapPin, Link as LinkIcon, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReCAPTCHA from 'react-google-recaptcha';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const [recaptchaTheme, setRecaptchaTheme] = useState(() => {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  });

  // Dynamically update reCAPTCHA theme when document theme changes
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      setRecaptchaTheme(currentTheme === 'dark' ? 'dark' : 'light');
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme']
    });

    return () => observer.disconnect();
  }, []);

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    if (token && errors.recaptcha) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next.recaptcha;
        return next;
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.name.trim()) nextErrors.name = 'Name is required.';
    if (!formData.email.trim()) nextErrors.email = 'Email is required.';
    else if (!emailRegex.test(formData.email.trim())) nextErrors.email = 'Enter a valid corporate email.';
    if (!formData.subject) nextErrors.subject = 'Please select an inquiry category.';
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      nextErrors.message = 'Message must be at least 10 characters long.';
    }

    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey && !recaptchaToken) {
      nextErrors.recaptcha = 'Please complete the reCAPTCHA verification.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setSubmitted(false);
    setErrorMessage('');

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
    const apiUrl = `${apiBaseUrl}/api/contact`;
    
    const payload = {
      ...formData,
      recaptchaToken: recaptchaToken
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
        setRecaptchaToken(null);
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        
        if (!result.credentials_configured) {
          console.warn(
            "HR Analytics Portal: Contact message received on backend but email was NOT sent because " +
            "SMTP_PASSWORD environment variable is not configured. Run the server with real SMTP credentials."
          );
        }
      } else {
        if (result.errors) {
          const apiErrors = {};
          result.errors.forEach(err => {
            if (err.includes('Name')) apiErrors.name = err;
            else if (err.includes('email')) apiErrors.email = err;
            else if (err.includes('Category')) apiErrors.subject = err;
            else if (err.includes('Message')) apiErrors.message = err;
            else if (err.includes('reCAPTCHA')) apiErrors.recaptcha = err;
          });
          setErrors(apiErrors);
        }
        setErrorMessage(result.message || 'Failed to submit form.');
        setRecaptchaToken(null);
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
      }
    } catch (err) {
      console.error('Contact submit error:', err);
      // Fallback direct connection
      if (!apiBaseUrl) {
        try {
          const directResponse = await fetch('http://127.0.0.1:5000/api/contact', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          const directData = await directResponse.json();
          if (directData.success) {
            setSubmitted(true);
            setFormData({ name: '', email: '', subject: '', message: '' });
            setRecaptchaToken(null);
            if (recaptchaRef.current) {
              recaptchaRef.current.reset();
            }
            setLoading(false);
            return;
          }
        } catch (directErr) {
          console.error('Direct fallback failed:', directErr);
        }
      }
      setErrorMessage('Connection Failure: Unable to reach contact server. Please verify backend is running.');
      setRecaptchaToken(null);
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="contact-container"
    >
      <div className="page-header text-center">
        <h1>Contact Developer</h1>
        <p className="subtitle">For inquiries regarding model specifications, project integration, or developer feedback.</p>
      </div>

      <div className="contact-grid">
        {/* Developer Card */}
        <motion.div 
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="contact-card info-card"
        >
          <h2>Developer Details</h2>
          <p className="lead">For inquiries regarding the predictive logic, deployment instructions, or technical specifications, please contact the developer.</p>

          <div className="dev-profile">
            <div className="profile-details">
              <h3 className="dev-name">Aman Rajbhar</h3>
              <p className="dev-title">B.Tech Computer Engineering | Data Analyst</p>
            </div>
          </div>

          <div className="contact-details-list">
            <div className="contact-detail-item">
              <span className="icon"><Mail size={16} /></span>
              <span className="text">
                <a href="mailto:amanrajbhar199918@gmail.com" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  amanrajbhar199918@gmail.com
                </a>
              </span>
            </div>

            <div className="contact-detail-item">
              <span className="icon"><Phone size={16} /></span>
              <span className="text">+91 8604600292</span>
            </div>

            <div className="contact-detail-item">
              <span className="icon"><MapPin size={16} /></span>
              <span className="text">Vadodara, Gujarat</span>
            </div>

            <div className="contact-detail-item">
              <span className="icon"><LinkIcon size={16} /></span>
              <span className="text">
                <a href="https://github.com/aman-cloud-hash/project" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>
                  github.com/aman-cloud-hash/project
                </a>
              </span>
            </div>
          </div>

          <div className="tech-stack-info">
            <h4>System Architecture</h4>
            <p>This application runs on a local micro-service instance using Flask and Scikit-Learn. Custom data export protocols can be configured by contacting the database engineering desk.</p>
          </div>
        </motion.div>

        {/* Form Card */}
        <motion.div 
          initial={{ x: 20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="contact-card form-card"
        >
          <h2>Send Message to Developer</h2>
          <p className="card-subtitle" style={{ marginBottom: '1rem' }}>Complete the form below to send a message directly to the developer.</p>

          <AnimatePresence>
            {submitted && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                className="alert-box success"
              >
                <strong>Message Sent!</strong> Your message has been sent to the developer. We will respond shortly.
              </motion.div>
            )}

            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0 }}
                className="alert-box success"
                style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger-text)', borderColor: 'var(--color-danger-border)' }}
              >
                <strong>Error:</strong> {errorMessage}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} novalidate>
            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="contactName">Your Name</label>
              <input
                type="text"
                id="contactName"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="e.g., Jane Doe"
                className={errors.name ? 'invalid' : ''}
              />
              <span className="error-msg">{errors.name}</span>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="contactEmail">Corporate Email</label>
              <input
                type="email"
                id="contactEmail"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="jane.doe@company.com"
                className={errors.email ? 'invalid' : ''}
              />
              <span className="error-msg">{errors.email}</span>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="contactSubject">Inquiry Category</label>
              <select
                id="contactSubject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                className={errors.subject ? 'invalid' : ''}
              >
                <option value="" disabled>Select Category</option>
                <option value="Model Issue">Prediction Mismatch / Edge Case</option>
                <option value="Retraining">Request Model Retraining (New Dataset)</option>
                <option value="Integration">API/JSON Integration Request</option>
                <option value="Other">Other General Inquiry</option>
              </select>
              <span className="error-msg">{errors.subject}</span>
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label htmlFor="contactMessage">Details / Request Message</label>
              <textarea
                id="contactMessage"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows="5"
                placeholder="Provide a detailed description of your request..."
                className={errors.message ? 'invalid' : ''}
              />
              <span className="error-msg">{errors.message}</span>
            </div>

            {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
              <div className="form-group recaptcha-wrapper" style={{ marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                  onChange={handleRecaptchaChange}
                  theme={recaptchaTheme}
                />
                {errors.recaptcha && <span className="error-msg" style={{ marginTop: '0.5rem', display: 'block', textAlign: 'center' }}>{errors.recaptcha}</span>}
              </div>
            )}

            <motion.button
              type="submit"
              className="btn btn-primary btn-block"
              whileTap={{ scale: 0.98 }}
              disabled={loading}
            >
              {!loading ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.40rem' }}>
                  <Send size={14} />
                  <span>Send Message</span>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.40rem' }}>
                  <div className="spinner" />
                  <span>Sending...</span>
                </div>
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </motion.div>
  );
}
