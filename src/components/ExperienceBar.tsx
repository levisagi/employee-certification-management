import React, { useMemo } from 'react';

interface ExperienceBarProps {
    startDate: Date;
}

const ExperienceBar: React.FC<ExperienceBarProps> = ({ startDate }) => {
    const experienceProgress = useMemo(() => {
        const start = new Date(startDate);
        const now = new Date();
        const threeYearsInDays = 3 * 365; // 3 שנים בימים
        
        const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        const progress = Math.min((daysSinceStart / threeYearsInDays) * 100, 100);
        
        const years = Math.floor(daysSinceStart / 365);
        const months = Math.floor((daysSinceStart % 365) / 30);
        
        return {
            progress,
            timeString: `${years} שנים ו-${months} חודשים`,
            years,
            months
        };
    }, [startDate]);

    const getProgressColor = (progress: number) => {
        if (progress >= 100) return 'bg-emerald-500';
        if (progress >= 66) return 'bg-yellow-500';
        return 'bg-blue-500';
    };

    return (
        <div className="w-full">
            <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400">ותק ונסיון</span>
                <div className="flex items-center gap-1">
                    <span className="text-xs font-medium text-gray-300">
                        {Math.round(experienceProgress.progress)}%
                    </span>
                    <span className="text-xs text-gray-500">
                        ({experienceProgress.timeString})
                    </span>
                </div>
            </div>
            <div className="w-full bg-[#334155] rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition-all duration-500 ${getProgressColor(experienceProgress.progress)}`}
                    style={{ width: `${experienceProgress.progress}%` }}
                />
            </div>
        </div>
    );
};

export default ExperienceBar;