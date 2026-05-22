1. Personal Best should start at 0 for a new account

Right now the UI is still showing a hardcoded best streak like 7 days for new users. That should come from the user’s saved stats, and for a brand-new account it should initialize as:

longestStreak: 0
currentStreak: 0
totalSessions: 0

If the user has never completed a session, Personal Best = 0 days.

2. Day streak should only count unique days

Right now your streak tracker is still using mock/generated calendar logic, not real session dates, so it can increase on the same day.

You need to calculate streak from unique completed dates, not number of sessions.

Correct rule:

3 sessions on the same day = 1 day streak
streak only increases when the user completes on a new calendar day
3. Calendar should use real date/time

Yes — your calendar and scheduling should be based on real saved session dates/times, not mock values or manual free typing.

You said you want it more like Outlook, and that is the better choice:

date picker
time dropdown
saved actual date/time
sorted by soonest upcoming session

That also fixes the dashboard problem.

4. Dashboard should show multiple planned sessions

Right now your dashboard still uses one hardcoded nextSession object instead of rendering all upcoming sessions from saved data.

You want:

multiple planned courses
scrollable list
each saved session visible

So instead of one “Next Session” card, use:

Upcoming Sessions
sorted by date/time
vertical scroll container

That will make it feel much more real.

5. Invite notification is not working

This is probably happening for two reasons:

Reason A: your Figma-published site is not truly running the Supabase-backed flow

The public Figma site disconnects backend resources, so invite syncing and persistence will not behave correctly there.

Reason B: invite logic exists on the backend, but the frontend likely is not fully polling or rendering it

Your server code does include buddy invite logic:

add_buddy
accept_buddy
deny_buddy
pendingInvites in profile sync

So the backend idea exists.

But if the frontend is not:

calling sync after sending invite
checking pendingInvites
rendering a notification badge/panel
refreshing state after accept/deny

then the invite notification will appear broken.

So the honest answer is:
the invite notification is not working because the frontend is probably not fully wired to the backend invite state, and the Figma published site is also not a reliable live backend host.

6. Buddy/group session should only start when everyone joins

Yes, that is the right behavior.

For group accountability, the session should not become active until:

all required invited people accept
or all marked required participants are present

You need something like:

status: "pending" | "ready" | "active" | "completed"
requiredParticipants: number
joinedParticipants: string[]

Rule:

if joinedParticipants.length < requiredParticipants, session stays pending
only when all required users join does it become ready or startable

That is much better than letting one person start a “group” session alone.

7. Actual study time should reflect early finish

Yes — this is important.

Right now the app is using planned duration too heavily. You want:

planned duration
actual duration

So if someone planned 60 minutes but finished in 30, progress/history should save:

planned = 60
actual = 30

That way:

average time
total time invested
weekly goal minutes

all reflect real study time, not just intended time.

8. Filter should include group sessions

Yes. Right now your history filtering logic should support:

Solo
Buddy
Group
All Types

If Group is missing, then your filter model is incomplete.

Better filter options:

All Types
Solo
Buddy
Group

And if you want extra:

by subject
by completion status
9. Group size limit is not enforced

You said:

user can choose group size
but can still add more emails than the selected amount

That means the UI is missing validation.

Fix:

if group size = 4, max invitees should be 4 total or 3 others depending on your definition
once the limit is reached:
disable more additions
show message like:
“Group limit reached. Remove a member before adding another.”

That should be enforced both:

in the frontend
and in the saved session logic
10. Weekly goal encouragement should change when progress is 0

Yes — you are right.

If no progress has been made, the message should not say:

“You’re doing good”

It should say something more like:

“Start strong — your first session sets the tone.”
“You haven’t started this week yet. Pick one session and begin.”
“A strong week starts with one focused session.”
“You’ve got a fresh start this week.”

So message logic should be:

0 progress → start/encouragement message
some progress → keep-going message
1 session left → near-goal message
goal completed → celebration message
Biggest root problem

A lot of these issues come from the same thing:

Your app is partly using:

real saved session data

but also still using:

hardcoded defaults
mock session cards
generated streak/calendar behavior
static feedback text

So the next step is to make all display logic come from real user/session data.

What I’d fix first, in order
Highest priority
Fix streak logic to use unique dates
Replace hardcoded Personal Best with real user stats
Replace hardcoded next session with upcoming session list
Make weekly goal message depend on actual progress
Store actual study duration, not only planned duration
Next
Enforce group size limit
Add Group to history filter
Require all buddy/group members to join before starting
Fix invite notification frontend sync/rendering
About Supabase on the shared Figma site

This is still the core reason persistence/invites feel broken there:

Your backend code uses real server-side Supabase logic and KV sync. But the public Figma-published site disconnects backend resources, so it is not a reliable production host for:

account persistence
invite sync
buddy state
group state

So if you want these features to truly work, you should deploy the app somewhere like:

Vercel
Netlify
Render
Railway

not just as a public Figma site.

Final answer

Yes — all of the changes you listed make sense, and you are catching real logic issues.

The main fixes are:

make stats come from real user data
make streaks count unique days only
use real upcoming sessions instead of one hardcoded session
enforce group size rules
add group session filtering
save actual study time
make encouragement text depend on real progress
move full persistence/invite logic off the shared Figma site and onto a real deployment

If you want, I can turn this into a developer task checklist you can paste into your README or give to whoever is editing the code.