# Nightbot API

This is an API to enable some simple Nightbot custom commands.
```
Command: !addmyign
Message: $(urlfetch http://api.majestic-moonmoon.com/nightbot/$channel/addmyign/$(eval encodeURIComponent(`$(user)`))/$(eval encodeURIComponent(`$(1)`)))
Userlevel: Everyone

Command: !showmyign
Message: $(urlfetch http://api.majestic-moonmoon.com/nightbot/$channel/showmyign/$(eval encodeURIComponent(`$(user)`)))
Userlevel: Everyone

Command: !whosnext
Message: $(urlfetch http://api.majestic-moonmoon.com/nightbot/$channel/whosnext/$(eval encodeURIComponent(`$(1)`)))
Userlevel: Moderator
```
