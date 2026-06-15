import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Predictor from './components/Predictor';
import About from './components/About';
import Contact from './components/Contact';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard setActiveTab={setActiveTab} />;
      case 'predict':
        return <Predictor />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      default:
        return <Dashboard setActiveTab={setActiveTab} />;
    }
  };

  return (
    <>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="main-content">
        <div className="content-container">
          {renderContent()}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-container">
          <p>&copy; 2026 HR Analytics Portal. All rights reserved.</p>
          <p className="developer-credit">Developed by <strong>Aman Rajbhar</strong></p>
        </div>
      </footer>
    </>
  );
}

export default App;
