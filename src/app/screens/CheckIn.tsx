import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Play, CheckCircle, XCircle, Clock, Pause, ShieldCheck, HelpCircle, BookOpen, PlusCircle } from "lucide-react";
import { useAppContext } from "../context/AppContext";

import { getRandomQuote } from "../utils/quotes";

export const CheckIn = () => {
  const { sessions, updateSessionStatus, addSession } = useAppContext();
  const navigate = useNavigate();

  // Get the most imminent planned session
  const activeSession = sessions
    .filter((s) => s.status === "planned" || s.status === "pending" || s.status === "ready" || s.status === "active")
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0];

  const [localTimeLeft, setLocalTimeLeft] = useState(0);

  // Sync local timer with active session state
  useEffect(() => {
    if (!activeSession) return;
    
    // Initialize session timer data if missing
    if (activeSession.timeLeft === undefined) {
      updateSessionStatus(activeSession.id, activeSession.status, {
        timeLeft: activeSession.duration * 60,
        timerIsActive: false
      });
      setLocalTimeLeft(activeSession.duration * 60);
      return;
    }

    if (activeSession.timerIsActive && activeSession.timerStartedAt) {
      const elapsed = Math.floor((Date.now() - activeSession.timerStartedAt) / 1000);
      const current = Math.max(0, activeSession.timeLeft - elapsed);
      setLocalTimeLeft(current);
    } else {
      setLocalTimeLeft(activeSession.timeLeft);
    }
  }, [activeSession]);

  // Handle ticking locally if active
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (activeSession?.timerIsActive && activeSession.timerStartedAt) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeSession.timerStartedAt!) / 1000);
        const current = Math.max(0, activeSession.timeLeft! - elapsed);
        
        setLocalTimeLeft((prev) => {
          if (current <= 0 && prev > 0) {
            setTimeout(() => handleComplete(), 0);
          }
          return current;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession?.timerIsActive, activeSession?.timerStartedAt, activeSession?.timeLeft, activeSession?.id]);

  const handleAddTime = (mins: number) => {
    if (activeSession) {
      const addedSeconds = mins * 60;
      
      // We also need to update the session's duration so the progress circle doesn't break
      // Since duration is in minutes, we can add the mins to the duration.
      
      const newDuration = activeSession.duration + mins;
      
      setLocalTimeLeft(prev => prev + addedSeconds);
      
      updateSessionStatus(activeSession.id, activeSession.status, {
        duration: newDuration,
        timeLeft: activeSession.timeLeft! + addedSeconds,
      });
    }
  };

  const handleStart = () => {
    if (activeSession) {
      updateSessionStatus(activeSession.id, "active", {
        timerIsActive: true,
        timerStartedAt: Date.now(),
        timeLeft: localTimeLeft,
      });
    }
  };

  const handlePause = () => {
    if (activeSession) {
      let finalTimeLeft = localTimeLeft;
      if (activeSession.timerIsActive && activeSession.timerStartedAt) {
        const elapsed = Math.floor((Date.now() - activeSession.timerStartedAt) / 1000);
        finalTimeLeft = Math.max(0, activeSession.timeLeft! - elapsed);
      }
      updateSessionStatus(activeSession.id, "active", {
        timerIsActive: false,
        timeLeft: finalTimeLeft,
        timerStartedAt: null
      });
    }
  };

  const handleComplete = () => {
    if (activeSession) {
      let finalTimeLeft = localTimeLeft;
      if (activeSession.timerIsActive && activeSession.timerStartedAt) {
        const elapsed = Math.floor((Date.now() - activeSession.timerStartedAt) / 1000);
        finalTimeLeft = Math.max(0, activeSession.timeLeft! - elapsed);
      }
      
      const actualDuration = Math.ceil((activeSession.duration * 60 - finalTimeLeft) / 60);
      const sessionDuration = actualDuration > 0 ? actualDuration : 1;
      updateSessionStatus(activeSession.id, "completed", { duration: sessionDuration });
      const isGroup = activeSession.type === "buddy" || activeSession.type === "group";
      const quote = getRandomQuote(isGroup ? "group_success" : "solo_success");
      navigate("/progress", { state: { completedMessage: quote, sessionDuration } });
    }
  };

  const handleMissed = () => {
    if (activeSession) {
      const quote = getRandomQuote("missed_goal");
      // Pass ID in state to recover screen to update it later
      navigate("/recover", { state: { sessionId: activeSession.id, recoveryMessage: quote } });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleSimulateJoin = () => {
    if (activeSession && activeSession.status === "pending") {
      const currentJoined = activeSession.joinedParticipants || [];
      const required = activeSession.requiredParticipants || 2;
      const newJoined = [...currentJoined, `Participant ${currentJoined.length + 1}`];
      
      const isReady = newJoined.length >= required;
      updateSessionStatus(activeSession.id, isReady ? "ready" : "pending", {
        joinedParticipants: newJoined,
      });
    }
  };

  const handleSimulateDecline = () => {
    if (activeSession && activeSession.status === "pending") {
      const currentJoined = activeSession.joinedParticipants || [];
      const required = activeSession.requiredParticipants || 2;
      
      if (required > 1) {
        const newRequired = required - 1;
        const isReady = currentJoined.length >= newRequired;
        updateSessionStatus(activeSession.id, isReady ? "ready" : "pending", {
          requiredParticipants: newRequired
        });
      }
    }
  };

  const handleQuickStart = (mins: number) => {
    const now = new Date();
    const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    addSession({
      course: "Quick Session",
      topic: "Focus Timer",
      date: dateString,
      time: timeString,
      duration: mins,
      type: "solo",
      status: "active",
      timeLeft: mins * 60,
      timerIsActive: true,
      timerStartedAt: Date.now()
    });
  };

  if (!activeSession) {
    return (
      <div className="flex flex-col min-h-screen justify-center items-center bg-slate-50 p-8 w-full max-w-7xl mx-auto">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-10"></div>
          <div className="bg-green-100 text-green-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <CheckCircle size={48} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">You're all caught up!</h2>
          <p className="text-slate-500 font-medium mb-10 text-lg leading-relaxed">No planned sessions found. Take a well-deserved break or plan your next deep work block.</p>
          <button
            onClick={() => navigate("/commit")}
            className="w-full bg-blue-900 text-white font-bold py-4 px-6 rounded-xl transition-colors hover:bg-blue-800 shadow-lg active:scale-[0.98] text-lg mb-6"
          >
            Plan a Session
          </button>
          
          <div className="pt-6 border-t border-slate-100">
            <p className="text-slate-500 font-bold mb-4 uppercase tracking-wider text-xs flex items-center justify-center gap-2">
              <Clock size={14} /> Quick Start Timer
            </p>
            <div className="grid grid-cols-3 gap-3">
              <button onClick={() => handleQuickStart(5)} className="bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold py-3 px-2 rounded-xl transition-all active:scale-[0.95]">
                5 min
              </button>
              <button onClick={() => handleQuickStart(10)} className="bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold py-3 px-2 rounded-xl transition-all active:scale-[0.95]">
                10 min
              </button>
              <button onClick={() => handleQuickStart(15)} className="bg-white border-2 border-orange-200 text-orange-600 hover:bg-orange-50 font-bold py-3 px-2 rounded-xl transition-all active:scale-[0.95]">
                15 min
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const progressPercent = ((activeSession.duration * 60 - localTimeLeft) / (activeSession.duration * 60)) * 100;

  if (activeSession.status === "pending") {
    const joined = activeSession.joinedParticipants || [];
    const required = activeSession.requiredParticipants || 2;
    
    return (
      <div className="flex flex-col min-h-screen justify-center items-center bg-slate-50 p-8 w-full max-w-7xl mx-auto">
        <div className="bg-white p-12 rounded-3xl shadow-xl border border-slate-100 max-w-lg w-full text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10"></div>
          <div className="bg-blue-100 text-blue-500 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
            <Clock size={48} />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-4 tracking-tight">Waiting for Others...</h2>
          <p className="text-slate-500 font-medium mb-8 text-lg leading-relaxed">
            Your {activeSession.type} session is waiting for everyone to join before it can begin.
          </p>
          
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold text-slate-700">Joined</span>
              <span className="text-blue-600 font-bold bg-blue-100 px-3 py-1 rounded-full text-sm">
                {joined.length} / {required}
              </span>
            </div>
            
            <div className="w-full bg-slate-200 rounded-full h-3 mb-6 overflow-hidden">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500" 
                style={{ width: `${(joined.length / required) * 100}%` }}
              ></div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {joined.map((p, i) => (
                <span key={i} className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg shadow-sm">
                  <CheckCircle size={14} className="mr-2 text-green-500" />
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <button
              onClick={handleSimulateJoin}
              className="w-full bg-orange-500 text-white font-bold py-4 px-6 rounded-xl transition-colors hover:bg-orange-600 shadow-lg active:scale-[0.98] text-lg"
            >
              Simulate Participant Joining
            </button>
            <button
              onClick={handleSimulateDecline}
              className="w-full bg-slate-100 text-slate-700 font-bold py-3 px-6 rounded-xl transition-colors hover:bg-slate-200 active:scale-[0.98] text-base"
            >
              Participant Can't Make It
            </button>
            <button
              onClick={() => navigate("/home")}
              className="w-full bg-white text-slate-500 border border-slate-200 font-bold py-4 px-6 rounded-xl transition-colors hover:bg-slate-50 active:scale-[0.98] text-lg"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen w-full max-w-7xl mx-auto pb-12 flex flex-col">
      
      {/* Header section */}
      <div className="bg-blue-900 text-white rounded-b-[2rem] py-10 px-8 shadow-md relative overflow-hidden mb-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="text-orange-400" size={20} />
              <h1 className="text-sm font-bold tracking-widest uppercase text-blue-200">
                {activeSession.timerIsActive ? "Active Session" : "Ready to Check-in"}
              </h1>
            </div>
            <h2 className="text-4xl font-extrabold mb-2 tracking-tight">{activeSession.course}</h2>
            <p className="text-blue-100 text-xl font-medium opacity-90">{activeSession.topic}</p>
          </div>
          <div className="bg-blue-800/50 backdrop-blur-sm border border-blue-700 p-4 rounded-2xl flex items-center gap-4 shadow-inner">
            <Clock className="text-orange-400" size={32} />
            <div>
              <p className="text-xs text-blue-200 font-bold uppercase tracking-wider">Scheduled for</p>
              <p className="text-xl font-bold">{activeSession.time} <span className="text-sm font-normal text-blue-200">({activeSession.duration}m)</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-8 lg:px-10 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-white rounded-[2.5rem] p-10 shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-12 relative overflow-hidden">
          
          {/* Timer Circle Side */}
          <div className="flex-1 flex justify-center items-center w-full">
            <div className="relative w-64 h-64 md:w-80 md:h-80 flex justify-center items-center">
              <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90 drop-shadow-sm" viewBox="0 0 100 100">
                {/* Background track */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="6"
                />
                {/* Progress track */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  fill="transparent"
                  stroke={activeSession.timerIsActive ? "#f97316" : "#1e3a8a"} // orange or blue-900
                  strokeWidth="6"
                  strokeDasharray={`${2 * Math.PI * 46}`}
                  strokeDashoffset={`${2 * Math.PI * 46 * (1 - progressPercent / 100)}`}
                  className="transition-all duration-1000 ease-linear"
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center absolute z-10 flex flex-col items-center justify-center">
                <span className={`text-6xl md:text-7xl font-black tabular-nums tracking-tighter block mb-2 transition-colors ${activeSession.timerIsActive ? 'text-slate-800' : 'text-slate-400'}`}>
                  {formatTime(localTimeLeft)}
                </span>
                <span className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center bg-slate-50 px-3 py-1 rounded-full">
                  {activeSession.timerIsActive ? "Remaining" : "Target"}
                </span>
              </div>
            </div>
          </div>

          {/* Controls Side */}
          <div className="flex-1 w-full flex flex-col justify-center space-y-6">
            
            <div className="w-full">
              {!activeSession.timerIsActive ? (
                <button
                  onClick={handleStart}
                  className="flex items-center justify-center space-x-3 bg-blue-900 hover:bg-blue-800 text-white font-bold py-5 px-8 rounded-2xl transition-all w-full shadow-lg shadow-blue-900/30 text-xl group active:scale-[0.98]"
                >
                  <Play size={24} className="fill-current group-hover:scale-110 transition-transform" />
                  <span>Start Session</span>
                </button>
              ) : (
                <button
                  onClick={handlePause}
                  className="flex items-center justify-center space-x-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-5 px-8 rounded-2xl transition-all w-full text-xl shadow-inner active:scale-[0.98]"
                >
                  <Pause size={24} className="fill-current" />
                  <span>Pause Timer</span>
                </button>
              )}
            </div>

            <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-sm">
              <h3 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3 text-center flex items-center justify-center gap-1">
                <PlusCircle size={14} /> Add Time
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button onClick={() => handleAddTime(5)} className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-2 rounded-xl transition-all text-sm">+5m</button>
                <button onClick={() => handleAddTime(10)} className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-2 rounded-xl transition-all text-sm">+10m</button>
                <button onClick={() => handleAddTime(15)} className="bg-orange-50 hover:bg-orange-100 text-orange-700 font-bold py-2 rounded-xl transition-all text-sm">+15m</button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 text-center">Session Actions</h3>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => navigate("/tools")}
                  className="flex flex-col items-center text-center justify-center p-4 bg-white border border-blue-200 text-blue-700 rounded-xl hover:bg-blue-50 transition-colors shadow-sm group"
                >
                  <BookOpen size={28} className="mb-2 text-blue-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Study Tools</span>
                </button>
                <button
                  onClick={handleComplete}
                  className="flex flex-col items-center text-center justify-center p-4 bg-white border border-green-200 text-green-700 rounded-xl hover:bg-green-50 transition-colors shadow-sm group"
                >
                  <CheckCircle size={28} className="mb-2 text-green-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Finish Early</span>
                </button>
                <button
                  onClick={handleMissed}
                  className="flex flex-col items-center text-center justify-center p-4 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors shadow-sm group"
                >
                  <XCircle size={28} className="mb-2 text-red-500 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold">Cancel / Missed</span>
                </button>
              </div>
            </div>

            <div className="flex items-start text-slate-500 text-sm">
              <HelpCircle className="mr-2 shrink-0 mt-0.5" size={16} />
              <p className="font-medium italic">"Focus on the step in front of you, not the whole staircase."</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
