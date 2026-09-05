import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AgriNexus Runtime Error caught by ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/farmer';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-warm-ivory flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white border-3 border-dark-neutral p-6 rounded-md shadow-brutal-lg text-center space-y-4">
            <div className="w-14 h-14 bg-amber-100 border-2 border-dark-neutral rounded-sm flex items-center justify-center mx-auto text-amber-700 shadow-[2px_2px_0px_#22252A]">
              <AlertTriangle className="w-8 h-8" />
            </div>
            
            <h2 className="text-xl font-heading font-black text-dark-neutral">
              Something went wrong
            </h2>
            
            <p className="text-xs text-dark-neutral-muted font-medium">
              An unexpected error occurred while displaying this page. Your session and bookings remain secure.
            </p>

            {this.state.error?.message && (
              <div className="p-2.5 bg-warm-ivory border border-dark-neutral/30 rounded-xs text-[11px] font-mono text-left text-red-700 overflow-x-auto max-h-24">
                {this.state.error.message}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 py-2 px-3 bg-white hover:bg-gray-50 border-2 border-dark-neutral text-xs font-black uppercase text-dark-neutral rounded-xs shadow-[2px_2px_0px_#22252A] flex items-center justify-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 py-2 px-3 bg-forest-green hover:bg-forest-green/90 border-2 border-dark-neutral text-xs font-black uppercase text-white rounded-xs shadow-[2px_2px_0px_#22252A] flex items-center justify-center gap-1.5 transition-all active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
