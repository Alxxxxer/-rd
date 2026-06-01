import React, { Component, StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Premium Debugging Error Boundary to catch and show silent browser runtime crashes
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      hasError: true,
      error: error,
      errorInfo: errorInfo
    });
    console.error("React Audit Error Boundary caught a crash:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '32px',
          background: '#0b0f19',
          color: '#f87171',
          fontFamily: 'monospace',
          minHeight: '100vh',
          textAlign: 'left',
          overflow: 'auto',
          border: '2px solid #ef4444'
        }}>
          <h1 style={{ color: '#ffffff', fontSize: '24px', borderBottom: '1px solid #ef4444', paddingBottom: '12px', marginBottom: '20px' }}>
            ⚠️ React Rendering Crash Detected
          </h1>
          <p style={{ fontSize: '16px', fontWeight: 'bold', color: '#fca5a5', marginBottom: '16px' }}>
            Error: {this.state.error && this.state.error.toString()}
          </p>
          <pre style={{
            background: '#070a13',
            padding: '20px',
            borderRadius: '8px',
            overflowX: 'auto',
            border: '1px solid #1e293b',
            color: '#cbd5e1',
            fontSize: '13px',
            lineHeight: '1.6'
          }}>
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <p style={{ marginTop: '20px', color: '#64748b', fontSize: '12px' }}>
            SalesCRM System Diagnostics. Check console for additional thread logging.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
