import React, { useState } from "react";
import { Link, useNavigate } from "react-router";
import { PlayCircle, Flame, Target, ChevronRight, Award, Search, CheckCircle, Users, UserPlus, Zap, Bell, X, BookOpen } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "sonner";
import { getRandomQuote } from "../utils/quotes";

export const Home = () => {
  const { 
    user, sessions, streak, longestStreak, weeklyGoal, weeklyProgress, 
    buddies, pendingInvites, addBuddy, acceptBuddy, denyBuddy, removeBuddy,
    pendingSessionInvites, acceptSession, denySession 
  } = useAppContext();
  const navigate = useNavigate();

  const [buddyEmail, setBuddyEmail] = useState("");
  const [showBuddyInput, setShowBuddyInput] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [motivationQuote, setMotivationQuote] = useState("");
  const [sessionFilter, setSessionFilter] = useState<"all"|"solo"|"buddy"|"group">("all");

  React.useEffect(() => {
    setMotivationQuote(getRandomQuote("solo_success"));
  }, []);

  const handleAddBuddy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (buddyEmail && buddyEmail.includes("@")) {
      await addBuddy(buddyEmail);
      
      toast.success(`Invite sent to ${buddyEmail}! They'll be notified in the app.`);
      
      setBuddyEmail("");
      setShowBuddyInput(false);
    }
  };

  const plannedSessions = sessions.filter((s) => s.status === "planned" || s.status === "pending" || s.status === "ready");
  const completedSessions = sessions.filter((s) => s.status === "completed");
  
  const upcomingSessions = plannedSessions.sort((a, b) => {
    return new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime();
  });

  const filteredUpcomingSessions = upcomingSessions.filter(s => {
    if (sessionFilter === "all") return true;
    return s.type === sessionFilter;
  });

  const recentActivity = completedSessions
    .sort((a, b) => new Date(b.completedAt || "").getTime() - new Date(a.completedAt || "").getTime())
    .slice(0, 3);

  const progressPercent = Math.min(100, Math.round((weeklyProgress / weeklyGoal) * 100));

  return (
    <div className="bg-slate-50 min-h-full pb-12 w-full max-w-7xl mx-auto">
      {/* Desktop Header Banner */}
      <div className="bg-blue-900 text-white rounded-b-[2rem] py-10 px-8 shadow-md relative flex flex-col md:flex-row justify-between items-start md:items-center">
        
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[2rem]">
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 right-1/4 w-32 h-32 bg-blue-500 rounded-full mix-blend-screen filter blur-3xl opacity-30"></div>
        </div>

        <div className="relative z-10 mb-6 md:mb-0">
          <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Welcome back, {user?.split("@")[0] || "Student"}!</h1>
          <p className="text-blue-200 text-lg opacity-90">Ready to crush your academic goals today?</p>
        </div>
        
        <div className="relative z-10 flex gap-4 w-full md:w-auto items-center">
          
          {/* Notifications Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="bg-white/10 hover:bg-white/20 p-3 rounded-xl border border-white/20 shadow-xl backdrop-blur-md transition-all text-white relative flex items-center justify-center"
            >
              <Bell size={24} />
              {(pendingInvites.length > 0 || pendingSessionInvites.length > 0) && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-orange-500 border border-white items-center justify-center text-[10px] font-bold">
                    {pendingInvites.length + pendingSessionInvites.length}
                  </span>
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute top-14 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50 text-slate-800 transform origin-top-right transition-all animate-in fade-in slide-in-from-top-2">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                  <h3 className="font-bold text-slate-800">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {pendingInvites.length > 0 || pendingSessionInvites.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      {pendingInvites.map((inviteEmail, idx) => (
                        <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                          <p className="text-sm text-slate-600 mb-3">
                            <span className="font-bold text-slate-900">{inviteEmail.split("@")[0]}</span> wants to be your accountability partner!
                          </p>
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                await acceptBuddy(inviteEmail);
                                if (pendingInvites.length === 1 && pendingSessionInvites.length === 0) setShowNotifications(false);
                              }}
                              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={async () => {
                                await denyBuddy(inviteEmail);
                                if (pendingInvites.length === 1 && pendingSessionInvites.length === 0) setShowNotifications(false);
                              }}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                      {pendingSessionInvites.map((invite, idx) => (
                        <div key={`session-${idx}`} className="p-4 hover:bg-slate-50 transition-colors">
                          <p className="text-sm text-slate-600 mb-3">
                            <span className="font-bold text-slate-900">{invite.inviter.split("@")[0]}</span> invited you to a <span className="font-bold text-blue-900">{invite.session.type}</span> session for {invite.session.course}: {invite.session.topic}
                          </p>
                          <div className="flex gap-2 text-xs text-slate-500 mb-3">
                            <span className="bg-slate-100 px-2 py-1 rounded">{invite.session.date}</span>
                            <span className="bg-slate-100 px-2 py-1 rounded">{invite.session.time}</span>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={async () => {
                                await acceptSession(invite.inviter, invite.session);
                                if (pendingInvites.length === 0 && pendingSessionInvites.length === 1) setShowNotifications(false);
                              }}
                              className="flex-1 bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                              Accept
                            </button>
                            <button 
                              onClick={async () => {
                                const reason = prompt("Optional: Provide a reason for declining (this helps adjust the group threshold)");
                                // Use prompt for deny reason? Wait, let's create a custom modal or just pass it directly if we modify denySession. 
                                // Let's check denySession signature.
                                await denySession(invite.inviter, invite.session, reason || undefined);
                                if (pendingInvites.length === 0 && pendingSessionInvites.length === 1) setShowNotifications(false);
                              }}
                              className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2 rounded-lg transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-slate-500 text-sm">
                      <Bell className="mx-auto mb-2 opacity-20" size={32} />
                      No new notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 md:flex-none flex items-center bg-white/10 rounded-2xl p-4 backdrop-blur-md border border-white/20 shadow-xl min-w-[180px]">
            <div className="bg-orange-500 p-3 rounded-xl text-white mr-4 shadow-lg shadow-orange-500/30">
              <Flame size={28} />
            </div>
            <div>
              <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-0.5">Current Streak</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-black text-white">{streak}</p>
                <span className="text-sm font-medium text-blue-200">Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column (Main Focus) */}
        <div className="lg:col-span-2 space-y-8 w-full max-w-3xl">
          
          {/* Up Next Card */}
          <section aria-labelledby="next-session-title">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end mb-4 gap-3">
              <h2 id="next-session-title" className="text-xl font-bold text-slate-800 tracking-tight">
                Upcoming Sessions
              </h2>
              <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                <div className="flex bg-slate-200 p-1 rounded-xl mr-4">
                  {(['all', 'solo', 'buddy', 'group'] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setSessionFilter(f)}
                      className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-colors ${sessionFilter === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
                <Link to="/commit" className="text-sm text-blue-700 font-bold hover:text-orange-500 transition-colors whitespace-nowrap">
                  Plan more +
                </Link>
              </div>
            </div>
            
            {filteredUpcomingSessions.length > 0 ? (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-100 relative overflow-hidden flex flex-col max-h-[400px]">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-50 to-white rounded-bl-[4rem] -z-10"></div>
                <div className="overflow-y-auto p-4 divide-y divide-slate-100 flex-1 custom-scrollbar">
                  {filteredUpcomingSessions.map((session, idx) => (
                    <div key={session.id} className={`p-4 group hover:bg-slate-50 transition-colors rounded-2xl ${idx === 0 ? 'bg-orange-50/30' : ''}`}>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                          <span className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-800 text-[10px] font-bold rounded-lg mb-2 tracking-wide uppercase shadow-sm border border-blue-100">
                            {session.course}
                            {session.type !== 'solo' && (
                              <span className="ml-2 pl-2 border-l border-blue-200 flex items-center text-orange-600">
                                <Users size={12} className="mr-1" /> {session.type}
                              </span>
                            )}
                            {session.status === 'pending' && (
                              <span className="ml-2 pl-2 border-l border-blue-200 flex items-center text-slate-500">
                                Pending
                              </span>
                            )}
                            {session.status === 'ready' && (
                              <span className="ml-2 pl-2 border-l border-blue-200 flex items-center text-green-600">
                                Ready
                              </span>
                            )}
                          </span>
                          <h3 className="font-extrabold text-xl text-slate-900 mb-1">{session.topic}</h3>
                          <p className="text-slate-500 font-medium text-sm flex items-center">
                            {new Date(session.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {session.time}
                          </p>
                        </div>
                        <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                          <span className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg shadow-sm border border-orange-100">
                            {session.duration} min
                          </span>
                          {idx === 0 && session.status !== 'pending' && (
                            <button 
                              onClick={() => navigate('/checkin')}
                              className="bg-blue-900 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center transition-all shadow-md shadow-blue-900/20 active:scale-[0.99] text-sm"
                            >
                              <PlayCircle className="mr-2" size={18} />
                              Start
                            </button>
                          )}
                          {idx === 0 && session.status === 'pending' && (
                            <button 
                              disabled
                              className="bg-slate-200 text-slate-500 font-bold py-2 px-4 rounded-xl flex items-center justify-center text-sm cursor-not-allowed"
                            >
                              <Users className="mr-2" size={18} />
                              Waiting...
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 shadow-sm border-2 border-dashed border-slate-200 text-center flex flex-col items-center">
                <div className="bg-slate-100 p-4 rounded-full text-slate-400 mb-4">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">No upcoming sessions</h3>
                <p className="text-slate-500 mb-6 max-w-sm">Your schedule is clear. Plan ahead to ensure you hit your weekly learning goals.</p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link 
                    to="/commit"
                    className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
                  >
                    Schedule Session
                  </Link>
                  <Link 
                    to="/checkin"
                    className="inline-block bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 px-8 rounded-xl transition-all active:scale-[0.98]"
                  >
                    Quick Timer
                  </Link>
                </div>
              </div>
            )}
          </section>

          {/* Quick Access Study Tools */}
          <section className="mb-4">
            <button 
              onClick={() => navigate('/tools')}
              className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:border-blue-300 rounded-3xl transition-all shadow-sm group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 text-white p-3 rounded-2xl shadow-inner group-hover:scale-105 transition-transform">
                  <BookOpen size={24} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-slate-800 text-lg">Study Tools Library</h3>
                  <p className="text-slate-500 text-sm">Flashcards, Quiz Mode, Study Guides & more</p>
                </div>
              </div>
              <ChevronRight className="text-blue-400 group-hover:text-blue-600 transition-colors" />
            </button>
          </section>

          {/* Social Accountability / Buddies Card */}
          <section aria-labelledby="buddies-title">
            <div className="flex justify-between items-end mb-4">
              <h2 id="buddies-title" className="text-xl font-bold text-slate-800 tracking-tight flex items-center">
                <Users className="text-blue-900 mr-2" size={24} /> Accountability Partners
              </h2>
              <button 
                onClick={() => setShowBuddyInput(!showBuddyInput)}
                className="text-sm text-blue-700 font-bold hover:text-orange-500 transition-colors flex items-center"
              >
                <UserPlus size={16} className="mr-1" /> Add Buddy
              </button>
            </div>

            {showBuddyInput && (
              <form onSubmit={handleAddBuddy} className="bg-white p-4 rounded-2xl shadow-sm border border-blue-200 mb-4 flex gap-3 animate-in fade-in slide-in-from-top-2">
                <input
                  type="email"
                  placeholder="buddy@email.com"
                  value={buddyEmail}
                  onChange={(e) => setBuddyEmail(e.target.value)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
                <button type="submit" className="bg-blue-900 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                  Send Invite
                </button>
              </form>
            )}

            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden">
              {buddies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {buddies.map((buddy, idx) => (
                    <div key={idx} className="flex items-center p-4 border border-slate-100 rounded-2xl bg-slate-50 hover:bg-slate-100 transition-colors group relative">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-lg shadow-sm border border-blue-200 mr-4 shrink-0">
                        {buddy.email.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 truncate text-sm">{buddy.email.split("@")[0]}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-md flex items-center">
                            <Flame size={12} className="mr-0.5" /> {buddy.streak} Day Streak
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to remove ${buddy.email} from your buddies?`)) {
                            removeBuddy(buddy.email);
                          }
                        }}
                        className="absolute top-2 right-2 p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                        title="Remove Buddy"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <UserPlus size={24} />
                  </div>
                  <p className="text-slate-800 font-bold mb-1">Study better together</p>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">Add classmates to view their streaks and schedule group study sessions.</p>
                </div>
              )}
            </div>
          </section>

          {/* Weekly Goal Card */}
          <section aria-labelledby="weekly-goal-title">
            <h2 id="weekly-goal-title" className="text-xl font-bold text-slate-800 mb-4 flex items-center tracking-tight">
              <Target className="text-blue-900 mr-3" size={24} />
              Weekly Goal
            </h2>
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Progress</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-blue-900">{weeklyProgress}</span>
                    <span className="text-lg font-bold text-slate-400">/ {weeklyGoal} min</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-orange-500 bg-orange-50 px-3 py-1 rounded-lg">
                    {progressPercent}%
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-slate-100 rounded-full h-4 mb-4 overflow-hidden shadow-inner relative">
                <div 
                  className="absolute top-0 left-0 bg-gradient-to-r from-orange-400 to-orange-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </section>

        </div>

        {/* Right Column (Sidebar content on Desktop) */}
        <div className="lg:col-span-1">
          <section aria-labelledby="recent-activity-title" className="sticky top-8">
            <div className="flex justify-between items-end mb-4">
              <h2 id="recent-activity-title" className="text-xl font-bold text-slate-800 tracking-tight">Recent Activity</h2>
              <Link to="/progress" className="text-sm text-blue-700 font-bold hover:text-orange-500 transition-colors flex items-center">
                View all <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              {recentActivity.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentActivity.map((session) => (
                    <div key={session.id} className="p-5 hover:bg-slate-50 transition-colors group">
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
                          {session.type !== 'solo' && <Users size={12} className="mr-1" />}
                          {new Date(session.completedAt || "").toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-blue-700 font-extrabold text-sm bg-blue-50 px-2.5 py-1 rounded-md border border-blue-100 group-hover:bg-blue-100 transition-colors">
                          +{session.duration} min
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-800 text-base leading-tight mb-1">{session.course}</h3>
                      <p className="text-sm text-slate-500 font-medium truncate">{session.topic}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Zap className="text-slate-300 mx-auto mb-3" size={32} />
                  <p className="text-base font-medium text-slate-500">No recent activity.</p>
                </div>
              )}
            </div>
            
            {/* Motivation card */}
            <div className="mt-6 bg-gradient-to-br from-blue-900 to-blue-800 rounded-3xl p-6 text-white shadow-md relative overflow-hidden">
              <Award className="absolute -bottom-4 -right-4 text-blue-700 opacity-50" size={100} />
              <div className="relative z-10">
                <h3 className="font-bold text-lg mb-2 text-orange-400">Personal Best</h3>
                <p className="text-blue-100 text-sm mb-4">Your longest learning streak is <strong className="text-white text-lg">{Math.max(streak, longestStreak)} Days</strong>.</p>
                <p className="text-xs text-blue-200 font-medium italic">"{motivationQuote || 'Keep maintaining your daily habit to break your record!'}"</p>
              </div>
            </div>

          </section>
        </div>
        
      </div>
    </div>
  );
};
