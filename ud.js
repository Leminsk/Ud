/*
Based on the tutorial provided by https://gabrieltanner.org/blog/dicord-music-bot
*/

console.log('INITIALIZING UD');
console.log(`Node.js Version: ${process.version}`);


// import/include dependencies
const Discord = require('discord.js');
console.log(`discord.js Version: ${Discord.version}`);
const {
	prefix,
	token,
} = require('./config.json');
const volume_lib = require('./volume_functions.js');
const queue_lib = require('./queue_functions.js');
const main_lib = require('./main_functions.js');
const role_debugger = require('./role_debugador.js');


const ytdl = require('ytdl-core');
console.log(`ytdl-core Version: ${ytdl.version}`);
const YouTube = require('discord-youtube-api');
console.log(`discord-youtube-api Version: ${YouTube.version}`); // should print 'undefined'
// maybe this doesn't need to be global?
const youtube = new YouTube('GoogleAPIHere');

const client = new Discord.Client();

// save songs/videos
var queue = new Map();

// sound volume variables
const initial_volume = 0.25;




var SHARED_GLOBALS = {
    current_volume : initial_volume,
    serverQueue : queue,

    // same length as SHARED_GLOBALS.serverQueue.song (their indices refer to same element in videoqueue)
    // stores the username of who entered the !play command
    authorQueue : [],

    // same length as SHARED_GLOBALS.serverQueue.song (their indices refer to same element in videoqueue)
    // stores timestamps for the START of streams
    // CURRENTLY NOT WORKING
    timestampQueue : [],

    // same length as SHARED_GLOBALS.serverQueue.song (their indices refer to same element in videoqueue)
    // stores a status indicating whether content will loop
    loopMarkersQueue : [],

    dispatcher,         // needs to be global to change the volume
    skip_loop : false,  // flag for forcing content on loop out of the queues
    play_status : false // whether a video/song is currently playing
};




// listeners
client.once('ready', () => {
    console.log('Ud READY!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting...');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});


// help text may need to be broken into smaller parts because of discord's 2000 character limit per message
const help_text1 = `These are the commands that Ud can understand:
---------------------------------+---------------------------------------------------------------------
!play [YouTube Link] / [search]  | plays video, or adds to queue; insert either a link or a seach query
ex1: !play https://www.youtub... | links must be spaced
ex2: !play 'darude sandstorm'    | search queries must be spaced and must have simple quotation marks
ex3: !play "baka mitai"          | double quotes also work fine
---------------------------------+---------------------------------------------------------------------
!queue                           | displays video queue
!skip                            | skips current video; plays the next one in the queue if there is any
!remove [number]                 | removes video from queue based on its queue number
!flush                           | clears the queue, except for the video being played (number 0)
!stop                            | stops playing, exits the channel, clears queue
!loop [number] [repetitions]     | loop based on number; if no second argument, loop indefinitely
`;

const help_text2 = `!vup                             | increases volume by 20% (x1.2)
!vUP                             | increases volume by 50% (x1.5)
!vdown                           | decreases volume by 20% (x0.8)
!vDOWN                           | decreases volume by 50% (x0.5)
!vol [value]                     | sets volume to value; no brackets; value between 0 ~ 200
!volume [value]                  | same as the above
!vreset                          | resets volume to default value of 25
---------------------------------+---------------------------------------------------------------------
!help                            | displays this text message`;

const help_text = [help_text1, help_text2];

// role specific commands
//!masterreset         | use this if you think I might have stopped working properly
//!detailedstatus      | display some variables on chat

// Node.js 14 commands
//!pause  | pauses the stream
//!resume | resumes from pause commands' timestamp

// read messages //async
client.on('message', async message => {
    // ignore bot messages
    if (message.author.bot) return;

    // check for prefix
    if (!message.content.startsWith(prefix)) return;

    SHARED_GLOBALS.serverQueue = queue.get(message.guild.id);
    
    // check for commands
    if (message.content.startsWith(`${prefix}play`)) {
        main_lib.execute(message, SHARED_GLOBALS);
        return;



    } else if (message.content.startsWith(`${prefix}loop`)) {
        queue_lib.loop(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        queue_lib.skip(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        queue_lib.stop(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}pause`)) {
        queue_lib.pause(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}resume`)) {
        queue_lib.resume(message, SHARED_GLOBALS.serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}queue`)) {
        queue_lib.videoqueue(message, SHARED_GLOBALS, true);
        return;
    } else if (message.content.startsWith(`${prefix}flush`)) {
        queue_lib.flush(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}remove`)) {
        queue_lib.remove(message, SHARED_GLOBALS);
        return;




    } else if (message.content.startsWith(`${prefix}vup`)) {
        volume_lib.vup(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}vUP`) || message.content.startsWith(`${prefix}VUP`)) {
        volume_lib.vUP(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}vdown`)) {
        volume_lib.vdown(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}vDOWN`) || message.content.startsWith(`${prefix}VDOWN`)) {
        volume_lib.vDOWN(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}vreset`)) {
        volume_lib.vreset(message, SHARED_GLOBALS);
        return;
    } else if (message.content.startsWith(`${prefix}vol`) || message.content.startsWith(`${prefix}volume`)) {
        volume_lib.volume(message, SHARED_GLOBALS);
        return;




    } else if (message.content.startsWith(`${prefix}help`)) {
        for(const ht of help_text){
            message.channel.send('```\n' + ht + '\n```');
        }
        return;




    } else if (message.content.startsWith(`${prefix}masterreset`)) {
        role_debugger.masterreset(message, SHARED_GLOBALS.serverQueue, SHARED_GLOBALS.authorQueue, SHARED_GLOBALS.timestampQueue, SHARED_GLOBALS.loopMarkersQueue, SHARED_GLOBALS.current_volume, false);
        return;
    } else if (message.content.startsWith(`${prefix}detailedstatus`)) {
        role_debugger.detailedstatus(message, SHARED_GLOBALS.serverQueue, SHARED_GLOBALS.authorQueue, SHARED_GLOBALS.timestampQueue, SHARED_GLOBALS.loopMarkersQueue, SHARED_GLOBALS.current_volume);
        return;




    } else if (message.content === `${prefix}`) {
        return;
    } else {
        console.log(`Invalid command entered: ${message}`);
    }
});









client.login(token);