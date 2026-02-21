import React, { useState } from 'react';
import { LogIn } from 'lucide-react';

interface LoginProps {
  onLogin: (username: string, password: string) => void;
  error?: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, error }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    
    try {
      // כניסה ללא אימות - מעביר ערכים ריקים
      await onLogin('', '');
    } catch (err) {
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0A192F] to-[#112240] flex items-center justify-center p-3">
      <div className="bg-white rounded-xl shadow-2xl p-4 sm:p-8 max-w-md w-full">
        <div className="text-center mb-4 sm:mb-8">
          <img src="/images/logo.svg" alt="CertVision Logo" className="h-12 w-12 sm:h-20 sm:w-20 mx-auto mb-2 sm:mb-3" />
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">CertVision</h1>
          <p className="text-xs sm:text-base text-gray-600 mb-3 sm:mb-6">Certification Management Excellence</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-2 sm:p-4 rounded-lg mb-3 sm:mb-6 text-xs sm:text-sm">
            {error}
          </div>
        )}

        <div className="text-center">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className={`w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 sm:py-4 px-4 text-base sm:text-lg rounded-lg transition-colors flex items-center justify-center gap-2
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span>נכנס למערכת...</span>
              </>
            ) : (
              <>
                <LogIn size={20} />
                <span>כניסה למערכת</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;