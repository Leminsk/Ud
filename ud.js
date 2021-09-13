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
const ytdl = require('ytdl-core');
console.log(`ytdl-core Version: ${ytdl.version}`);
const YouTube = require('discord-youtube-api');
console.log(`discord-youtube-api Version: ${YouTube.version}`); // should print 'undefined'
// maybe this doesn't need to be global?
const youtube = new YouTube('GoogleAPIKeyHere');

const client = new Discord.Client();

// save songs/videos
var queue = new Map();

// sound volume variables
const initial_volume = 0.25;
var current_volume = 0.25;

// same length as serverQueue.song (their indices refer to same element in videoqueue)
// stores the username of who entered the !play command
const authorQueue = [];

// same length as serverQueue.song (their indices refer to same element in videoqueue)
// stores timestamps for the START of streams
// CURRENTLY NOT WORKING
const timestampQueue = [];

// same length as serverQueue.song (their indices refer to same element in videoqueue)
// stores a status indicating whether content will loop
const loopMarkersQueue = [];


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
---------------------------------+--------------------------------------------------------------------------
!play [YouTube Link] / [search]  | plays video, or adds to queue; insert either a link or a seach query
ex1: !play https://www.youtub... | links must be spaced
ex2: !play 'darude sandstorm'    | search queries must be spaced and must have quotation marks
ex3: !play "baka mitai"          | double quotes also work fine
---------------------------------+--------------------------------------------------------------------------
!pause                           | (Node.js 14) pauses video
!resume                          | (Node.js 14) resumes playing from previous pause command
!queue                           | displays video queue
!skip                            | skips current video; plays the next one in the queue if there is any
!remove [number]                 | removes video from queue based on its queue number
!flush                           | clears the queue, except for the video being played (number 0)
!stop                            | stops playing, exits the channel, clears queue
!loop [number] [repetitions]     | loop based on number; if no second argument, loop indefinitely
`;

const help_text2 = `---------------------------------+--------------------------------------------------------------------------
!vup                             | increases volume by 20% (x1.2)
!vUP                             | increases volume by 50% (x1.5)
!vdown                           | decreases volume by 20% (x0.8)
!vDOWN                           | decreases volume by 50% (x0.5)
!vol [value]                     | sets volume to value; no brackets; value between 0 ~ 200
!vreset                          | resets volume to default value of 25
---------------------------------+--------------------------------------------------------------------------
!help                            | displays this text message
---------------------------------+--------------------------------------------------------------------------`;

const help_text = [help_text1, help_text2];

// role specific commands
//!masterreset         | use this if you think I might have stopped working properly
//!detailedstatus      | display some variables on chat

// read messages //async
client.on('message', async message => {
    // ignore bot messages
    if (message.author.bot) return;

    // check for prefix
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);
    
    // check for commands
    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}pause`)) {
        pause(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}resume`)) {
        resume(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}queue`)) {
        videoqueue(message, serverQueue, true, authorQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}vup`)) {
        vup(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vUP`) || message.content.startsWith(`${prefix}VUP`)) {
        vUP(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vdown`)) {
        vdown(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vDOWN`) || message.content.startsWith(`${prefix}VDOWN`)) {
        vDOWN(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vreset`)) {
        vreset(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}vol`)) {
        volume(message, dispatcher);
        return;
    } else if (message.content.startsWith(`${prefix}flush`)) {
        flush(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}remove`)) {
        remove(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}help`)) {
        for(const ht of help_text){
            message.channel.send('```\n' + ht + '\n```');
        }
        return;
    } else if (message.content.startsWith(`${prefix}masterreset`)) {
        masterreset(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume, false);
        return;
    } else if (message.content.startsWith(`${prefix}detailedstatus`)) {
        detailedstatus(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume);
        return;
    } else if (message.content.startsWith(`${prefix}loop`)) {
        loop(message, serverQueue, authorQueue, loopMarkersQueue);
        return;
    } else if (message.content === `${prefix}`) {
        return;
    } else {
        console.log('Invalid command entered.');
    }
});






//async
async function execute(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue) {
    console.log('////////////////////////////////////////////////////////////////');
    console.log('EXECUTE FUNCTION CALLED');
    let args = [];
    // requested video search
    if (message.content.indexOf('\'') > -1 || message.content.indexOf('"') > -1) {
        args.push("!play");
        try {
            args.push(message.content.slice(6));
        } catch (err) {
            console.log(`Error in function 'execute'. User might have typed a double quote. Not really an error.`)
            console.log(err);
        }
    } else { // defaults to direct link
        args = message.content.split(' ');
    }
    // not accepting timestamps, 'begin' option of node ytdl is NOT working properly as of 2021-04-18
    if (args.length === 1 || args.length >= 3){
        return message.channel.send('Sorry, could not understand that.');
    } 
    const voiceChannel = message.member.voice.channel;
	if (!voiceChannel) return message.channel.send('You need to be in a voice channel to play music.');
	const permissions = voiceChannel.permissionsFor(message.client.user);
	if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
		return message.channel.send('I need the permissions to join and speak in your voice channel!');
	}

    var songInfo;
    var song;
    let videosearch;

    if (args[args.length-1].startsWith("http") ) {
        try{
            // Try for youtube link
            // always assumes that last arg is the link
            songInfo = await ytdl.getInfo(args[args.length-1]);
    
            // old way DEPRECATED
            /*song = {
                title: songInfo.title,
                url: songInfo.video_url,
            };*/
            // replacing with
        } catch (err){
            console.log(`Error in function 'execute'. User may have given a bad argument, ytdl.getInfo went wrong, or songInfo.videoDetails has been updated/modified by ytdl.`)
            console.log(err);
            return message.channel.send('Something is wrong with that YouTube link.');
        }
    } else {
        try {
            videosearch = await youtube.searchVideos(args[args.length-1].toString().replace(/,/g,' '));
            songInfo = await ytdl.getInfo(videosearch.url);
        } catch (err){
            console.log(`Error in function 'execute'. User may have given a bad argument, ytdl.getInfo went wrong, songInfo.videoDetails went wrong or searchVideos went wrong.`)
            console.log(err);
            console.log('----------------------------------');
            console.log(videosearch);
            console.log('----------------------------------');
            //console.log(videosearch.url);
            //console.log('----------------------------------');
            console.log(args);
            console.log('----------------------------------');
            return message.channel.send('Something went wrong when trying to search for that.');
        }
    }


    song = {
        title: songInfo.videoDetails.title,
        url: songInfo.videoDetails.video_url,
        time: songInfo.videoDetails.lengthSeconds,
    };


    console.log('serverQueue BELOW:')

    authorQueue.push(message.author["lastMessage"]["member"]["user"]["username"]);//authorQueue[authorQueue.length] = message.author["username"];
    loopMarkersQueue.push(0);
    if (args.length === 3){
        timestampQueue.push(args[1]);
    } else {
        timestampQueue.push('0');
    }


	if (!serverQueue || serverQueue.songs.length === 0) {
        // Creating the contract for our queue
		const queueContract = {
			textChannel: message.channel,
			voiceChannel: voiceChannel,
			connection: null,
			songs: [],
			volume: 5,
			playing: true,
		};
        // Setting the queue using our contract
		queue.set(message.guild.id, queueContract);
        // Pushing the song to our songs array
        queueContract.songs.push(song);
        console.log(message.author["lastMessage"]["member"]["user"]["username"]);
    
		try {
            // Here we try to join the voicechat and save our connection into our object.
			var connection = await voiceChannel.join();
            queueContract.connection = connection;
            // Calling the play function to start a song
            play(message, message.guild, queueContract.songs[0], authorQueue, args, timestampQueue, loopMarkersQueue);
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
        console.log('serverQueue.songs is undefined. Using queueContract.songs for now.');
        console.log('////////////////////////////////////////////////////////////////');
        console.log(queueContract.songs);
        console.log(authorQueue);
        console.log(timestampQueue);
        console.log(loopMarkersQueue);
        console.log('////////////////////////////////////////////////////////////////');
	} else {
        serverQueue.songs.push(song);
        // TODO
        // maybe implement nickname
        // 
        console.log('Attempting to add video to queue.');
        console.log(message.author["lastMessage"]["member"]["user"]["username"]);
        //authorQueue.push(message.author["lastMessage"]["member"]["user"]["username"]);//authorQueue[authorQueue.length] = message.author["username"];
        console.log('////////////////////////////////////////////////////////////////');
        console.log(serverQueue.songs);
        console.log(authorQueue);
        console.log(timestampQueue);
        console.log(loopMarkersQueue);
        console.log('////////////////////////////////////////////////////////////////');
        let vq = videoqueue(message, serverQueue, false, authorQueue, loopMarkersQueue);
		return message.channel.send(`Added to the queue: ${song.title}\n\n Current Queue:\n` + '```\n' + vq +'\n```');
	}

}

// needs to be global to change the volume
var dispatcher;

async function play(message, guild, song, authorQueue, args, timestampQueue, loopMarkersQueue) {
    console.log('################################################################');
    console.log("PLAY FUNCTION CALLED");
	const serverQueue = await queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        play_status = false;
		return message.channel.send(`No more content to play. (Queue empty)`);
	}

    // check for start timestamp
    if (args.length === 3) {
        console.log("args[1]:");
        console.log(args[1]);
        dispatcher = serverQueue.connection.play(ytdl(song.url, {begin: args[1]/* , filter: 'audioonly', dlChunkSize: 0 */}))
		.on('finish', () => { //old 'end' event
			console.log(`EVENT 'finish' DETECTED. Stream ended, attempting to go to next one.`);
            if(loopMarkersQueue[0] > 0){
                loopMarkersQueue[0]--
            } else if(loopMarkersQueue[0] === 0) {
                serverQueue.songs.shift();
                authorQueue.shift();
                timestampQueue.shift();
                loopMarkersQueue.shift();
            } else {
                console.log(`On indefinite loop...`);
            }
            play(message, guild, serverQueue.songs[0], authorQueue, 2, timestampQueue, loopMarkersQueue);
        })
        .on('error', error => {
            console.log(`EVENT 'error' DETECTED. ERROR on dispatcher = serverQueue.connection.play(ytdl(song.url))`);
			console.error(error);
            console.log(`Attempting a reset.`);
            masterreset(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume, true);
        });
    } else {
        // no timestamp given              /* old playStream */
        dispatcher = serverQueue.connection.play(ytdl(song.url/* , {filter: 'audioonly', dlChunkSize: 0} */))
		.on('finish', () => { //old 'end' event
			console.log(`EVENT 'finish' DETECTED. Stream ended, attempting to go to next one.`);
            if(skip_loop === true){
                loopMarkersQueue[0] = 0;
                skip_loop = false;
            }
            if(loopMarkersQueue[0] > 0){
                loopMarkersQueue[0]--;
            } else if(loopMarkersQueue[0] === 0) {
                serverQueue.songs.shift();
                authorQueue.shift();
                timestampQueue.shift();
                loopMarkersQueue.shift();
            } else { // negative
                console.log(`On indefinite loop...`);
            }
            play(message, guild, serverQueue.songs[0], authorQueue, 2, timestampQueue, loopMarkersQueue);
        })
        .on('error', error => {
            console.log(`EVENT 'error' DETECTED. ERROR on dispatcher = serverQueue.connection.play(ytdl(song.url))`);
			console.error(error);
            console.log(`Attempting a reset.`);
            masterreset(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume, true);
        });
        /*.on('finish', () => {
			console.log('Stream finished, attempting to go to next one.');
            serverQueue.songs.shift();
            authorQueue.shift();
            play(message, guild, serverQueue.songs[0], authorQueue);
		})*/
    }
    
    play_status = true;
    dispatcher.setVolumeLogarithmic(current_volume);
    let vq = videoqueue(message, serverQueue, false, authorQueue, loopMarkersQueue);
    console.log("PLAY FUNCTION NORMAL EXIT");
    console.log('################################################################');
    return message.channel.send(`Now Playing...\n`+ '```\n' + song.title + '\n```' + `Current Queue:\n` + '```\n' + vq +'\n```');
}

//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
////////////////// C O M M A N D S   B E L O W  //////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// role specific
// attempts to reset variables and queues
// should be used whenever some error halts the normal workflow
function masterreset(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume, inner_call){
    console.log('################################################################');
    console.log("MASTERRESET FUNCTION CALLED");
    if (message.member.roles.cache.some(role => role.name === 'Debugador del bot') || inner_call===true) {
        console.log("----------------------------------------------");
        console.log('Called by: ');
        if(inner_call===true){
            console.log("INNER CODE");
        }else{
            console.log(message.author["lastMessage"]["member"]["user"]);
        }
        console.log("----------------------------------------------");
        try{
            if(typeof serverQueue !== 'undefined'){
                if(serverQueue.connection.dispatcher !== null){
                    serverQueue.connection.dispatcher.end();
                    serverQueue.songs.splice(0, serverQueue.songs.length);
                }
            }
            
            console.log('Attempting to reset variables.');
            //serverQueue = queue.get(message.guild.id);
            try{
                flush(message, serverQueue, authorQueue, timestampQueue);
            } catch (err) {
                console.log(err);
            }
            try{
                skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
            } catch (err) {
                console.log(err);
            }
            // flush doesn't clear everything
            authorQueue.splice(0, authorQueue.length);// stupid method of clearing array because js is a little bit of a pain in the rear
            timestampQueue.splice(0, timestampQueue.length);
            loopMarkersQueue.splice(0, loopMarkersQueue.length);
            play_status = false;
            current_volume = initial_volume;
            console.log('Attempted to reset variables.');
            try{
                message.member.voice.channel.leave();
            } catch (err) { 
                console.log("**********************************************");
                console.log("Failed to leave voice channel. Maybe Ud wasn't in one to begin with?");
                console.log("----------------------------------------------");
                console.log(err);
                console.log("----------------------------------------------");
                console.log("Retry of masterreset");
                masterreset(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume, inner_call);
                console.log("**********************************************");
            }
            console.log('################################################################');
            message.channel.send('Attempted a master reset.');
            return;
        } catch (err) {
            console.log("**********************************************");
            console.log("MASTERRESET FUNCTION FAILED");
            console.log("----------------------------------------------");
            console.log(err);
            console.log("**********************************************");
            console.log('################################################################');
            return;
        }
    } else {
        message.channel.send('Access denied.');
        console.log(message.author["lastMessage"]["member"]["user"]);
        console.log('User does not have \'Debugador del bot\' role.');
        console.log('MASTERRESET FUNCTION NORMAL EXIT.');
        console.log('################################################################');
        return;
    }
    
}

// role specific
// displays some variavles on console and on chat for debugging purposes
function detailedstatus(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume){
    console.log('################################################################');
    console.log("DETAILEDSTATUS FUNCTION CALLED");
    if (message.member.roles.cache.some(role => role.name === 'Debugador del bot')) {
        console.log("----------------------------------------------");
        console.log('Called by: ');
        console.log(message.author["lastMessage"]["member"]["user"]);
        console.log("----------------------------------------------");
        try{
            let display_songs = '\nn/a';
            if(typeof serverQueue !== 'undefined'){
                display_songs = '\n';
                for (var m in serverQueue){
                    for (var i=0; i<serverQueue[m].length; i++){
                        display_songs += i+' {\n';
                        display_songs += 'title: '+serverQueue[m][i].title+'\n';
                        display_songs += 'url: '+serverQueue[m][i].url+'\n';
                        display_songs += 'time: '+serverQueue[m][i].time+'\n';
                        display_songs += '}\n';
                    }
                }
            }
            let dashes = '\n----------------------------------------------\n';
            let detailed_text = '```\n'+'serverQueue.songs:'+display_songs+dashes+
                                        'authorQueue:\n'+authorQueue+dashes+
                                        'timestampQueue:\n'+timestampQueue+dashes+
                                        'loopMarkersQueue:\n'+loopMarkersQueue+dashes+
                                        'play_status:\n'+play_status+dashes+
                                        'current_volume:\n'+current_volume+dashes;
            detailed_text += `Node.js Version: ${process.version}\n`+`discord.js Version: ${Discord.version}\n`+`ytdl-core Version: ${ytdl.version}\n`+`discord-youtube-api Version: ${YouTube.version}`+'\n```';
            message.channel.send(detailed_text);

            ///////////////////////////////////////////////////////////////////////
            console.log('serverQueue.songs:');
            console.log(display_songs);
            console.log('----------------------------------------------');
            console.log('authorQueue:');
            console.log(authorQueue);
            console.log("----------------------------------------------");
            console.log('timestampQueue:');
            console.log(timestampQueue);
            console.log("----------------------------------------------");
            console.log('loopMarkersQueue:');
            console.log(loopMarkersQueue);
            console.log("----------------------------------------------");
            console.log('play_status:');
            console.log(play_status);
            console.log("----------------------------------------------");
            console.log('current_volume:');
            console.log(current_volume);
            console.log("----------------------------------------------");
            console.log(`Node.js Version: ${process.version}`);
            console.log(`discord.js Version: ${Discord.version}`);
            console.log(`ytdl-core Version: ${ytdl.version}`);
            console.log(`discord-youtube-api Version: ${YouTube.version}`);
            console.log("----------------------------------------------");

            console.log('DETAILEDSTATUS FUNCTION NORMAL EXIT.');
            console.log('################################################################');
            return;
        } catch (err) {
            console.log("**********************************************");
            console.log("DETAILEDSTATUS FUNCTION FAILED");
            console.log("----------------------------------------------");
            console.log(err);
            console.log("**********************************************");
            console.log('################################################################');
            return;
        }
    } else {
        message.channel.send('Access denied.');
        console.log(message.author["lastMessage"]["member"]["user"]);
        console.log('User does not have \'Debugador del bot\' role.');
        console.log('DETAILEDSTATUS FUNCTION NORMAL EXIT.');
        console.log('################################################################');
        return;
    }
}


// prints song queue
function videoqueue(message, serverQueue, return_message, authorQueue, loopMarkersQueue){
    console.log('################################################################');
    console.log("VIDEOQUEUE FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    try{
        let vq = "";
        let user_lengths = [];
        let loop_lengths = []
        
        for (var i=0; i<authorQueue.length; i++){
            user_lengths.push(authorQueue[i].length);
            if(loopMarkersQueue[i] < 0){
                loop_lengths.push(1);
            } else {
                loop_lengths.push(loopMarkersQueue[i].toString().length);
            }
            
        }
        let max_username_length = Math.max.apply(Math, user_lengths);
        let max_loop_length = Math.max.apply(Math, loop_lengths);

        for (var m in serverQueue){
            for (var i=0; i<serverQueue[m].length; i++){
                var converted_time = secondsToHms(serverQueue[m][i].time);

                var space_padding = "";
                for (var j=0; j<max_username_length - user_lengths[i].length; j++){
                    space_padding += " ";
                }

                var loop_padding = "";
                for (var j=0; j<max_loop_length - loop_lengths[i].length; j++){
                    loop_padding += " ";
                }

                var loop_string;

                if(loopMarkersQueue[i] === -1){
                    loop_string = "∞";
                } else {
                    loop_string = loopMarkersQueue[i].toString();
                }

                var index_padding = "";
                var spaces = (serverQueue[m].length - 1).toString().length - (i).toString().length;
                for (var j=0; j<spaces; j++){
                    index_padding += " "
                }

                vq = vq + "|  " + index_padding + i + "  |  " + space_padding + authorQueue[i] + "  |  " + loop_padding + loop_string + "  | " + "(" + converted_time + ") "+ serverQueue[m][i].title + "\n";
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
    } catch (err) {
        console.log("**********************************************");
        console.log("VIDEOQUEUE FUNCTION FAILED");
        console.log("----------------------------------------------");
        console.log(err);
        console.log("**********************************************");
        console.log('################################################################');
    }
    
}

// flag for forcing content on loop out of the queues
var skip_loop = false;
// end current song/video being played and goes to next element in queue
function skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (!serverQueue) return message.channel.send('There is no song that I could skip.');
    console.log('################################################################');
    console.log("SKIP FUNCTION CALLED");
    try{
        try{
            skip_loop = true;
            serverQueue.connection.dispatcher.end() //.stopPlaying() replaces .end()?
            console.log('Music ended?.');
            console.log("SKIP FUNCTION NORMAL EXIT");
            console.log('################################################################');
        } catch (err) {
            queue = new Map();
            serverQueue = queue.get(message.guild.id);
            serverQueue.songs.shift();
            authorQueue.shift();
            loopMarkersQueue.shift();
            timestampQueue.shift();
            skip_loop = false;
        }
        /*serverQueue.songs.shift();
        authorQueue.shift();
        play(message, message.guild, serverQueue.songs[0], authorQueue);*/
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
function stop(message, serverQueue, timestampQueue, authorQueue, loopMarkersQueue) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    console.log('################################################################');
    console.log("STOP FUNCTION CALLED");
    try{
        serverQueue.connection.dispatcher.end(); //.stopPlaying() replaces .end()?
        authorQueue = authorQueue.splice(0, authorQueue.length); // stupid method of clearing array because js is a little bit of a pain in the rear
        loopMarkersQueue = loopMarkersQueue.splice(0, loopMarkersQueue.length);
        timestampQueue = timestampQueue.splice(0, timestampQueue.length);
        serverQueue.songs = [];
        /*play(message, message.guild, serverQueue.songs[0], authorQueue);*/
        console.log('All operations halted.');
        play_status = false;
        skip_loop = true;
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
    if(value.charAt(0) === " "){
        value = value.substring(1);
    }
    if(/^([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)){
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
function flush(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue){
    console.log('################################################################');
    console.log("FLUSH FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var counter = 0;
    while( counter < serverQueue.songs.length-1){
        serverQueue.songs.pop();
        authorQueue.pop();
        timestampQueue.pop()
        loopMarkersQueue.pop()
    }
    console.log("FLUSH FUNCTION EXIT");
    console.log('################################################################');
    return message.channel.send('Queue has been flushed.');
}

// removes song from queue based on its index/number
function remove(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue){
    console.log('################################################################');
    console.log("REMOVE FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var value = message.content.substring(7);

    if(value === ""){
        console.log('################################################################');
        skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
    } 
    if(value.charAt(0) === " "){
        value = value.substring(1);
    }
    if(/^(([0-9])|([0-9])([0-9]))$/.test(value)){ // can only remove up to index 99
        value = Number(value);
        if (value === 0) {
            console.log('################################################################');
            //return message.channel.send('Can\'t remove song currently playing. (use !skip for that)');
            skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        } else if (value < serverQueue.songs.length){
            var song_name = serverQueue.songs[value].title;
            var song_requester = authorQueue[value];
            serverQueue.songs.splice(value, 1);
            authorQueue.splice(value, 1);
            loopMarkersQueue.splice(value, 1);
            console.log('################################################################');
            return message.channel.send("```Removed from the Queue:\n| " + value + " | " + song_requester + " | " + song_name + "\n```");
        } else {
            console.log('################################################################');
            return message.channel.send('Could not find number' + ```\n``` + value + ```\n``` + 'in the Queue.');
        }
    } else {
        console.log('################################################################');
        return message.channel.send('Could not get the content number.');
    }
}


// marks content as loopable (0: no loop, n: loop n times, -1: loop indefinitely), defaults to loop the first content indefinitely (n=-1)
function loop(message, serverQueue, authorQueue, loopMarkersQueue){
    console.log('################################################################');
    console.log("LOOP FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var value = message.content.substring(5);

    if(value === "" && loopMarkersQueue.length > 0){
        loopMarkersQueue[0] = -1
        console.log('################################################################');
        return message.channel.send('Looping first content indefinitely...');
    } else if (value === "") {
        console.log('Attempted loop, but loopMarkerQueue was empty.');
        console.log('################################################################');
        return;
    }
    if(value.charAt(0) === " "){
        value = value.substring(1);
    }
    let index_repeat = value.split(" ");

    if (/^(([0-9])|([0-9])([0-9]))$/.test(index_repeat[0])){ // can only remove up to index 99
        index_repeat[0] = Number(index_repeat[0]);
        var song_name = serverQueue.songs[index_repeat[0]].title;
        var song_requester = authorQueue[index_repeat[0]];
        if (index_repeat.length === 1){ // loop index indefinitely    
            loopMarkersQueue[index_repeat[0]] = -1;
            console.log('################################################################');
            return message.channel.send("```Looping:\n| " + index_repeat[0] + "  |  " + song_requester + "  |  ∞  | " + song_name + "\n```");
        } else if(index_repeat.length === 2){
            if (/^(([0-9])|([0-9])([0-9]))$/.test(index_repeat[1])){ // check number of times to loop
                index_repeat[1] = Number(index_repeat[1]);
                loopMarkersQueue[index_repeat[0]] = index_repeat[1];
                console.log('################################################################');
                return message.channel.send("```Looping:\n|  " + index_repeat[0] + "  |  " + song_requester + "  |  " + index_repeat[1] + "  | " + song_name + "\n```");
            } else {
                console.log('################################################################');
                return message.channel.send('Could not understand number of loops/repetitions.');    
            }
        } else {
            console.log('################################################################');
            return message.channel.send('Could not find number' + ```\n``` + value + ```\n``` + 'in the Queue.');
        }
    } else {
        console.log('################################################################');
        return message.channel.send('Could not get the content number.');
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