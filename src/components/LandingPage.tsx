import React from 'react';

interface LandingPageProps {
  onNavigateToTraining: () => void;
  onNavigateToHR: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToTraining, onNavigateToHR }) => {
  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4">
      <div className="max-w-5xl w-full">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4 tracking-wide">
            Welcome
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 font-medium tracking-wider">
            Please Select System
          </p>
        </div>

        {/* Buttons Container */}
        <div className="grid md:grid-cols-2 gap-8 px-4">
          {/* Training System Button */}
          <button
            onClick={onNavigateToTraining}
            className="group relative bg-[#172A46] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 border-2 border-[#1F3A67] hover:border-blue-400"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* לוגו CertVision */}
              <svg width="100" height="100" viewBox="0 0 100 100" className="transition-transform duration-300 group-hover:scale-110">
                {/* רקע עיגול */}
                <circle cx="50" cy="50" r="45" fill="#1E3A8A" className="group-hover:fill-[#2563EB] transition-colors duration-300"/>
                
                {/* אייקון תעודה */}
                <rect x="30" y="25" width="40" height="50" rx="3" fill="white" opacity="0.95"/>
                <rect x="35" y="32" width="30" height="3" rx="1.5" fill="#1E3A8A"/>
                <rect x="35" y="40" width="25" height="2" rx="1" fill="#60A5FA"/>
                <rect x="35" y="46" width="25" height="2" rx="1" fill="#60A5FA"/>
                <rect x="35" y="52" width="20" height="2" rx="1" fill="#60A5FA"/>
                
                {/* כוכב הסמכה */}
                <path d="M 50 60 L 53 66 L 60 67 L 55 72 L 56 79 L 50 76 L 44 79 L 45 72 L 40 67 L 47 66 Z" fill="#10B981"/>
                
                {/* אנשים */}
                <circle cx="42" cy="68" r="3" fill="#3B82F6"/>
                <circle cx="50" cy="68" r="3" fill="#3B82F6"/>
                <circle cx="58" cy="68" r="3" fill="#3B82F6"/>
              </svg>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                  Employee Certification
                </h2>
                <p className="text-lg text-gray-300 font-medium tracking-wider">
                  Training Management System
                </p>
              </div>
              
              <div className="pt-2">
                <span className="text-blue-400 group-hover:text-blue-300 font-semibold text-lg tracking-wide">
                  Click to Enter →
                </span>
              </div>
            </div>
          </button>

          {/* Equipment System Button */}
          <button
            onClick={onNavigateToHR}
            className="group relative bg-[#172A46] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 border-2 border-[#1F3A67] hover:border-emerald-400"
          >
            <div className="flex flex-col items-center text-center space-y-6">
              {/* לוגו ספקטרום אנלייזר */}
              <svg width="100" height="100" viewBox="0 0 100 100" className="transition-transform duration-300 group-hover:scale-110">
                {/* רקע עיגול */}
                <circle cx="50" cy="50" r="45" fill="#047857" className="group-hover:fill-[#10B981] transition-colors duration-300"/>
                
                {/* מסגרת ספקטרום אנלייזר */}
                <rect x="20" y="30" width="60" height="45" rx="3" fill="#1E293B" stroke="white" strokeWidth="2"/>
                
                {/* מסך */}
                <rect x="24" y="34" width="52" height="30" fill="#0A192F" stroke="#60A5FA" strokeWidth="1"/>
                
                {/* גרף ספקטרום */}
                <path 
                  d="M 28 54 L 35 50 L 42 42 L 50 38 L 58 45 L 65 48 L 72 52" 
                  stroke="#10B981" 
                  strokeWidth="2" 
                  fill="none"
                  strokeLinecap="round"
                />
                <path 
                  d="M 28 54 L 35 50 L 42 42 L 50 38 L 58 45 L 65 48 L 72 52 L 72 64 L 28 64 Z" 
                  fill="url(#equipGradient)" 
                  opacity="0.4"
                />
                
                {/* כפתורים */}
                <circle cx="30" cy="70" r="2.5" fill="#EF4444"/>
                <circle cx="38" cy="70" r="2.5" fill="#10B981"/>
                <circle cx="46" cy="70" r="2.5" fill="#3B82F6"/>
                
                {/* מחוגים */}
                <rect x="58" y="67" width="6" height="6" rx="1" fill="#374151" stroke="#60A5FA" strokeWidth="0.5"/>
                <rect x="66" y="67" width="6" height="6" rx="1" fill="#374151" stroke="#60A5FA" strokeWidth="0.5"/>
                
                {/* גרדיאנט */}
                <defs>
                  <linearGradient id="equipGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.7"/>
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.1"/>
                  </linearGradient>
                </defs>
              </svg>
              
              <div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-wide">
                  Equipment Calibration
                </h2>
                <p className="text-lg text-gray-300 font-medium tracking-wider">
                  Testing Equipment System
                </p>
              </div>
              
              <div className="pt-2">
                <span className="text-emerald-400 group-hover:text-emerald-300 font-semibold text-lg tracking-wide">
                  Click to Enter →
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 space-y-6">
          <p className="text-lg text-gray-400 tracking-wider">Choose the system that suits your needs</p>
          
          {/* Organization Info */}
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white tracking-wide">
              Israel Airports Authority
            </h3>
            <p className="text-xl text-gray-300 tracking-wider">
              Navigation Department
            </p>
          </div>
          
          {/* Developer Credit */}
          <div className="pt-4 border-t border-gray-700 mx-auto max-w-md">
            <p className="text-sm text-gray-500">
              מערכת זו פותחה ע״י שגיא לוי - גרסה 1.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

