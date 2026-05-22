import React, { createContext, useContext, useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import confetti from "canvas-confetti";
import { toast } from "sonner";

export type SessionStatus = "planned" | "completed" | "missed" | "active" | "pending" | "ready";

export interface SavedNote {
  id: string;
  ownerId: string;
  title: string;
  course: string;
  category: string;
  tags: string[];
  fileName: string;
  fileType: string;
  rawText: string;
  createdAt: number;
  updatedAt: number;
  isDeleted: boolean;
  visibility: 'private' | 'shared';
  sharedSessionIds: string[];
  generatedFlashcards: any[];
  generatedQuizQuestions: any[];
  generatedStudyGuide: string;
  generatedReflectionPrompts: string;
}

export interface Session {
  id: string;
  course: string;
  topic: string;
  date: string;
  time: string;
  duration: number; // in minutes
  type: "solo" | "buddy" | "group";
  status: SessionStatus;
  completedAt?: string;
  missedReason?: string;
  requiredParticipants?: number;
  joinedParticipants?: string[];
  timerStartedAt?: number;
  timerIsActive?: boolean;
  timeLeft?: number;
  toolState?: any;
}

export interface BuddyData {
  email: string;
  streak: number;
  recentSession: Session | null;
}

export interface SessionInvite {
  inviter: string;
  session: Session;
}

interface AppContextType {
  user: string | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  sessions: Session[];
  addSession: (session: Omit<Session, "id" | "status"> & { id?: string, status?: SessionStatus, requiredParticipants?: number, joinedParticipants?: string[] }) => Session;
  updateSessionStatus: (id: string, status: SessionStatus, extra?: any) => void;
  deleteSession: (id: string) => void;
  notes: SavedNote[];
  addNote: (note: Omit<SavedNote, "id" | "createdAt" | "updatedAt" | "ownerId">) => SavedNote;
  updateNote: (id: string, updates: Partial<SavedNote>) => void;
  deleteNote: (id: string, soft?: boolean) => void;
  streak: number;
  longestStreak: number;
  totalSessions: number;
  weeklyGoal: number;
  weeklyProgress: number;
  buddies: BuddyData[];
  pendingInvites: string[];
  addBuddy: (email: string) => Promise<void>;
  acceptBuddy: (email: string) => Promise<void>;
  denyBuddy: (email: string) => Promise<void>;
  removeBuddy: (email: string) => Promise<void>;
  pendingSessionInvites: SessionInvite[];
  inviteToSession: (emails: string[], session: Session) => Promise<void>;
  acceptSession: (inviter: string, session: Session) => Promise<void>;
  denySession: (inviter: string, session: Session, reason?: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const supabaseUrl = `https://${projectId}.supabase.co`;
const supabase = createClient(supabaseUrl, publicAnonKey);
const serverUrl = `${supabaseUrl}/functions/v1/make-server-c7b4849c`;

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<string | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [notes, setNotes] = useState<SavedNote[]>([]);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [weeklyGoal, setWeeklyGoal] = useState(300); // 5 hours
  const [buddies, setBuddies] = useState<BuddyData[]>([]);
  const [pendingInvites, setPendingInvites] = useState<string[]>([]);
  const [pendingSessionInvites, setPendingSessionInvites] = useState<SessionInvite[]>([]);

  const weeklyProgress = sessions
    .filter((s) => s.status === "completed")
    .reduce((acc, s) => acc + s.duration, 0);

  // Initial Auth Check
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user.email || null);
        setSessionToken(session.access_token);
      }
      setLoading(false);
    };
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setUser(session.user.email || null);
        setSessionToken(session.access_token);
      } else {
        setUser(null);
        setSessionToken(null);
        setSessions([]);
        setBuddies([]);
        setStreak(0);
        setLongestStreak(0);
        setTotalSessions(0);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // Fetch Sync Data when token is available
  useEffect(() => {
    if (sessionToken) {
      fetchSyncData();
      
      // Auto-poll every 10 seconds so buddy updates and data sync across screens
      const interval = setInterval(() => {
        fetchSyncData();
      }, 10000);
      
      return () => clearInterval(interval);
    }
  }, [sessionToken]);

  const fetchSyncData = async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${serverUrl}/sync`, {
        headers: { Authorization: `Bearer ${sessionToken}` },
        cache: "no-store"
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
        setNotes(data.notes || []);
        if (data.profile) {
          setStreak(data.profile.streak || 0);
          setLongestStreak(data.profile.longestStreak || 0);
          setTotalSessions(data.profile.totalSessions || 0);
          setWeeklyGoal(data.profile.weeklyGoal || 300);
        }
        setBuddies(data.buddies || []);
        setPendingInvites(data.pendingInvites || []);
        setPendingSessionInvites(data.pendingSessionInvites || []);
      }
    } catch (err) {
      console.error("Failed to fetch sync data:", err);
    }
  };

  const persistNotes = async (newNotes: SavedNote[]) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "notes",
          data: newNotes
        })
      });
    } catch (err) {
      console.error("Failed to sync notes:", err);
    }
  };

  const persistProfile = async (newStreak: number, newLongestStreak: number, newTotalSessions: number) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "profile",
          data: { streak: newStreak, longestStreak: newLongestStreak, totalSessions: newTotalSessions, weeklyGoal, buddies: buddies.map(b => b.email) }
        })
      });
    } catch (err) {
      console.error("Failed to sync profile:", err);
    }
  };

  const persistSessions = async (newSessions: Session[]) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "sessions",
          data: newSessions
        })
      });
    } catch (err) {
      console.error("Failed to sync sessions:", err);
    }
  };

  const addBuddy = async (email: string) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "add_buddy",
          data: { email }
        })
      });
      // Re-fetch sync data to get full buddy objects
      fetchSyncData();
    } catch (err) {
      console.error("Failed to add buddy:", err);
    }
  };

  const acceptBuddy = async (email: string) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "accept_buddy",
          data: { email }
        })
      });
      fetchSyncData();
    } catch (err) {
      console.error("Failed to accept buddy:", err);
    }
  };

  const denyBuddy = async (email: string) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "deny_buddy",
          data: { email }
        })
      });
      fetchSyncData();
    } catch (err) {
      console.error("Failed to deny buddy:", err);
    }
  };

  const removeBuddy = async (email: string) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "remove_buddy",
          data: { email }
        })
      });
      fetchSyncData();
    } catch (err) {
      console.error("Failed to remove buddy:", err);
    }
  };

  const inviteToSession = async (emails: string[], session: Session) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ type: "invite_to_session", data: { emails, session } })
      });
    } catch (err) {
      console.error("Failed to invite to session:", err);
    }
  };

  const acceptSession = async (inviter: string, session: Session) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ type: "accept_session", data: { inviter, session } })
      });
      fetchSyncData();
    } catch (err) {
      console.error("Failed to accept session:", err);
    }
  };

  const denySession = async (inviter: string, session: Session, reason?: string) => {
    if (!sessionToken) return;
    try {
      await fetch(`${serverUrl}/sync`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${sessionToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ type: "deny_session", data: { inviter, session, reason } })
      });
      fetchSyncData();
    } catch (err) {
      console.error("Failed to deny session:", err);
    }
  };

  const signup = async (email: string, pass: string) => {
    const res = await fetch(`${serverUrl}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${publicAnonKey}` },
      body: JSON.stringify({ email, password: pass })
    });
    
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || "Failed to sign up");
    }

    // Auto log in after sign up
    await login(email, pass);
  };

  const login = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) {
      console.error("Authorization error while signing in user during main login flow:", error.message);
      throw new Error(error.message);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const addSession = (sessionData: Omit<Session, "id" | "status"> & { id?: string, status?: SessionStatus, requiredParticipants?: number, joinedParticipants?: string[] }) => {
    const newSession: Session = {
      ...sessionData,
      id: sessionData.id || Math.random().toString(36).substr(2, 9),
      status: sessionData.status || "planned",
    };
    const updatedSessions = [...sessions, newSession];
    setSessions(updatedSessions);
    persistSessions(updatedSessions);
    return newSession;
  };

  const updateSessionStatus = async (id: string, status: SessionStatus, extra?: any) => {
    let newStreak = streak;
    let newLongestStreak = longestStreak;
    let newTotalSessions = totalSessions;
    
    const updatedSessions = sessions.map((s) => {
      if (s.id === id) {
        const updated = { ...s, status };
        if (status === "completed") {
          updated.completedAt = new Date().toISOString();
          if (extra?.duration) {
            updated.duration = extra.duration;
          }
        }
        if (status === "missed" && extra?.reason) {
          updated.missedReason = extra.reason;
        }
        if (status === "planned" && extra?.rescheduled) {
          updated.date = extra.date || s.date;
          updated.time = extra.time || s.time;
          updated.missedReason = undefined;
        }
        if (extra?.joinedParticipants) {
          updated.joinedParticipants = extra.joinedParticipants;
        }
        if (extra?.requiredParticipants !== undefined) {
          updated.requiredParticipants = extra.requiredParticipants;
        }
        if (extra?.status) {
          updated.status = extra.status;
        }
        if (extra?.timerStartedAt !== undefined) updated.timerStartedAt = extra.timerStartedAt;
        if (extra?.timerIsActive !== undefined) updated.timerIsActive = extra.timerIsActive;
        if (extra?.timeLeft !== undefined) updated.timeLeft = extra.timeLeft;
        if (extra?.toolState !== undefined) updated.toolState = extra.toolState;
        return updated;
      }
      return s;
    });

    setSessions(updatedSessions);
    
    // Call server to update session for all joined participants
    if (sessionToken) {
      try {
        await fetch(`${serverUrl}/sync`, {
          method: "POST",
          headers: { 
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            type: "update_session_status",
            data: { id, status, extra }
          })
        });
        // We do not call persistSessions(updatedSessions) here because the server handles it for us now
        fetchSyncData();
      } catch (err) {
        console.error("Failed to sync updated session status", err);
        persistSessions(updatedSessions); // Fallback
      }
    } else {
      persistSessions(updatedSessions);
    }

    // Still perform local calculation for immediate UI response
    if (status === "completed") {
      const completedDates = [...new Set(updatedSessions
        .filter((s) => s.status === "completed")
        .map((s) => new Date(s.completedAt || s.date).toDateString()))];
      
      const datesArr = completedDates.map(d => new Date(d).getTime()).sort((a, b) => b - a);
      const today = new Date(new Date().toDateString()).getTime();
      
      let currentStreak = 0;
      let expectedTime = today;
      
      if (datesArr.length > 0 && datesArr[0] <= today) {
        if (datesArr[0] === today || datesArr[0] === today - 86400000) {
          expectedTime = datesArr[0];
          for (let i = 0; i < datesArr.length; i++) {
            if (datesArr[i] === expectedTime) {
              currentStreak++;
              expectedTime -= 86400000;
            } else {
              break;
            }
          }
        }
      }
      
      newStreak = currentStreak;
      newLongestStreak = Math.max(longestStreak, currentStreak);
      newTotalSessions = updatedSessions.filter(s => s.status === "completed").length;

      // Encouragement logic
      const newWeeklyProgress = updatedSessions
        .filter((s) => s.status === "completed")
        .reduce((acc, s) => acc + (s.duration || 0), 0);

      const oldWeeklyProgress = sessions
        .filter((s) => s.status === "completed")
        .reduce((acc, s) => acc + (s.duration || 0), 0);

      if (oldWeeklyProgress < weeklyGoal && newWeeklyProgress >= weeklyGoal) {
        setTimeout(() => {
          confetti({ particleCount: 200, spread: 100, origin: { y: 0.4 } });
          toast.success("🎉 Amazing! You just crushed your weekly goal!");
        }, 500);
      }

      if (newStreak > streak) {
        setTimeout(() => {
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 }, colors: ['#f97316', '#fb923c', '#fbbf24'] });
          toast.success(`🔥 Incredible! You've reached a ${newStreak}-day streak!`);
        }, 500);
      }

      setStreak(newStreak);
      setLongestStreak(newLongestStreak);
      setTotalSessions(newTotalSessions);
    } else if (status === "missed") {
      newStreak = 0;
      setStreak(newStreak);
    }
  };

  const deleteSession = (id: string) => {
    const updatedSessions = sessions.filter((s) => s.id !== id);
    setSessions(updatedSessions);
    persistSessions(updatedSessions);
  }

  const addNote = (noteData: Omit<SavedNote, "id" | "createdAt" | "updatedAt" | "ownerId">) => {
    const newNote: SavedNote = {
      ...noteData,
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ownerId: user || "unknown",
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const updatedNotes = [...notes, newNote];
    setNotes(updatedNotes);
    persistNotes(updatedNotes);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<SavedNote>) => {
    const updatedNotes = notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n);
    setNotes(updatedNotes);
    persistNotes(updatedNotes);
  };

  const deleteNote = (id: string, soft: boolean = true) => {
    if (soft) {
      updateNote(id, { isDeleted: true });
    } else {
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
      persistNotes(updatedNotes);
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        sessions,
        addSession,
        updateSessionStatus,
        deleteSession,
        notes,
        addNote,
        updateNote,
        deleteNote,
        streak,
        weeklyGoal,
        weeklyProgress,
        buddies,
        pendingInvites,
        addBuddy,
        acceptBuddy,
        denyBuddy,
        removeBuddy,
        pendingSessionInvites,
        inviteToSession,
        acceptSession,
        denySession
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useAppContext must be used within AppProvider");
  return context;
};
