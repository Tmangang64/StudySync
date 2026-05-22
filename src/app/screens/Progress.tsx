import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { Search, Flame, Target, BookOpen, Clock, BarChart2, TrendingUp, Filter, CheckCircle2, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "sonner";

export const Progress = () => {
  const { sessions, streak, weeklyGoal, weeklyProgress } = useAppContext();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'solo', 'buddy', 'group'
  const [showQuote, setShowQuote] = useState(false);

  const prevStreakRef = useRef(streak);
  const checkedWeeklyGoalRef = useRef(false);

  useEffect(() => {
    if (location.state?.completedMessage) {
      setShowQuote(true);
      // Auto-hide quote after 8 seconds
      const timer = setTimeout(() => setShowQuote(false), 8000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const completedSessions = sessions.filter((s) => s.status === "completed");
  
  const totalDuration = completedSessions.reduce((acc, curr) => acc + curr.duration, 0);
  const avgDuration = completedSessions.length > 0 ? Math.round(totalDuration / completedSessions.length) : 0;

  const filteredSessions = completedSessions.filter((session) => {
    const matchesSearch =
      session.course.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === "all" || session.type === filter;
    return matchesSearch && matchesFilter;
  });

  const progressPercent = Math.min(100, Math.round((weeklyProgress / weeklyGoal) * 100));

  return (
    <div className="bg-slate-50 min-h-screen w-full max-w-7xl mx-auto pb-12">
      
      {/* Desktop Header Banner */}
      <div className="bg-blue-900 text-white rounded-b-[2rem] py-10 px-8 shadow-md relative flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
        
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[2rem]">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-screen filter blur-3xl opacity-20 transform translate-x-1/2 translate-y-1/2"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="text-orange-400" size={24} />
            <h1 className="text-3xl font-extrabold tracking-tight">Your Progress</h1>
          </div>
          <p className="text-blue-200 text-lg opacity-90">Every minute counts towards your goal. See how far you've come.</p>
        </div>
      </div>

      <div className="px-8 lg:px-10 space-y-10">
        
        {/* Success Quote Banner */}
        {showQuote && (
          <div className="bg-green-50 border-2 border-green-200 text-green-800 p-6 rounded-2xl flex items-start sm:items-center justify-between gap-4 shadow-sm animate-in slide-in-from-top-4 fade-in duration-500 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-100 rounded-bl-full opacity-50 pointer-events-none transform translate-x-1/4 -translate-y-1/4"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="bg-green-100 p-3 rounded-full shrink-0">
                <CheckCircle2 size={28} className="text-green-600" />
              </div>
              <div>
                <p className="font-extrabold text-lg mb-0.5">Session Completed!</p>
                <p className="font-medium opacity-90 text-green-700 italic">"{location.state?.completedMessage}"</p>
              </div>
            </div>
            <button 
              onClick={() => setShowQuote(false)} 
              className="p-2 hover:bg-green-100 rounded-full transition-colors relative z-10 shrink-0 self-start sm:self-auto"
            >
              <X size={20} className="text-green-600" />
            </button>
          </div>
        )}

        {/* Key Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute inset-0 bg-orange-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-orange-100 text-orange-500 p-4 rounded-2xl mb-4 shadow-sm z-10 group-hover:scale-110 transition-transform">
              <Flame size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 z-10">Current Streak</p>
            <p className="text-3xl font-black text-slate-800 z-10">{streak} <span className="text-lg font-medium text-slate-400">Days</span></p>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute inset-0 bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-blue-100 text-blue-900 p-4 rounded-2xl mb-4 shadow-sm z-10 group-hover:scale-110 transition-transform">
              <BarChart2 size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 z-10">Total Sessions</p>
            <p className="text-3xl font-black text-slate-800 z-10">{completedSessions.length}</p>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow relative overflow-hidden">
             <div className="absolute inset-0 bg-green-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-green-100 text-green-600 p-4 rounded-2xl mb-4 shadow-sm z-10 group-hover:scale-110 transition-transform">
              <Clock size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 z-10">Time Invested</p>
            <p className="text-3xl font-black text-slate-800 z-10">
              {Math.floor(totalDuration / 60)}<span className="text-lg font-medium text-slate-400">h</span> {totalDuration % 60}<span className="text-lg font-medium text-slate-400">m</span>
            </p>
          </div>
          
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center group hover:shadow-md transition-shadow relative overflow-hidden">
            <div className="absolute inset-0 bg-purple-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="bg-purple-100 text-purple-600 p-4 rounded-2xl mb-4 shadow-sm z-10 group-hover:scale-110 transition-transform">
              <BookOpen size={32} />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1 z-10">Avg. Session</p>
            <p className="text-3xl font-black text-slate-800 z-10">{avgDuration} <span className="text-lg font-medium text-slate-400">m</span></p>
          </div>
        </div>

        {/* Middle Section: Goal + History Top Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Weekly Goal Progress (Left Col) */}
          <section aria-labelledby="progress-weekly-goal" className="lg:col-span-1">
            <h2 id="progress-weekly-goal" className="text-xl font-bold text-slate-800 mb-4 flex items-center tracking-tight">
              <Target className="text-blue-900 mr-3" size={24} />
              Weekly Goal
            </h2>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-50 rounded-full opacity-50"></div>
              
              <div className="flex flex-col items-center justify-center mb-6 relative z-10">
                <div className="relative w-40 h-40 flex items-center justify-center mb-2">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                    <circle 
                      cx="50" cy="50" r="45" fill="transparent" 
                      stroke="#f97316" strokeWidth="10" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 45}`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercent / 100)}`}
                      className="transition-all duration-1000 ease-out" 
                    />
                  </svg>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-4xl font-black text-slate-800">{progressPercent}%</span>
                  </div>
                </div>
                <div className="flex items-baseline gap-2 mt-4">
                  <span className="font-black text-blue-900 text-3xl">{weeklyProgress}</span>
                  <span className="text-lg font-bold text-slate-400">/ {weeklyGoal} min</span>
                </div>
              </div>
              
              <p className="text-sm font-medium text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 text-center relative z-10">
                {progressPercent >= 100 
                  ? "🎉 Amazing! You've crushed your weekly goal." 
                  : `💪 You're doing great! Just ${weeklyGoal - weeklyProgress} minutes left.`}
              </p>
            </div>
          </section>

          {/* Study History (Right Cols) */}
          <section aria-labelledby="history-title" className="lg:col-span-2 flex flex-col">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
              <h2 id="history-title" className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
                Study History
              </h2>
              
              <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4">
                {/* Search Bar */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex items-center px-4 py-2 w-full md:w-64 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
                  <Search className="text-slate-400 mr-2 shrink-0" size={18} />
                  <input
                    type="text"
                    placeholder="Search sessions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full text-slate-800 focus:outline-none placeholder-slate-400 font-medium text-sm bg-transparent"
                  />
                </div>

                {/* Filter */}
                <div className="relative">
                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    className="w-full sm:w-auto bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block py-2.5 pl-4 pr-10 outline-none appearance-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors"
                  >
                    <option value="all">All Types</option>
                    <option value="solo">Solo Only</option>
                    <option value="buddy">Buddy Only</option>
                    <option value="group">Group Only</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                    <Filter size={16} />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1">
              {filteredSessions.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {filteredSessions
                    .sort((a, b) => new Date(b.completedAt || "").getTime() - new Date(a.completedAt || "").getTime())
                    .map((session) => (
                    <div key={session.id} className="p-6 hover:bg-slate-50 transition-colors group flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="inline-block px-3 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg uppercase tracking-wider border border-blue-100">
                            {session.course}
                          </span>
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center">
                            <Clock size={12} className="mr-1 inline" />
                            {new Date(session.completedAt || session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                          </span>
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-800 mb-1">{session.topic}</h3>
                        <p className="text-sm font-medium text-slate-500 flex items-center">
                          {session.type === "solo" ? (
                            <><span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span> Solo Focus</>
                          ) : (
                            <><span className="w-2 h-2 rounded-full bg-orange-400 mr-2"></span> Study Buddy</>
                          )}
                        </p>
                      </div>
                      
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-blue-900 font-black text-xl bg-blue-50 px-4 py-3 rounded-2xl inline-block shadow-sm border border-blue-100 group-hover:bg-blue-100 transition-colors">
                          {session.duration} <span className="text-sm font-bold text-blue-700">min</span>
                        </span>
                      </div>
                      
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-16 flex flex-col items-center justify-center text-center h-full min-h-[300px] border-2 border-dashed border-slate-100 m-4 rounded-2xl">
                  <div className="bg-slate-100 p-4 rounded-full text-slate-400 mb-4">
                    <Search size={32} />
                  </div>
                  <p className="text-lg font-bold text-slate-700 mb-2">No sessions found</p>
                  <p className="text-slate-500 font-medium">Try adjusting your search or filter to see more history.</p>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
