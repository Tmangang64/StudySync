import React, { useState } from "react";
import { useNavigate } from "react-router";
import { 
  Calendar as CalendarIcon, Clock, Book, User, Users, AlignLeft, Info, 
  ChevronLeft, ChevronRight, UserPlus, X, Mail
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { toast } from "sonner";

export const Commit = () => {
  const { addSession, inviteToSession, user, buddies } = useAppContext();
  const navigate = useNavigate();

  const [course, setCourse] = useState("");
  const [topic, setTopic] = useState("");
  
  // Date & Time Selection
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewDate, setViewDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState("");
  const [duration, setDuration] = useState(60);
  
  // Session Type & Invites
  const [type, setType] = useState<"solo" | "buddy" | "group">("solo");
  const [inviteEmail, setInviteEmail] = useState("");
  const [invites, setInvites] = useState<string[]>([]);
  const [groupSize, setGroupSize] = useState("3");

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mini Calendar Logic
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };
  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const currentMonth = viewDate.getMonth();
  const currentYear = viewDate.getFullYear();
  const daysInMonth = getDaysInMonth(viewDate);
  const firstDay = getFirstDayOfMonth(viewDate);
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const handlePrevMonth = () => {
    setViewDate(new Date(currentYear, currentMonth - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(new Date(currentYear, currentMonth + 1, 1));
  };

  // Time Slots (Outlook style)
  const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", 
    "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30",
    "20:00"
  ];

  const handleAddInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (type === "group" && invites.length >= parseInt(groupSize) - 1) {
      setErrors({ ...errors, invites: "Group limit reached. Remove a member before adding another." });
      return;
    }
    if (inviteEmail && !invites.includes(inviteEmail) && inviteEmail.includes("@")) {
      setInvites([...invites, inviteEmail]);
      setInviteEmail("");
      setErrors({ ...errors, invites: "" });
    }
  };

  const handleRemoveInvite = (email: string) => {
    setInvites(invites.filter(e => e !== email));
    setErrors({ ...errors, invites: "" });
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!course) newErrors.course = "Course is required";
    if (!topic) newErrors.topic = "Topic is required";
    if (!selectedDate) newErrors.date = "Date is required";
    if (!selectedTime) newErrors.time = "Time is required";
    if (type === "buddy" && invites.length !== 1) newErrors.invites = "A buddy session requires exactly 1 invite.";
    if (type === "group" && invites.length === 0) newErrors.invites = "A group session requires at least 1 invite.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const dateString = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      
      const newSession: any = { 
        course, 
        topic, 
        date: dateString, 
        time: selectedTime, 
        duration, 
        type: type 
      };
      
      if (type === "buddy" || type === "group") {
        newSession.requiredParticipants = type === "buddy" ? 2 : parseInt(groupSize);
        newSession.joinedParticipants = [user || 'Me']; // Use their actual email
        newSession.status = "pending";
      }

      const createdSession = addSession(newSession);

      if ((type === "buddy" || type === "group") && invites.length > 0) {
        inviteToSession(invites, createdSession);
        toast.success(`Session invites sent to: ${invites.join(", ")}`);
      }

      navigate("/home");
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen w-full max-w-7xl mx-auto pb-12">
      {/* Header section */}
      <div className="bg-blue-900 text-white rounded-b-[2rem] py-10 px-8 shadow-md mb-8 relative flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        {/* Background Decorative Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-b-[2rem]">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-800 rounded-full mix-blend-multiply filter blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-3xl font-extrabold mb-2 tracking-tight">Schedule a Session</h1>
            <p className="text-blue-200 text-lg opacity-90">Plan ahead, invite friends, and lock in your study goals.</p>
          </div>
        </div>
      </div>

      <div className="px-8 lg:px-10">
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden flex flex-col xl:flex-row">
          
          {/* LEFT SIDE: Scheduling (Calendar & Times) */}
          <div className="w-full xl:w-5/12 border-b xl:border-b-0 xl:border-r border-slate-100 bg-slate-50/50 p-8 md:p-10 flex flex-col sm:flex-row xl:flex-col gap-8">
            
            {/* Mini Calendar (Outlook Style) */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-slate-800 text-lg flex items-center">
                  <CalendarIcon className="mr-2 text-blue-900" size={20} />
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <div className="flex gap-2">
                  <button type="button" onClick={handlePrevMonth} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
                    <ChevronLeft size={20} />
                  </button>
                  <button type="button" onClick={handleNextMonth} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition-colors">
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1 text-center mb-2">
                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                  <div key={day} className="text-xs font-bold text-slate-400 py-1">{day}</div>
                ))}
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const isSelected = day === selectedDate.getDate() && currentMonth === selectedDate.getMonth() && currentYear === selectedDate.getFullYear();
                  const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth() && currentYear === new Date().getFullYear();
                  
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                      className={`h-10 w-full flex items-center justify-center rounded-full text-sm font-semibold transition-all ${
                        isSelected 
                          ? "bg-blue-900 text-white shadow-md shadow-blue-900/20" 
                          : isToday
                            ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                            : "text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slots */}
            <div className="flex-1 flex flex-col h-full">
              <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center">
                <Clock className="mr-2 text-blue-900" size={20} />
                Available Times
              </h3>
              <div className="grid grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {timeSlots.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-3 rounded-xl text-sm font-bold border transition-all text-center ${
                      selectedTime === time
                        ? "bg-orange-500 border-orange-500 text-white shadow-md shadow-orange-500/20"
                        : "bg-white border-slate-200 text-slate-600 hover:border-orange-300 hover:text-orange-600"
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {errors.time && <p className="text-red-500 text-xs font-bold mt-2">{errors.time}</p>}
            </div>
            
          </div>

          {/* RIGHT SIDE: Details & Invites */}
          <div className="w-full xl:w-7/12 p-8 md:p-10 space-y-8 flex flex-col">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Course */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center" htmlFor="course">
                  <Book size={18} className="text-blue-900 mr-2" />
                  Course Name
                </label>
                <input
                  id="course"
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border ${
                    errors.course ? "border-red-500 bg-red-50" : "border-slate-200"
                  } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400`}
                  placeholder="e.g. Computer Science"
                />
                {errors.course && <p className="text-red-500 text-xs font-bold mt-2">{errors.course}</p>}
              </div>

              {/* Topic */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center" htmlFor="topic">
                  <AlignLeft size={18} className="text-blue-900 mr-2" />
                  Topic Focus
                </label>
                <input
                  id="topic"
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className={`w-full px-4 py-3 bg-slate-50 border ${
                    errors.topic ? "border-red-500 bg-red-50" : "border-slate-200"
                  } rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium text-slate-800 placeholder-slate-400`}
                  placeholder="e.g. Binary Trees"
                />
                {errors.topic && <p className="text-red-500 text-xs font-bold mt-2">{errors.topic}</p>}
              </div>
            </div>

            {/* Type & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-8">
              {/* Type Toggle */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3" id="type-label">
                  Session Type
                </label>
                <div className="flex gap-2" role="radiogroup" aria-labelledby="type-label">
                  <button
                    type="button"
                    role="radio"
                    aria-checked={type === "solo"}
                    onClick={() => { setType("solo"); setInvites([]); }}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      type === "solo"
                        ? "border-blue-900 bg-blue-50 text-blue-900 shadow-inner"
                        : "border-slate-200 bg-white text-slate-500 hover:border-blue-200"
                    }`}
                  >
                    <User size={20} className="mb-1" />
                    <span className="font-bold text-xs">Solo</span>
                  </button>
                  
                  <button
                    type="button"
                    role="radio"
                    aria-checked={type === "buddy"}
                    onClick={() => { setType("buddy"); if (invites.length > 1) setInvites([invites[0]]); }}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      type === "buddy"
                        ? "border-orange-500 bg-orange-50 text-orange-700 shadow-inner"
                        : "border-slate-200 bg-white text-slate-500 hover:border-orange-200"
                    }`}
                  >
                    <UserPlus size={20} className="mb-1" />
                    <span className="font-bold text-xs">Buddy</span>
                  </button>

                  <button
                    type="button"
                    role="radio"
                    aria-checked={type === "group"}
                    onClick={() => setType("group")}
                    className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                      type === "group"
                        ? "border-purple-600 bg-purple-50 text-purple-700 shadow-inner"
                        : "border-slate-200 bg-white text-slate-500 hover:border-purple-200"
                    }`}
                  >
                    <Users size={20} className="mb-1" />
                    <span className="font-bold text-xs">Group</span>
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 flex items-center" htmlFor="duration">
                  <Clock size={18} className="text-blue-900 mr-2" />
                  Duration
                </label>
                <div className="relative">
                  <select
                    id="duration"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-4 py-3 h-[76px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-slate-800 appearance-none hover:border-slate-300"
                  >
                    <option value={5}>5 min (Micro)</option>
                    <option value={10}>10 min (Short)</option>
                    <option value={15}>15 min (Brief)</option>
                    <option value={30}>30 min (Quick)</option>
                    <option value={60}>60 min (Standard)</option>
                    <option value={90}>90 min (Extended)</option>
                    <option value={120}>120 min (Deep Work)</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Invites Section (Only visible for Buddy/Group) */}
            {(type === "buddy" || type === "group") && (
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-300">
                {type === "group" && (
                  <div className="mb-6">
                    <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                      <Users size={18} className="text-blue-900 mr-2" />
                      Number of Participants
                    </label>
                    <select
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium text-slate-800"
                    >
                      <option value="3">3 people</option>
                      <option value="4">4 people</option>
                      <option value="5">5 people</option>
                      <option value="6">6 people</option>
                      <option value="7">7 people</option>
                      <option value="8">8+ people</option>
                    </select>
                  </div>
                )}
                
                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center">
                  <Mail size={18} className="text-blue-900 mr-2" />
                  Invite {type === "buddy" ? "a Study Partner" : "Study Group Members"}
                </label>
                
                {buddies.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2 font-medium">Quick add from your buddies:</p>
                    <div className="flex flex-wrap gap-2">
                      {buddies
                        .filter(b => !invites.includes(b.email))
                        .map(buddy => (
                        <button
                          key={buddy.email}
                          type="button"
                          disabled={type === "buddy" && invites.length >= 1}
                          onClick={() => {
                            if (type === "buddy" && invites.length >= 1) return;
                            setInvites([...invites, buddy.email]);
                          }}
                          className="inline-flex items-center bg-blue-50 border border-blue-200 hover:bg-blue-100 hover:border-blue-300 rounded-full px-3 py-1.5 text-sm font-medium text-blue-900 shadow-sm transition-colors disabled:opacity-50 disabled:pointer-events-none"
                        >
                          <UserPlus size={14} className="mr-1.5 opacity-70" />
                          {buddy.email}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mb-4">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAddInvite(e); }}
                    disabled={type === "buddy" && invites.length >= 1}
                    className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:opacity-50 disabled:bg-slate-100"
                    placeholder={type === "buddy" && invites.length >= 1 ? "Buddy selected" : "Or type an email address manually..."}
                  />
                  <button
                    type="button"
                    onClick={handleAddInvite}
                    disabled={type === "buddy" && invites.length >= 1}
                    className="bg-blue-100 hover:bg-blue-200 text-blue-900 font-bold py-2 px-4 rounded-xl transition-colors disabled:opacity-50 text-sm"
                  >
                    Add
                  </button>
                </div>

                {invites.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {invites.map((email) => (
                      <span key={email} className="inline-flex items-center bg-white border border-slate-200 rounded-full px-3 py-1 text-sm font-medium text-slate-700 shadow-sm">
                        {email}
                        <button type="button" onClick={() => handleRemoveInvite(email)} className="ml-2 text-slate-400 hover:text-red-500 focus:outline-none">
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No members invited yet. They will receive an email reminder.</p>
                )}
                {errors.invites && <p className="text-red-500 text-xs font-bold mt-2">{errors.invites}</p>}
              </div>
            )}

            <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-1 w-full">
                <button
                  type="submit"
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-orange-500/30 text-lg flex justify-center items-center active:scale-[0.98]"
                >
                  Send Invitations & Schedule
                </button>
              </div>
              <div className="flex items-start text-sm font-medium text-slate-500 max-w-[200px]">
                <Info className="text-blue-500 mr-2 mt-0.5 shrink-0" size={16} />
                <span>You'll get an alert 15 minutes before this starts.</span>
              </div>
            </div>
            
          </div>
        </form>
      </div>
      
      {/* Styles for the custom scrollbar in the time picker */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}} />
    </div>
  );
};
