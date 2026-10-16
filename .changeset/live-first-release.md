---
"@voila.dev/live": minor
---

First release: live channels declared with a gate and a filter, a socket hub that batches each socket's messages into one frame, a replay log so a reconnecting page catches up from its last `seq` (in memory, or on Redis streams shared by every process), and a reconnecting browser client.
