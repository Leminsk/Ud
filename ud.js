/*
Based on the tutorial provided by https://gabrieltanner.org/blog/dicord-music-bot
*/

console.log('INITIALIZING UD');
console.log(`Node.js Version: ${process.version}`);

// import/include dependencies
const Discord = require('discord.js');
const {
	prefix,
	token,
} = require('./config.json');
const ytdl = require('ytdl-core');

const client = new Discord.Client();

// save songs/videos
const queue = new Map();

// sound volume variables
const initial_volume = 0.25;
var current_volume = 0.25;

// same length as serverQueue.song (their indices refer to same element in videoqueue)
// stores the username of who entered the !play command
const authorQueue = [];



// listeners
client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});


// help text may need to be broken into smaller parts because of discord's 2000 character limit per message
const help_text = `These are the commands that I can understand:
---------------------+--------------------------------------------------------------------------
!play [YouTube Link] | plays video, or adds to queue; YTLink after a space and no brackets
---------------------+--------------------------------------------------------------------------
!pause               | DEPRECATED DO NOT USE pauses video
!resume              | DEPRECATED DO NOT USE resumes playing from previous pause command
!queue               | displays video queue
!skip                | skips the current video; plays the next one in the queue if there is any
!remove[number]      | removes video from queue based on its queue number; no space, no brackets
!flush               | clears the queue, except for the video being played (0)
!stop                | stops playing, exits the channel, clears the queue
---------------------+--------------------------------------------------------------------------
!vup                 | increases volume by 20% (x1.2)
!vUP                 | increases volume by 50% (x1.5)
!vdown               | decreases volume by 20% (x0.8)
!vDOWN               | decreases volume by 50% (x0.5)
!vol[value]          | sets volume to value; no space, no brackets; value between 0 ~ 200
!vreset              | resets volume to default value of 25
---------------------+--------------------------------------------------------------------------
!help                | displays this text message
---------------------+--------------------------------------------------------------------------`

//!masterreset         | use this if you think I might have stopped working properly

// read messages //async
client.on('message', async message => {
    // ignore bot messages
    if (message.author.bot) return;

    // check for prefix
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);
    
    // check for commands
    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue, authorQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue, authorQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue, authorQueue);
        return;
    } else if (message.content.startsWith(`${prefix}pause`)) {
        pause(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}resume`)) {
        resume(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}queue`)) {
        videoqueue(message, serverQueue, true, authorQueue);
        return;
    } else if (message.content.startsWith(`${prefix}vup`)) {
        vup(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vUP`)) {
        vUP(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vdown`)) {
        vdown(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vDOWN`)) {
        vDOWN(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vreset`)) {
        vreset(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vol`)) {
        volume(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}flush`)) {
        flush(message, serverQueue, authorQueue);
        return;
    } else if (message.content.startsWith(`${prefix}remove`)) {
        remove(message, serverQueue, authorQueue);
        return;
    } else if (message.content.startsWith(`${prefix}help`)) {
        return message.channel.send('```\n' + help_text + '\n```');
    } else if (message.content.startsWith(`${prefix}masterreset`)) {
        masterreset(message, serverQueue, authorQueue, current_volume);
        return;
    } else if (message.content === `${prefix}`) {
        return;
    } else {
        message.channel.send('Invalid command.')
    }
});


//async
async function execute(message, serverQueue, authorQueue) {
    console.log('////////////////////////////////////////////////////////////////');
    console.log('EXECUTE FUNCTION CALLED');
	const args = message.content.split(' ');
    if (args.length === 1){
        return message.channel.send('No link has been given.');
    }
    const voiceChannel = message.member.voice.channel;
	if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music.');
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send('I need the permissions to join and speak in your voice channel!');
	}

    var songInfo;
    var song;

    try{
        // Try for youtube link
        songInfo = await ytdl.getInfo(args[1]);

        // old way DEPRECATED
        /*song = {
            title: songInfo.title,
            url: songInfo.video_url,
        };*/
        // replacing with
        song = {
            title: songInfo.videoDetails.title,
            url: songInfo.videoDetails.video_url,
            time: songInfo.videoDetails.lengthSeconds,
        };
    } catch (err){
        console.log(`Error in function 'execute'. User may have given a bad argument, ytdl.getInfo went wrong, or songInfo.videoDetails has been updated/modified by ytdl.`)
		console.log(err);
		return message.channel.send('Something is wrong with that YouTube link.');
    }

    console.log('serverQueue BELOW:')
	if (!serverQueue) {
        // Creating the contract for our queue
		const queueContruct = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};
        // Setting the queue using our contract
		queue.set(message.guild.id, queueContruct);
        // Pushing the song to our songs array
        queueContruct.songs.push(song);
        console.log(message.author["lastMessage"]["member"]["user"]["username"]);
        authorQueue.push(message.author["lastMessage"]["member"]["user"]["username"]);//authorQueue[authorQueue.length] = message.author["username"];
    
		try {
            // Here we try to join the voicechat and save our connection into our object.
			var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            // Calling the play function to start a song
            play(message, message.guild, queueContruct.songs[0], authorQueue);
		} catch (err) {
            // Printing the error message if the bot fails to join the voicechat
            console.log(`ERROR in function 'execute'. Either couldn't join voiceChannel or play function went wrong in some way.`)
			console.log(err);
			queue.delete(message.guild.id);
			return message.channel.send(err);
        }
        // TODO
        // maybe implement nickname
        // 
        console.log('serverQueue was empty.');
        console.log('serverQueue.songs is undefined. Using queueContruct.songs for now.');
        console.log('////////////////////////////////////////////////////////////////');
        console.log(queueContruct.songs);
        console.log(authorQueue);
        console.log('////////////////////////////////////////////////////////////////');
	} else {
        serverQueue.songs.push(song);
        // TODO
        // maybe implement nickname
        // 
        console.log('Attempting to add video to queue.');
        console.log(message.author["lastMessage"]["member"]["user"]["username"]);
        authorQueue.push(message.author["lastMessage"]["member"]["user"]["username"]);//authorQueue[authorQueue.length] = message.author["username"];
        console.log('////////////////////////////////////////////////////////////////');
        console.log(serverQueue.songs);
        console.log(authorQueue);
        console.log('////////////////////////////////////////////////////////////////');
        let vq = videoqueue(message, serverQueue, false, authorQueue);
		return message.channel.send(`Added to the queue: ${song.title}\n\n Current Queue:\n` + '```\n' + vq +'\n```');
	}

}

// needs to be global to change the volume
var dispatcher;

async function play(message, guild, song, authorQueue) {
    console.log('################################################################');
    console.log("PLAY FUNCTION CALLED");
	const serverQueue = await queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        play_status = false;
		return message.channel.send(`No more content to play. (Queue empty)`);
	}

                                    /* old playStream */
    dispatcher = serverQueue.connection.play(ytdl(song.url))
		.on('finish', () => { //old 'end' event
			console.log(`EVENT 'finish' DETECTED. Stream ended, attempting to go to next one.`);
            serverQueue.songs.shift();
            authorQueue.shift();
            play(message, guild, serverQueue.songs[0], authorQueue);
        })
        .on('error', error => {
            console.log(`EVENT 'error' DETECTED. ERROR on dispatcher = serverQueue.connection.play(ytdl(song.url))`);
			console.error(error);
        });
        /*.on('finish', () => {
			console.log('Stream finished, attempting to go to next one.');
            serverQueue.songs.shift();
            authorQueue.shift();
            play(message, guild, serverQueue.songs[0], authorQueue);
		})*/
    play_status = true;
    dispatcher.setVolumeLogarithmic(current_volume);
    let vq = videoqueue(message, serverQueue, false, authorQueue);
    console.log("PLAY FUNCTION NORMAL EXIT");
    console.log('################################################################');
    return message.channel.send(`Now Playing...\n`+ '```\n' + song.title + '\n```' + `Current Queue:\n` + '```\n' + vq +'\n```');
}

////////////////////////////////////////////////////
////////////////////////////////////////////////////
////////////////// COMMANDS BELOW //////////////////
////////////////////////////////////////////////////
////////////////////////////////////////////////////

// attempts to reset variables and queues
// should be used whenever some error halts the normal workflow
function masterreset(message, serverQueue, authorQueue, current_volume){
    console.log('################################################################');
    console.log("MASTERRESET FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    try{
        //serverQueue.connection.dispatcher.end();
        console.log('Attempting to reset variables.');
        serverQueue = queue.get(message.guild.id); 
        authorQueue = authorQueue.splice(0, authorQueue.length); // stupid method of clearing array because js is a little bit of a pain in the rear
        //serverQueue.songs = [];
        play_status = false;
        current_volume = initial_volume;
        console.log('################################################################');
        message.channel.send('Attempted a master reset.');
        message.member.voice.channel.leave();
        return;
    } catch (err) {
        console.log("**********************************************");
        console.log("MASTERRESET FUNCTION FAILED");
        console.log("----------------------------------------------");
        console.log(err);
        console.log("**********************************************");
        console.log('################################################################');
    }
}


// prints song queue
function videoqueue(message, serverQueue, return_message, authorQueue){
    console.log('################################################################');
    console.log("VIDEOQUEUE FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    let vq = "";
    let user_lengths = [];
    
    for (var i=0; i<authorQueue.length; i++){
        user_lengths.push(authorQueue[i].length);
    }
    let max_username_length = Math.max.apply(Math, user_lengths);


    for (var m in serverQueue){
        for (var i=0; i<serverQueue[m].length; i++){
            var converted_time = secondsToHms(serverQueue[m][i].time);

            space_padding = "";
            for (var j = 0; j<max_username_length - authorQueue[i].length; j++){
                space_padding += " ";
            }

            vq = vq + "|  " + i + "  |  " + authorQueue[i] + space_padding + "  |  " + "(" + converted_time + ") "+ serverQueue[m][i].title + "\n";
        }
    }

    if (return_message === true){
        if (vq.length === 0) {
            console.log("VIDEOQUEUE FUNCTION EMPTY QUEUE EXIT");
            console.log('################################################################');
            return message.channel.send('The queue is empty.');
        } else {
            console.log("VIDEOQUEUE FUNCTION QUEUE DISPLAY EXIT");
            console.log('################################################################');
            return message.channel.send('```\n' + String.raw`${vq}` + '\n```');
        }
    } else {
        console.log("VIDEOQUEUE FUNCTION VALUE RETURNED");
        console.log('################################################################');
        return vq;
    }
    
}


// end current song/video being played and goes to next element in queue
function skip(message, serverQueue, authorQueue) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (!serverQueue) return message.channel.send('There is no song that I could skip.');
    console.log('################################################################');
    console.log("SKIP FUNCTION CALLED");
    try{
        serverQueue.connection.dispatcher.end() //.stopPlaying() replaces .end()?
        console.log('Music ended?.');
        /*serverQueue.songs.shift();
        authorQueue.shift();
        play(message, message.guild, serverQueue.songs[0], authorQueue);*/
        console.log("SKIP FUNCTION NORMAL EXIT");
        console.log('################################################################');
        return message.channel.send('Skipping video...');
    } catch (err) {
        console.log("**********************************************");
        console.log("SKIP FUNCTION FAILED");
        console.log("----------------------------------------------");
        console.log(err);
        console.log("**********************************************");
        console.log('################################################################');
    }
    console.log("SKIP FUNCTION EMPTY EXIT");
    console.log('################################################################');
    return;
}

// clears all queues and ends current song/video/stream
function stop(message, serverQueue, authorQueue) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    console.log('################################################################');
    console.log("STOP FUNCTION CALLED");
    try{
        serverQueue.connection.dispatcher.end(); //.stopPlaying() replaces .end()?
        authorQueue = authorQueue.splice(0, authorQueue.length); // stupid method of clearing array because js is a little bit of a pain in the rear
        serverQueue.songs = [];
        /*play(message, message.guild, serverQueue.songs[0], authorQueue);*/
        console.log('All operations halted.');
        play_status = false;
        console.log('################################################################');
        return message.channel.send('Video has been stopped and queues have been cleared.');
    } catch (err) {
        console.log("**********************************************");
        console.log("STOP FUNCTION FAILED");
        console.log("----------------------------------------------");
        console.log(err);
        console.log("**********************************************");
        console.log('################################################################');
    }
    console.log("STOP FUNCTION EMPTY EXIT");
    console.log('################################################################');
    return;
}


// whether a video/song is currently playing
var play_status = false;

function pause(message, serverQueue) {
    console.log('################################################################');
    console.log("PAUSE FUNCTION CALLED");
    console.log('################################################################');
    //return;
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (!play_status) return message.channel.send('Already paused.');
    try{
        serverQueue.connection.dispatcher.pause(true);
        console.log("PAUSE FUNCTION NORMAL EXIT");
        play_status = false;
        console.log('################################################################');
        return message.channel.send('Song paused.');
    } catch (err) {
        console.log("**********************************************");
        console.log("PAUSE FUNCTION FAILED");
        console.log("----------------------------------------------");
        console.log(err);
        console.log("**********************************************");
        console.log('################################################################');
    }
    console.log("PAUSE FUNCTION EMPTY EXIT");
    console.log('################################################################');
    return;
}

// only supposed to be used after after !pause
function resume(message, serverQueue) {
    console.log('################################################################');
    console.log("RESUME FUNCTION CALLED");
    console.log('################################################################');
    //return;
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (play_status) return message.channel.send('No video to resume.');
    try{
        serverQueue.connection.dispatcher.resume(true);
        console.log("RESUME FUNCTION NORMAL EXIT");
        play_status = true;
        console.log('################################################################');
        return message.channel.send('Resuming...');
    } catch (err) {
        console.log("**********************************************");
        console.log("STOP FUNCTION FAILED");
        console.log("----------------------------------------------");
        console.log(err);
        console.log("**********************************************");
        console.log('################################################################');
    }
    console.log("RESUME FUNCTION EMPTY EXIT");
    console.log('################################################################');
    return;
}

// increase current volume by 20%
function vup(message, dispatcher) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = 1.2*current_volume;
    // ceiling value
    if (current_volume >= 2) {
        current_volume = 2;
    }
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}

// increase current volume by 50%
function vUP(message, dispatcher) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = 1.5*current_volume;
    // ceiling value
    if (current_volume >= 2) {
        current_volume = 2;
    }
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}

// decrease current volume by 20%
function vdown(message, dispatcher) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = 0.8*current_volume;
    // floor value
    if (current_volume <= 0) {
        current_volume = 0;
    }
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}

// decrease current volume by 50%
function vDOWN(message, dispatcher) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = 0.5*current_volume;
    // floor value
    if (current_volume <= 0) {
        current_volume = 0;
    }
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}

// reset volume to its initial value (100% or 1)
function vreset(message, dispatcher){
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = initial_volume;
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}

// sets volume to a certain percentage (minimum 0, maximum 200)
function volume(message, dispatcher){
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var value = message.content.substring(4);
    if(/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)){
        value = Number(value);
        if (value >= 0 && value <= 200){
            current_volume = value/100;
            if (dispatcher != null){
                dispatcher.setVolumeLogarithmic(current_volume);
            }
            
            text_value = current_volume*100;
            return message.channel.send(`Current volume: ${text_value}`);
        } else {
            return message.channel.send('Invalid volume range. (0.00 ~ 200.00)');
        }
    } else {
        return message.channel.send('Could not understand volume.');
    }
}

// empty the queue except for the song playing (song 0)
function flush(message, serverQueue, authorQueue){
    console.log('################################################################');
    console.log("FLUSH FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var counter = 0;
    while( counter < serverQueue.songs.length-1){
        serverQueue.songs.pop();
        authorQueue.pop();
    }
    console.log("FLUSH FUNCTION EXIT");
    console.log('################################################################');
    return message.channel.send('Queue has been flushed.');
}

// removes song from queue based on its index/number
function remove(message, serverQueue, authorQueue){
    console.log('################################################################');
    console.log("REMOVE FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var value = message.content.substring(7);
    if(/^(\-|\+)?([0-9]|Infinity)$/.test(value)){
        value = Number(value);
        if (value < 0){
            console.log('################################################################');
            return message.channel.send('Invalid song number.');
        } else if (value === 0) {
            console.log('################################################################');
            return message.channel.send('Can\'t remove song currently playing. (use !skip for that)');
        } else if (value < serverQueue.songs.length){
            var song_name = serverQueue.songs[value].title;
            serverQueue.songs.splice(value, 1);
            authorQueue.splice(value, 1);
            console.log('################################################################');
            return message.channel.send(`Removed from the Queue:\n| Song ${value} | ${song_name}`);
        } else {
            console.log('################################################################');
            return message.channel.send(`Could not find | Song ${value} | in the Queue.`);
        }
    } else {
        console.log('################################################################');
        return message.channel.send('Could not get the song number.');
    }
}

///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////
////////////////// AUXILIARY FUNCTIONS BELOW //////////////////
///////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////

function secondsToHms(d) {
    d = Number(d);
    var h = Math.floor(d / 3600);
    var m = Math.floor(d % 3600 / 60);
    var s = Math.floor(d % 3600 % 60);

    var hDisplay = h > 0 ? h + "h " : "";
    var mDisplay = m > 0 ? m + "m " : "";
    var sDisplay = s > 0 ? s + "s" : "";

    if (s < 10 && sDisplay !== ""){
        sDisplay = "0" + sDisplay;
    }
    if (m < 10 && mDisplay !== ""){
        mDisplay = "0" + mDisplay;
    }
    if (h < 10 && hDisplay !== ""){
        hDisplay = "0" + hDisplay;
    }


    if (hDisplay + mDisplay + sDisplay === ""){
        return String.raw`¯\_(ツ)_/¯`;
    } else {
        return hDisplay + mDisplay + sDisplay; 
    }     
    
}

// round number to only 2 decimal places
function round2decimal(num){
    return (Math.round(num * 100) / 100).toFixed(2);
}


client.login(token);