# r/fuckcars Bot
### Obtain your access token
1. Go to [r/place](https://www.reddit.com/r/place/)
2. Open the browser console (F12/Inspect element -> Click on console)
3. Paste the following code and press enter:
```js
async function getAccessToken() {
const usingOldReddit = window.location.href.includes('new.reddit.com');
const url = usingOldReddit ? 'https://new.reddit.com/r/place/' : 'https://www.reddit.com/r/place/';
const response = await fetch(url);
const responseText = await response.text();

return responseText.split('\"accessToken\":\"')[1].split('"')[0];

await getAccessToken()
```
4. The text between the quotes (`"`) is your access token.

### Installation Instructions

1. Install [NodeJS](https://nodejs.org/).
2. Download the bot from [this link](https://github.com/TrafficConeGod/Bot/archive/refs/heads/master.zip).
3. Extract the bot to a folder somewhere on your computer.
4. Open a command prompt/terminal in this folder
    Windows: Shift + Right mouse button in the folder -> Click on "Open Powershell here"
    Mac: Really no idea. Sorry!
    Linux: If you're using linux and don't already know how to do this then maybe just use windows :P.
5. Install the necessary depdendencies with `npm i`
6. For the bot out with `node bot.js ACCESS_TOKEN_HERE`
7. BONUS: You can do the last two steps as many times as you want for additional accounts. Make sure you use other accounts otherwise it won't do anything.