# Update Existing Open Play Logic

I already have an existing Open Play system. **Do not rebuild the module or database unnecessarily.** Only update the Open Play flow and match-generation logic.

## New Open Play Flow

The **Club Owner/Admin** creates an Open Play session.

When creating the session, they only need to select:

* **Session ID / Session Code**
* **Court(s) to use**
* Optional session name/date if already existing in the system

Example:

```text
Session ID: OP-2026-001
Courts: Court 1, Court 2
```

The owner then gives the **Session ID/code to the players**.

---

## Player Flow

Players enter the Session ID/code and join the session themselves.

Example:

```text
Enter Open Play Code:
[ OP-2026-001 ]

[ JOIN ]
```

After joining, they should automatically appear in the session.

No need for the owner/admin to manually create teams or matches.

---

## Automatic Match Logic

Once enough players are available, the system automatically decides:

* Who plays next
* Who waits
* Which court they use
* Who their partner is
* Who their opponents are

Prioritize:

1. Players who have played fewer games
2. Players who have waited the longest
3. Players who sat out the previous round
4. Avoid the same partner repeatedly
5. Avoid the same opponents repeatedly
6. Avoid playing the same player too many consecutive games
7. If DUPR ratings exist, try to create reasonably balanced teams

The goal is **fair rotation**, not random teams.

---

## Multiple Courts

Only use the courts selected by the Club Owner.

Example:

```text
Selected Courts:
Court 1
Court 3

8 players available
```

Automatically assign:

```text
Court 1
Player A + Player B
vs
Player C + Player D

Court 3
Player E + Player F
vs
Player G + Player H
```

If there are not enough players to fill all courts, use the available players efficiently and rotate the waiting players fairly.

---

## After Each Match

When the score/result is submitted:

1. Save the result using the existing match system.
2. Update each player's games played/wins/losses.
3. Recalculate the waiting priority.
4. Automatically generate the next matches.
5. Do not require the owner to manually assign players.

---

## Important

Keep the existing:

* Players
* Clubs
* Courts
* Matches
* DUPR/rating functionality
* Database structure where possible
* Existing UI

Only modify the **Open Play session and automatic rotation logic**.

The final experience should be:

```text
CLUB OWNER
↓
Create Session
↓
Select Session ID + Courts
↓
Share Code
↓
PLAYERS JOIN
↓
System Automatically Assigns Matches
↓
Players Play
↓
Score Submitted
↓
System Automatically Creates Next Matches
↓
Repeat
```

The **Club Owner should only manage the session and selected courts**. The system should handle the player rotation and match assignment automatically.
