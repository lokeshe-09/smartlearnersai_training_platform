import React from 'react';
import { Award } from 'lucide-react';

interface CertificatesProps {
  onResumeLearning: () => void;
}

const Certificates: React.FC<CertificatesProps> = ({ onResumeLearning }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center animate-in zoom-in duration-500 p-8">
      <div className="w-32 h-32 bg-slate-100 rounded-full flex items-center justify-center mb-6 relative">
          <Award size={64} className="text-slate-300" />
          <div className="absolute top-0 right-0 w-8 h-8 bg-slate-200 rounded-full animate-ping"></div>
      </div>
      <h2 className="text-2xl font-black text-slate-800 mb-2">No Certificates Yet</h2>
      <p className="text-slate-500 max-w-sm mb-8">
        Complete all modules and assessments to earn your industry-recognized certification.
      </p>
      <button 
        onClick={onResumeLearning}
        className="px-8 py-3 bg-[#00A0E3] text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-[#008bc5] transition-all hover:-translate-y-1"
      >
        Resume Learning
      </button>
    </div>
  );
};

export default Certificates;