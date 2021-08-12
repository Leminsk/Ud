# Ud
Another simple youtube-based (ytdl) audio content streaming Discord bot.  

## Main Requirements  
- `Node.js 14 or above` (WARNING: ytdl-core has some functionalities, like `resume()` and `pause()`, that break in Node.js 15 and above as of July 2021)
- `discord.js` Version: 12.5.3
- `ytdl-core` Version: 4.8.3 (as of 2021-08-12 there is a newer version of `ytdl-core`, but Ud hass still not been tested on it)
- `discord-youtube-api`
- `A Google API Key`

## Commands & Instructions  
All commands need to be preceeded by a '!'(exclamation mark). These are the commands that Ud can currently understand:  
- `help`: displays the help text message containing the commands
- `play [Youtube Link] / [search query]`: plays content from a YouTube stream (live or archived). 'Stream' here means any kind of video midia from the website. 'play' must always be followed by a space character and can be used in two ways:
  - `!play https://www.youtube.com/...`: plays stream via direct link.
  - `!play 'darude sandstorm'` OR `!play "darude sandstorm"`: uses Google's YouTube Data API to search the words given and returns the top result.
- `pause`: pauses stream (only if using Node.js 14, otherwise it won't be able to resume playing).
- `resume`: resumes playing from previous pause command (only if using Node.js 14).
- `queue`: displays stream queue on chat containing the stream number, who requested it, its time duration, and the title
- `skip`: skips current stream being played and plays the next one in the queue. Equivalent to `!remove 0`.
- `remove [number]`: removes stream from queue based on its queue index/number.
  - `!remove6` OR `!remove 6`: removes stream number 6 (the seventh one) from the queue. All other streams with greater numbers get shifted down (index-wise).
- `flush`: clears the queue except for the stream currently playing (number 0)
- `loop [number] [repetitions]`: marks stream, based on its number, to repeat a given amount of times. Can be used in three ways:
  - `!loop`: marks current stream playing (number 0) to repeat indefinitely.
  - `!loop2` OR `!loop 2`: marks stream number 2 (the third one) to repeat indefinitely
  - `!loop2 70` OR `!loop 2 70`: marks stream number 2 to repeat 70 more times (making it play 71 times in total)
- `stop`: ends the stream, exits the channel and clears the queue.
- `vup`: globally increases volume by 20% (x1.2).
- `vUP` OR `VUP`: globally increases volume by 50% (x1.5).
- `vdown`: globally decreases volume by 20% (x0.8).
- `vDOWN` OR `VDOWN`: globally decreases volume by 50% (x0.5).
- `vol [value]`: sets global volume to value. Ranges from 0 (mute) to 200 (arbitrary maximum).
  - `!vol80` OR `!vol 80`: sets global volume to 80.
- `vreset`: resets global volume to its default value of 25.
