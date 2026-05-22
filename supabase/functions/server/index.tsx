import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as kv from "./kv_store.tsx";

const app = new Hono();

app.use('*', logger(console.log));
app.use('*', cors());
app.options('*', (c) => c.text('', 204));

// Setup supabase clients
const getServiceSupabase = () => {
  return createClient(
    Deno.env.get('SUPABASE_URL') || "",
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ""
  );
};

// Signup route
app.post("/make-server-c7b4849c/signup", async (c) => {
  try {
    const { email, password, name } = await c.req.json();
    const supabase = getServiceSupabase();
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name: name || email.split("@")[0] },
      email_confirm: true
    });

    if (error) {
      if (error.code === "email_exists") {
        return c.json({ error: "A user with this email address has already been registered." }, 409);
      }
      console.error("Signup error:", error);
      return c.json({ error: error.message }, 400);
    }
    
    return c.json({ user: data.user });
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

// Middleware for Auth
const requireAuth = async (c: any, next: any) => {
  try {
    const token = c.req.header("Authorization")?.split(" ")[1];
    if (!token) return c.json({ error: "Missing authorization header" }, 401);
    
    const supabase = getServiceSupabase();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      console.error("Auth error:", error);
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    c.set("user", user);
    await next();
  } catch (err: any) {
    console.error("Auth exception:", err);
    return c.json({ error: "Internal Auth Error", details: err.message }, 500);
  }
};

// Sync endpoint: GET all user state
app.get("/make-server-c7b4849c/sync", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.email?.toLowerCase(); // Using email as the primary key for KV simplicity

    // Fetch user profile and sessions from KV
    const profileKey = `profile:${userId}`;
    let profile = await kv.get(profileKey) as any;
    
    if (!profile) {
      profile = {
        streak: 0,
        weeklyGoal: 300,
        buddies: [] // Array of buddy IDs or objects
      };
      await kv.set(profileKey, profile);
    }

    const sessionsKey = `sessions:${userId}`;
    let sessions = await kv.get(sessionsKey) as any;
    
    if (!sessions) {
      sessions = [];
      await kv.set(sessionsKey, sessions);
    }
    
    const notesKey = `notes:${userId}`;
    let notes = await kv.get(notesKey) as any;
    
    if (!notes) {
      notes = [];
      await kv.set(notesKey, notes);
    }
    
    // For social features, let's also fetch buddies' profiles and active sessions
    const buddyData = [];
    if (profile.buddies && profile.buddies.length > 0) {
      for (const buddyEmail of profile.buddies) {
        const buddyProfile = await kv.get(`profile:${buddyEmail}`) as any;
        const buddySessions = await kv.get(`sessions:${buddyEmail}`) as any;
        if (buddyProfile) {
          buddyData.push({
            email: buddyEmail,
            streak: buddyProfile.streak || 0,
            recentSession: buddySessions ? buddySessions[buddySessions.length - 1] : null
          });
        }
      }
    }

    return c.json({
      profile,
      sessions,
      notes,
      buddies: buddyData,
      pendingInvites: profile.pendingInvites || [],
      pendingSessionInvites: profile.pendingSessionInvites || []
    });
  } catch (error: any) {
    console.error("Sync get error:", error);
    return c.json({ error: error.message }, 500);
  }
});

    // Sync endpoint: POST update data
app.post("/make-server-c7b4849c/sync", requireAuth, async (c) => {
  try {
    const user = c.get("user");
    const userId = user.email?.toLowerCase(); // Using email as the primary key
    const { type, data } = await c.req.json();
    
    if (type === "profile") {
      const profileKey = `profile:${userId}`;
      let existingProfile = await kv.get(profileKey) as any || {};
      await kv.set(profileKey, { ...existingProfile, ...data });
    } else if (type === "update_session_status") {
      const { id, status, extra } = data;
      const sessionsKey = `sessions:${userId}`;
      let mySessions = await kv.get(sessionsKey) as any[] || [];
      
      const sessionIndex = mySessions.findIndex(s => s.id === id);
      if (sessionIndex !== -1) {
        const session = mySessions[sessionIndex];
        
        // Helper to update session based on status
        const updateSession = (s: any) => {
          const updated = { ...s, status };
          if (status === "completed") {
            updated.completedAt = new Date().toISOString();
            if (extra?.duration) updated.duration = extra.duration;
          }
          if (status === "missed" && extra?.reason) {
            updated.missedReason = extra.reason;
          }
          if (status === "planned" && extra?.rescheduled) {
            updated.date = extra.date || s.date;
            updated.time = extra.time || s.time;
            updated.missedReason = undefined;
          }
          if (extra?.joinedParticipants) updated.joinedParticipants = extra.joinedParticipants;
          if (extra?.requiredParticipants !== undefined) updated.requiredParticipants = extra.requiredParticipants;
          if (extra?.timerStartedAt !== undefined) updated.timerStartedAt = extra.timerStartedAt;
          if (extra?.timerIsActive !== undefined) updated.timerIsActive = extra.timerIsActive;
          if (extra?.timeLeft !== undefined) updated.timeLeft = extra.timeLeft;
          if (extra?.toolState !== undefined) updated.toolState = extra.toolState;
          return updated;
        };

        // Update the session for ALL joined participants if it's a buddy/group session
        const participants = session.joinedParticipants || [userId];
        
        for (const participantEmail of participants) {
          const email = participantEmail.toLowerCase();
          const pSessionsKey = `sessions:${email}`;
          let pSessions = await kv.get(pSessionsKey) as any[] || [];
          
          const pIdx = pSessions.findIndex(s => s.id === id);
          if (pIdx !== -1) {
            pSessions[pIdx] = updateSession(pSessions[pIdx]);
          } else {
            pSessions.push(updateSession(session));
          }
          await kv.set(pSessionsKey, pSessions);

          // Update streak for the participant if completed or missed
          if (status === "completed" || status === "missed") {
            const pProfileKey = `profile:${email}`;
            let pProfile = await kv.get(pProfileKey) as any || { streak: 0, longestStreak: 0, totalSessions: 0 };
            
            if (status === "completed") {
              const completedDates = [...new Set(pSessions
                .filter((s: any) => s.status === "completed")
                .map((s: any) => new Date(s.completedAt || s.date).toDateString()))];
              
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
              
              pProfile.streak = currentStreak;
              pProfile.longestStreak = Math.max(pProfile.longestStreak || 0, currentStreak);
              pProfile.totalSessions = pSessions.filter((s: any) => s.status === "completed").length;
            } else if (status === "missed") {
              pProfile.streak = 0;
            }
            await kv.set(pProfileKey, pProfile);
          }
        }
      }
    } else if (type === "sessions") {
      const sessionsKey = `sessions:${userId}`;
      await kv.set(sessionsKey, data);
    } else if (type === "notes") {
      const notesKey = `notes:${userId}`;
      await kv.set(notesKey, data);
    } else if (type === "add_buddy") {
      // User A invites User B
      // 1. Add User A to User B's pendingInvites list
      const buddyEmail = data.email.toLowerCase();
      const buddyProfileKey = `profile:${buddyEmail}`;
      let buddyProfile = await kv.get(buddyProfileKey) as any;
      if (!buddyProfile) buddyProfile = { streak: 0, weeklyGoal: 300, buddies: [], pendingInvites: [] };
      if (!buddyProfile.pendingInvites) buddyProfile.pendingInvites = [];
      
      if (!buddyProfile.pendingInvites.includes(userId) && !buddyProfile.buddies?.includes(userId)) {
        buddyProfile.pendingInvites.push(userId);
        await kv.set(buddyProfileKey, buddyProfile);
      }
    } else if (type === "accept_buddy") {
      const profileKey = `profile:${userId}`;
      let profile = await kv.get(profileKey) as any;
      if (!profile) profile = { streak: 0, weeklyGoal: 300, buddies: [], pendingInvites: [] };
      if (!profile.buddies) profile.buddies = [];
      if (!profile.pendingInvites) profile.pendingInvites = [];

      const buddyEmail = data.email.toLowerCase();

      // Remove from pending, add to buddies
      profile.pendingInvites = profile.pendingInvites.filter((email: string) => email.toLowerCase() !== buddyEmail);
      if (!profile.buddies.includes(buddyEmail)) {
        profile.buddies.push(buddyEmail);
      }
      await kv.set(profileKey, profile);

      // Add to other user's buddies
      const buddyProfileKey = `profile:${buddyEmail}`;
      let buddyProfile = await kv.get(buddyProfileKey) as any;
      if (!buddyProfile) buddyProfile = { streak: 0, weeklyGoal: 300, buddies: [], pendingInvites: [] };
      if (!buddyProfile.buddies) buddyProfile.buddies = [];
      if (!buddyProfile.buddies.includes(userId)) {
        buddyProfile.buddies.push(userId);
        await kv.set(buddyProfileKey, buddyProfile);
      }
    } else if (type === "invite_to_session") {
      const { emails, session } = data;
      for (let email of emails) {
        email = email.toLowerCase();
        const profileKey = `profile:${email}`;
        let profile = await kv.get(profileKey) as any;
        if (!profile) profile = { streak: 0, weeklyGoal: 300, buddies: [], pendingInvites: [], pendingSessionInvites: [] };
        if (!profile.pendingSessionInvites) profile.pendingSessionInvites = [];
        
        profile.pendingSessionInvites.push({
          inviter: userId,
          session
        });
        await kv.set(profileKey, profile);
      }
    } else if (type === "accept_session") {
      const { session, inviter, reason } = data;
      const inviterEmail = inviter.toLowerCase();
      
      // Look up the latest session state from the inviter's DB to get all current participants
      const inviterSessionsKey = `sessions:${inviterEmail}`;
      let inviterSessions = await kv.get(inviterSessionsKey) as any[] || [];
      
      let latestSession = inviterSessions.find(s => s.id === session.id);
      let jp = [inviterEmail];
      let req = session.requiredParticipants || 2;
      
      if (latestSession) {
        jp = latestSession.joinedParticipants || [inviterEmail];
        req = latestSession.requiredParticipants || 2;
      }
      
      if (!jp.includes(userId)) jp.push(userId);
      const isReady = jp.length >= req;

      // Update the session for EVERY participant currently joined
      for (const participantEmail of jp) {
        const pEmail = participantEmail.toLowerCase();
        const pSessionsKey = `sessions:${pEmail}`;
        let pSessions = await kv.get(pSessionsKey) as any[] || [];
        
        const pIdx = pSessions.findIndex(s => s.id === session.id);
        const updatedStatus = isReady ? "ready" : "pending";
        
        if (pIdx !== -1) {
          pSessions[pIdx] = { ...pSessions[pIdx], joinedParticipants: jp, status: updatedStatus };
        } else if (pEmail === userId) {
          pSessions.push({ ...session, joinedParticipants: jp, status: updatedStatus });
        }
        await kv.set(pSessionsKey, pSessions);
      }

      const profileKey = `profile:${userId}`;
      let profile = await kv.get(profileKey) as any;
      if (profile && profile.pendingSessionInvites) {
        profile.pendingSessionInvites = profile.pendingSessionInvites.filter((inv: any) => inv.session.id !== session.id);
        await kv.set(profileKey, profile);
      }

    } else if (type === "deny_session") {
      const { session, inviter, reason } = data;
      const inviterEmail = inviter.toLowerCase();
      
      const profileKey = `profile:${userId}`;
      let profile = await kv.get(profileKey) as any;
      if (profile && profile.pendingSessionInvites) {
        profile.pendingSessionInvites = profile.pendingSessionInvites.filter((inv: any) => inv.session.id !== session.id);
        await kv.set(profileKey, profile);
      }

      // Read from inviter to get current participants
      const inviterSessionsKey = `sessions:${inviterEmail}`;
      let inviterSessions = await kv.get(inviterSessionsKey) as any[] || [];
      const latestSession = inviterSessions.find(s => s.id === session.id);
      
      if (latestSession) {
        const req = latestSession.requiredParticipants || 2;
        const newReq = reason ? (req > 1 ? req - 1 : 1) : req;
        const jp = latestSession.joinedParticipants || [inviterEmail];
        const isReady = jp.length >= newReq;
        
        const declineReasons = latestSession.declineReasons || [];
        declineReasons.push({ user: userId, reason });
        
        // Update session for ALL joined participants
        for (const participantEmail of jp) {
          const pEmail = participantEmail.toLowerCase();
          const pSessionsKey = `sessions:${pEmail}`;
          let pSessions = await kv.get(pSessionsKey) as any[] || [];
          
          const pIdx = pSessions.findIndex(s => s.id === session.id);
          if (pIdx !== -1) {
            pSessions[pIdx] = { 
              ...pSessions[pIdx], 
              requiredParticipants: newReq, 
              status: isReady ? "ready" : "pending",
              declineReasons
            };
            await kv.set(pSessionsKey, pSessions);
          }
        }
      }
      
    } else if (type === "deny_buddy") {
      const buddyEmail = data.email.toLowerCase();
      const profileKey = `profile:${userId}`;
      let profile = await kv.get(profileKey) as any;
      if (profile && profile.pendingInvites) {
        profile.pendingInvites = profile.pendingInvites.filter((email: string) => email.toLowerCase() !== buddyEmail);
        await kv.set(profileKey, profile);
      }
    } else if (type === "remove_buddy") {
      const buddyEmail = data.email.toLowerCase();
      const profileKey = `profile:${userId}`;
      let profile = await kv.get(profileKey) as any;
      if (profile && profile.buddies) {
        profile.buddies = profile.buddies.filter((email: string) => email.toLowerCase() !== buddyEmail);
        await kv.set(profileKey, profile);
      }

      // Also remove user from the buddy's list
      const buddyProfileKey = `profile:${buddyEmail}`;
      let buddyProfile = await kv.get(buddyProfileKey) as any;
      if (buddyProfile && buddyProfile.buddies) {
        buddyProfile.buddies = buddyProfile.buddies.filter((email: string) => email.toLowerCase() !== userId);
        await kv.set(buddyProfileKey, buddyProfile);
      }
    }

    return c.json({ success: true });
  } catch (error: any) {
    console.error("Sync post error:", error);
    return c.json({ error: error.message }, 500);
  }
});

app.get("/make-server-c7b4849c/health", (c) => {
  return c.json({ status: "ok" });
});

Deno.serve(app.fetch);