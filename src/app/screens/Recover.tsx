import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { HeartHandshake, AlertCircle, RefreshCw, X } from "lucide-react";
import { useAppContext } from "../context/AppContext";

export const Recover = () => {
  const { updateSessionStatus } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const sessionId = location.state?.sessionId as string | undefined;

  const [reason, setReason] = useState("");
  const [reschedule, setReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  const handleConfirm = () => {
    if (sessionId) {
      if (reschedule && newDate && newTime) {
        updateSessionStatus(sessionId, "planned", { rescheduled: true, date: newDate, time: newTime });
      } else {
        updateSessionStatus(sessionId, "missed", { reason });
      }
    }
    navigate("/home");
  };

  const reasons = [
    { id: "forgot", label: "I forgot" },
    { id: "distracted", label: "Got distracted" },
    { id: "tired", label: "Too tired" },
    { id: "conflict", label: "Schedule conflict" },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 p-8 lg:p-12 w-full max-w-7xl mx-auto">
      
      <div className="flex justify-end mb-8">
        <button 
          onClick={() => navigate("/home")}
          className="p-3 bg-white rounded-full shadow-sm text-slate-400 hover:text-slate-800 transition-colors border border-slate-200"
          aria-label="Close"
        >
          <X size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col justify-center items-center w-full">
        <div className="bg-white rounded-[2.5rem] p-10 lg:p-12 shadow-xl border border-slate-100 max-w-2xl w-full relative overflow-hidden">
          
          {/* Decorative background circle */}
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-orange-50 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
          
          <div className="text-center mb-10 relative z-10">
            <div className="bg-orange-100 text-orange-500 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm transform -rotate-6">
              <HeartHandshake size={40} className="transform rotate-6" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">It happens to everyone.</h1>
            <p className="text-slate-500 text-lg leading-relaxed max-w-md mx-auto italic font-medium">
              "{location.state?.recoveryMessage || "Missing a session doesn't define your progress. Acknowledging it is the first step to getting back on track."}"
            </p>
          </div>

          <div className="space-y-8 relative z-10">
            {/* Reason Selection */}
            <section aria-labelledby="reason-title">
              <h2 id="reason-title" className="text-base font-bold text-slate-700 mb-4 flex items-center tracking-tight">
                <AlertCircle size={20} className="text-blue-900 mr-2" />
                What happened? <span className="text-slate-400 font-normal ml-2">(Optional)</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {reasons.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setReason(r.id)}
                    className={`p-4 rounded-2xl border-2 text-base font-bold transition-all shadow-sm ${
                      reason === r.id
                        ? "border-blue-900 bg-blue-50 text-blue-900"
                        : "border-slate-100 bg-white text-slate-500 hover:border-blue-200 hover:bg-slate-50"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Reschedule Toggle */}
            <div className="pt-6 border-t border-slate-100">
              <label className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors shadow-sm">
                <div className="flex items-center">
                  <RefreshCw size={24} className="text-blue-900 mr-4" />
                  <span className="font-bold text-slate-800 text-lg">Reschedule Session</span>
                </div>
                <div className="relative inline-block w-14 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    name="toggle" 
                    id="toggle" 
                    checked={reschedule}
                    onChange={() => setReschedule(!reschedule)}
                    className="toggle-checkbox absolute block w-7 h-7 rounded-full bg-white border-4 appearance-none cursor-pointer outline-none shadow-sm"
                    style={{ 
                      right: reschedule ? 0 : '1.75rem', 
                      borderColor: reschedule ? '#1e3a8a' : '#cbd5e1',
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                  />
                  <label 
                    htmlFor="toggle" 
                    className="toggle-label block overflow-hidden h-7 rounded-full bg-slate-300 cursor-pointer shadow-inner"
                    style={{ backgroundColor: reschedule ? '#1e3a8a' : '#e2e8f0', transition: 'background-color 0.3s' }}
                  ></label>
                </div>
              </label>
            </div>

            {/* Reschedule Form */}
            {reschedule && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="newDate">New Date</label>
                  <input
                    id="newDate"
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-medium shadow-sm hover:border-blue-300 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2" htmlFor="newTime">New Time</label>
                  <input
                    id="newTime"
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-medium shadow-sm hover:border-blue-300 transition-colors"
                  />
                </div>
              </div>
            )}

            <div className="pt-8 border-t border-slate-100">
              <button
                onClick={handleConfirm}
                disabled={reschedule && (!newDate || !newTime)}
                className="w-full bg-blue-900 hover:bg-blue-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-5 px-6 rounded-2xl transition-all shadow-lg shadow-blue-900/20 active:scale-[0.98] text-xl flex justify-center items-center group"
              >
                {reschedule ? (
                  <>Save New Time <RefreshCw className="ml-3 group-hover:rotate-180 transition-transform duration-500" size={20} /></>
                ) : (
                  "Acknowledge & Move On"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
