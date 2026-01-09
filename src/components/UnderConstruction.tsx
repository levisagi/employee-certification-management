import React from 'react';
import { Construction, ArrowRight } from 'lucide-react';

interface UnderConstructionProps {
  onBackToHome: () => void;
}

const UnderConstruction: React.FC<UnderConstructionProps> = ({ onBackToHome }) => {
  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-8">
          <div className="bg-[#172A46] rounded-full p-8 border-2 border-[#1F3A67]">
            <Construction className="w-24 h-24 text-emerald-400" />
          </div>
        </div>

        {/* Main Message */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
          מערכת ניהול צב״דים
        </h1>
        
        <div className="bg-[#172A46] rounded-xl shadow-lg p-8 mb-8 border-2 border-[#1F3A67]">
          <p className="text-2xl md:text-3xl text-white font-semibold mb-4">
            נמצא בפיתוח
          </p>
          <p className="text-xl text-gray-300">
            ובקרוב יופעל
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="bg-[#172A46] rounded-full h-4 overflow-hidden border border-[#1F3A67]">
            <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full animate-pulse" style={{ width: '60%' }}></div>
          </div>
          <p className="text-gray-400 mt-2">המערכת בשלבי פיתוח מתקדמים</p>
        </div>

        {/* Back Button */}
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-lg"
        >
          <ArrowRight className="w-6 h-6" />
          <span>חזרה לדף הבחירה</span>
        </button>
      </div>
    </div>
  );
};

export default UnderConstruction;

