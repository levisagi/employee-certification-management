import React from 'react';
import { Users, Briefcase } from 'lucide-react';

interface LandingPageProps {
  onNavigateToTraining: () => void;
  onNavigateToHR: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToTraining, onNavigateToHR }) => {
  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            ברוכים הבאים
          </h1>
          <p className="text-2xl md:text-3xl text-gray-300 font-medium">
            נא לבחור מערכת
          </p>
        </div>

        {/* Buttons Container */}
        <div className="grid md:grid-cols-2 gap-8 px-4">
          {/* Training System Button */}
          <button
            onClick={onNavigateToTraining}
            className="group relative bg-[#172A46] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 border-2 border-[#1F3A67] hover:border-blue-400"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-blue-500 group-hover:bg-blue-400 rounded-full p-6 transition-colors duration-300">
                <Users className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                כניסה למערכת
              </h2>
              <p className="text-xl text-gray-300 font-medium">
                ניהול הכשרות עובדים
              </p>
              <div className="pt-4">
                <span className="text-blue-400 group-hover:text-blue-300 font-semibold text-lg">
                  לחץ להמשך ←
                </span>
              </div>
            </div>
          </button>

          {/* HR System Button */}
          <button
            onClick={onNavigateToHR}
            className="group relative bg-[#172A46] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 p-8 border-2 border-[#1F3A67] hover:border-emerald-400"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="bg-emerald-500 group-hover:bg-emerald-400 rounded-full p-6 transition-colors duration-300">
                <Briefcase className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-white">
                כניסה למערכת
              </h2>
              <p className="text-xl text-gray-300 font-medium">
                ניהול צב״דים
              </p>
              <div className="pt-4">
                <span className="text-emerald-400 group-hover:text-emerald-300 font-semibold text-lg">
                  לחץ להמשך ←
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-400">
          <p className="text-lg">בחר את המערכת המתאימה לצרכים שלך</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;

