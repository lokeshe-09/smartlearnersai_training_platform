import React from 'react';
import { 
  TrendingUp, 
  Award, 
  Zap, 
  Target, 
  Calendar,
  ArrowUpRight
} from 'lucide-react';

const Progress = () => {
  // Mock data for the 5-Week Course Graph
  const dataPoints = [20, 45, 60, 78, 95];
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
  const maxVal = 100;
  
  // Graph Dimensions
  const width = 800;
  const height = 300;
  const padding = 40;
  const graphWidth = width - padding * 2;
  const graphHeight = height - padding * 2;
  
  // Calculate SVG points
  const points = dataPoints.map((val, i) => {
    const x = padding + (i / (dataPoints.length - 1)) * graphWidth;
    const y = height - padding - (val / maxVal) * graphHeight;
    return `${x},${y}`;
  }).join(' ');

  // Calculate area path (closing the loop at the bottom)
  const areaPoints = `
    ${padding},${height - padding} 
    ${points} 
    ${width - padding},${height - padding}
  `;

  return (
    <div className="h-full animate-in fade-in slide-in-from-bottom-4 duration-700 overflow-y-auto pb-10">
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tight">Performance Analytics</h2>
            <p className="text-slate-500 font-medium">Visualizing your journey across the 5-Week Curriculum</p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-xl border border-green-100 font-bold text-sm shadow-sm">
             <TrendingUp size={16} /> Top 5% of Learners
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           <StatCard icon={<Zap size={20} className="text-yellow-500" />} label="Total XP" value="12,450" sub="+1,200 this week" color="bg-yellow-50" />
           <StatCard icon={<Award size={20} className="text-purple-500" />} label="Skills Mastered" value="18/25" sub="72% Completion" color="bg-purple-50" />
           <StatCard icon={<Target size={20} className="text-red-500" />} label="Accuracy" value="94%" sub="Avg. Quiz Score" color="bg-red-50" />
           <StatCard icon={<Calendar size={20} className="text-blue-500" />} label="Learning Streak" value="12 Days" sub="Keep it up!" color="bg-blue-50" />
        </div>

        {/* Main Growth Graph */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-slate-200 relative overflow-hidden group">
            <div className="flex justify-between items-center mb-8">
               <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                 <TrendingUp size={20} className="text-[#00A0E3]" /> Skill Growth Trajectory
               </h3>
               <div className="px-3 py-1 text-xs font-bold rounded-lg bg-slate-800 text-white cursor-default">
                  Full Course View
               </div>
            </div>
            
            {/* Custom SVG Graph */}
            <div className="w-full aspect-[2/1] md:aspect-[3/1] relative">
               <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map((tick, i) => {
                     const y = height - padding - (tick / 100) * graphHeight;
                     return (
                       <g key={i}>
                         <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
                         <text x={padding - 10} y={y + 4} textAnchor="end" className="text-[10px] fill-slate-400 font-medium">{tick}%</text>
                       </g>
                     );
                  })}
                  
                  {/* Gradient Definition */}
                  <defs>
                    <linearGradient id="graphGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00A0E3" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#00A0E3" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Area Fill */}
                  <path d={areaPoints} fill="url(#graphGradient)" className="animate-[pulse_4s_ease-in-out_infinite]" />
                  
                  {/* Line Path */}
                  <polyline 
                     fill="none" 
                     stroke="#00A0E3" 
                     strokeWidth="4" 
                     points={points}
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     className="drop-shadow-lg"
                  />
                  
                  {/* Data Points */}
                  {dataPoints.map((val, i) => {
                     const x = padding + (i / (dataPoints.length - 1)) * graphWidth;
                     const y = height - padding - (val / maxVal) * graphHeight;
                     return (
                       <g key={i} className="group/point cursor-pointer">
                         <circle cx={x} cy={y} r="6" fill="white" stroke="#00A0E3" strokeWidth="3" className="transition-all duration-300 group-hover/point:r-8 group-hover/point:fill-[#00A0E3]" />
                         {/* Tooltip */}
                         <g className="opacity-0 group-hover/point:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <rect x={x - 20} y={y - 45} width="40" height="28" rx="6" fill="#1e293b" />
                            <text x={x} y={y - 27} textAnchor="middle" fill="white" className="text-xs font-bold">{val}%</text>
                            {/* Little triangle */}
                            <path d={`M${x-4},${y-17} L${x+4},${y-17} L${x},${y-13} Z`} fill="#1e293b" />
                         </g>
                         {/* X-Axis Labels */}
                         <text x={x} y={height - 15} textAnchor="middle" className="text-[10px] fill-slate-400 font-bold">{labels[i]}</text>
                       </g>
                     );
                  })}
               </svg>
            </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           {/* Domain Mastery */}
           <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-slate-800 mb-6 text-lg">Domain Mastery</h3>
              <div className="space-y-6">
                 <ProgressItem label="W1: Foundations & Prompting" percent={100} color="bg-indigo-500" />
                 <ProgressItem label="W2: Advanced Prompt Engineering" percent={92} color="bg-pink-500" />
                 <ProgressItem label="W3: RAG Architectures" percent={45} color="bg-cyan-500" />
                 <ProgressItem label="W4: Agentic Workflows" percent={20} color="bg-emerald-500" />
                 <ProgressItem label="W5: Deployment & Ethics" percent={5} color="bg-orange-500" />
              </div>
           </div>

           {/* Recent Achievements */}
           <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-lg transition-shadow">
              <h3 className="font-bold text-slate-800 mb-6 text-lg">Recent Achievements</h3>
              <div className="space-y-4">
                 <AchievementItem title="Prompt Master" desc="Completed 50 zero-shot prompts" date="2h ago" icon="🏆" color="text-yellow-500 bg-yellow-50" />
                 <AchievementItem title="Quiz Whiz" desc="Scored 100% in Week 1 Assessment" date="1d ago" icon="⭐" color="text-purple-500 bg-purple-50" />
                 <AchievementItem title="Lab Rat" desc="Submitted first Python lab" date="3d ago" icon="🧪" color="text-blue-500 bg-blue-50" />
                 <AchievementItem title="Bug Hunter" desc="Fixed 5 logic errors in Agents Lab" date="5d ago" icon="🐛" color="text-red-500 bg-red-50" />
              </div>
              <button className="w-full mt-6 py-3 rounded-xl bg-slate-50 text-slate-500 font-bold text-sm hover:bg-slate-100 transition-colors">View All History</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, label, value, sub, color }: any) => (
  <div className="bg-white p-5 rounded-[1.5rem] border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
     <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
           {icon}
        </div>
        <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg flex items-center gap-1 border border-green-100">
           <ArrowUpRight size={12} /> 12%
        </span>
     </div>
     <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">{label}</h4>
     <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
     <p className="text-xs text-slate-400 font-medium mt-1">{sub}</p>
  </div>
);

const ProgressItem = ({ label, percent, color }: any) => (
  <div>
     <div className="flex justify-between mb-2 text-sm font-bold">
        <span className="text-slate-700">{label}</span>
        <span className="text-slate-500">{percent}%</span>
     </div>
     <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percent}%` }}></div>
     </div>
  </div>
);

const AchievementItem = ({ title, desc, date, icon, color }: any) => (
   <div className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-default group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg shadow-sm transition-transform group-hover:scale-110 ${color}`}>
         {icon}
      </div>
      <div className="flex-1">
         <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
         <p className="text-xs text-slate-500">{desc}</p>
      </div>
      <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide group-hover:text-slate-400 transition-colors">{date}</span>
   </div>
);

export default Progress;