import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    // يمكنك إرسال الخطأ لسيرفر خارجي هنا
    if (window && window.console) {
      console.error('React ErrorBoundary:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, color: '#b91c1c', background: '#fff0f0', fontFamily: 'sans-serif' }}>
          <h2>حدث خطأ في التطبيق</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#333', background: '#f3f3f3', padding: 16, borderRadius: 8 }}>
            {this.state.error?.toString()}
            {'\n'}
            {this.state.errorInfo?.componentStack}
          </pre>
          <p>يرجى تحديث الصفحة أو التواصل مع الدعم الفني.</p>
        </div>
      );
    }
    return this.props.children;
  }
}
