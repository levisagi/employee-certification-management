import React, { useState, useEffect } from 'react';

interface LoadingProgressProps {
    message?: string;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({ message = 'טוען נתונים...' }) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        // סימולציה של התקדמות - מגיע ל-90% אחרי ~30 שניות
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return prev; // עוצרים ב-90% עד שהנתונים באמת נטענים
                // התקדמות איטית יותר
                if (prev < 30) return prev + 5;  // מהיר בהתחלה
                if (prev < 60) return prev + 3;  // בינוני
                return prev + 1;  // איטי בסוף
            });
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gray-200 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center mb-4">
                        <img src="/images/logo.svg" alt="Logo" className="h-16 w-16" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">CertVision</h2>
                    <p className="text-gray-600">{message}</p>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                    <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-gray-200">
                        <div
                            style={{ width: `${progress}%` }}
                            className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                        ></div>
                    </div>
                    <div className="text-center text-sm text-gray-600">
                        {progress}%
                    </div>
                </div>

                {/* Animated dots */}
                <div className="text-center mt-4">
                    <div className="inline-flex gap-1">
                        <span className="animate-bounce inline-block w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '0ms' }}></span>
                        <span className="animate-bounce inline-block w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '150ms' }}></span>
                        <span className="animate-bounce inline-block w-2 h-2 bg-blue-500 rounded-full" style={{ animationDelay: '300ms' }}></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoadingProgress;

