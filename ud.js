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
const general_lib = require('./general_functions.js');
const queue_lib = require('./queue_functions.js');



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

// needs to be global to change the volume
var dispatcher;
// flag for forcing content on loop out of the queues
global.skip_loop = false;
// whether a video/song is currently playing
global.play_status = false;

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
ex2: !play 'darude sandstorm'    | search queries must be spaced and must have quotation marks
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

    const serverQueue = queue.get(message.guild.id);
    
    // check for commands
    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}skip`)) {
        queue_lib.skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}stop`)) {
        queue_lib.stop(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}pause`)) {
        queue_lib.pause(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}resume`)) {
        queue_lib.resume(message, serverQueue);
        return;
    } else if (message.content.startsWith(`${prefix}queue`)) {
        queue_lib.videoqueue(message, serverQueue, true, authorQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}vup`)) {
        volume_lib.vup(message, dispatcher, current_volume);
        return;
    } else if (message.content.startsWith(`${prefix}vUP`) || message.content.startsWith(`${prefix}VUP`)) {
        volume_lib.vUP(message, dispatcher, current_volume);
        return;
    } else if (message.content.startsWith(`${prefix}vdown`)) {
        volume_lib.vdown(message, dispatcher, current_volume);
        return;
    } else if (message.content.startsWith(`${prefix}vDOWN`) || message.content.startsWith(`${prefix}VDOWN`)) {
        volume_lib.vDOWN(message, dispatcher, current_volume);
        return;
    } else if (message.content.startsWith(`${prefix}vreset`)) {
        volume_lib.vreset(message, dispatcher, current_volume);
        return;
    } else if (message.content.startsWith(`${prefix}vol`)) {
        volume_lib.volume(message, dispatcher, current_volume);
        return;
    } else if (message.content.startsWith(`${prefix}flush`)) {
        queue_lib.flush(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        return;
    } else if (message.content.startsWith(`${prefix}remove`)) {
        queue_lib.remove(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
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
    general_lib.displayConsoleElement('/', 64);
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
            general_lib.displayConsoleElement('-', 32);
            console.log(videosearch);
            general_lib.displayConsoleElement('-', 32);
            //console.log(videosearch.url);
            //console.log('----------------------------------');
            console.log(args);
            general_lib.displayConsoleElement('-', 32);
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
        general_lib.displayConsoleElement('/', 64);
        console.log(queueContract.songs);
        console.log(authorQueue);
        console.log(timestampQueue);
        console.log(loopMarkersQueue);
        general_lib.displayConsoleElement('/', 64);
	} else {
        serverQueue.songs.push(song);
        // TODO
        // maybe implement nickname
        // 
        console.log('Attempting to add video to queue.');
        console.log(message.author["lastMessage"]["member"]["user"]["username"]);
        //authorQueue.push(message.author["lastMessage"]["member"]["user"]["username"]);//authorQueue[authorQueue.length] = message.author["username"];
        general_lib.displayConsoleElement('/', 64);
        console.log(serverQueue.songs);
        console.log(authorQueue);
        console.log(timestampQueue);
        console.log(loopMarkersQueue);
        general_lib.displayConsoleElement('/', 64);
        let vq = queue_lib.videoqueue(message, serverQueue, false, authorQueue, loopMarkersQueue);
		return message.channel.send(`Added to the queue: ${song.title}\n\n Current Queue:\n` + '```\n' + vq +'\n```');
	}

}



async function play(message, guild, song, authorQueue, args, timestampQueue, loopMarkersQueue) {
    general_lib.displayConsoleElement('#', 64);
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
    let vq = queue_lib.videoqueue(message, serverQueue, false, authorQueue, loopMarkersQueue);
    console.log("PLAY FUNCTION NORMAL EXIT");
    general_lib.displayConsoleElement('#', 64);

    if(loopMarkersQueue[0] >= 0 ){
        return message.channel.send(`Now Playing...\n`+ '```\n' + song.title + '\n```' + `Current Queue:\n` + '```\n' + vq +'\n```');
    }

}


//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
////////////////// C O M M A N D S   B E L O W  //////////////////
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

// role specific
// attempts to reset variables and queues
// should be used whenever some error halts the normal workflow
function masterreset(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume, inner_call){
    general_lib.displayConsoleElement('#', 64);
    console.log("MASTERRESET FUNCTION CALLED");
    if (message.member.roles.cache.some(role => role.name === 'Debugador del bot') || inner_call===true) {
        general_lib.displayConsoleElement('-', 46);
        console.log('Called by: ');
        if(inner_call===true){
            console.log("INNER CODE");
        }else{
            console.log(message.author["lastMessage"]["member"]["user"]);
        }
        general_lib.displayConsoleElement('-', 46);
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
                queue_lib.flush(message, serverQueue, authorQueue, timestampQueue);
            } catch (err) {
                console.log(err);
            }
            try{
                queue_lib.skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
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
                general_lib.displayConsoleElement('*', 46);
                console.log("Failed to leave voice channel. Maybe Ud wasn't in one to begin with?");
                general_lib.displayConsoleElement('-', 46);
                console.log(err);
                general_lib.displayConsoleElement('-', 46);
                console.log("Retry of masterreset");
                masterreset(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume, inner_call);
                general_lib.displayConsoleElement('*', 46);
            }
            general_lib.displayConsoleElement('#', 64);
            message.channel.send('Attempted a master reset.');
            return;
        } catch (err) {
            general_lib.displayConsoleElement('*', 46);
            console.log("MASTERRESET FUNCTION FAILED");
            general_lib.displayConsoleElement('-', 46);
            console.log(err);
            general_lib.displayConsoleElement('*', 46);
            general_lib.displayConsoleElement('#', 64);
            return;
        }
    } else {
        message.channel.send('Access denied.');
        console.log(message.author["lastMessage"]["member"]["user"]);
        console.log('User does not have \'Debugador del bot\' role.');
        console.log('MASTERRESET FUNCTION NORMAL EXIT.');
        general_lib.displayConsoleElement('#', 64);
        return;
    }
    
}

// role specific
// displays some variavles on console and on chat for debugging purposes
function detailedstatus(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume){
    general_lib.displayConsoleElement('#', 64);
    console.log("DETAILEDSTATUS FUNCTION CALLED");
    if (message.member.roles.cache.some(role => role.name === 'Debugador del bot')) {
        general_lib.displayConsoleElement('-', 46);
        console.log('Called by: ');
        console.log(message.author["lastMessage"]["member"]["user"]);
        general_lib.displayConsoleElement('-', 46);
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
            let detailed_text = '```\n'+'serverQueue.songs:'  + display_songs    + dashes+
                                        'authorQueue:\n'      + authorQueue      + dashes+
                                        'timestampQueue:\n'   + timestampQueue   + dashes+
                                        'loopMarkersQueue:\n' + loopMarkersQueue + dashes+
                                        'play_status:\n'      + play_status      + dashes+
                                        'current_volume:\n'   + current_volume   + dashes;
            detailed_text += `Node.js Version: ${process.version}\n`+`discord.js Version: ${Discord.version}\n`+`ytdl-core Version: ${ytdl.version}\n`+`discord-youtube-api Version: ${YouTube.version}`+'\n```';
            message.channel.send(detailed_text);

            ///////////////////////////////////////////////////////////////////////
            console.log('serverQueue.songs:');
            console.log(display_songs);
            general_lib.displayConsoleElement('-', 46);
            console.log('authorQueue:');
            console.log(authorQueue);
            general_lib.displayConsoleElement('-', 46);
            console.log('timestampQueue:');
            console.log(timestampQueue);
            general_lib.displayConsoleElement('-', 46);
            console.log('loopMarkersQueue:');
            console.log(loopMarkersQueue);
            general_lib.displayConsoleElement('-', 46);
            console.log('play_status:');
            console.log(play_status);
            general_lib.displayConsoleElement('-', 46);
            console.log('current_volume:');
            console.log(current_volume);
            general_lib.displayConsoleElement('-', 46);
            console.log(`Node.js Version: ${process.version}`);
            console.log(`discord.js Version: ${Discord.version}`);
            console.log(`ytdl-core Version: ${ytdl.version}`);
            console.log(`discord-youtube-api Version: ${YouTube.version}`);
            general_lib.displayConsoleElement('-', 46);

            console.log('DETAILEDSTATUS FUNCTION NORMAL EXIT.');
            general_lib.displayConsoleElement('#', 64);
            return;
        } catch (err) {
            general_lib.displayConsoleElement('*', 46);
            console.log("DETAILEDSTATUS FUNCTION FAILED");
            general_lib.displayConsoleElement('-', 46);
            console.log(err);
            general_lib.displayConsoleElement('*', 46);
            general_lib.displayConsoleElement('#', 64);
            return;
        }
    } else {
        message.channel.send('Access denied.');
        console.log(message.author["lastMessage"]["member"]["user"]);
        console.log('User does not have \'Debugador del bot\' role.');
        console.log('DETAILEDSTATUS FUNCTION NORMAL EXIT.');
        general_lib.displayConsoleElement('#', 64);
        return;
    }
}









// marks content as loopable (0: no loop, n: loop n times, -1: loop indefinitely), defaults to loop the first content indefinitely (n=-1)
function loop(message, serverQueue, authorQueue, loopMarkersQueue){
    general_lib.displayConsoleElement('#', 64);
    console.log("LOOP FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var value = message.content.substring(5);

    if(value === "" && loopMarkersQueue.length > 0){
        loopMarkersQueue[0] = -1
        general_lib.displayConsoleElement('#', 64);
        return message.channel.send('Looping first content indefinitely...');
    } else if (value === "") {
        console.log('Attempted loop, but loopMarkerQueue was empty.');
        general_lib.displayConsoleElement('#', 64);
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
            general_lib.displayConsoleElement('#', 64);
            return message.channel.send("```Looping:\n| " + index_repeat[0] + "  |  " + song_requester + "  |  ∞  | " + song_name + "\n```");
        } else if(index_repeat.length === 2){
            if (/^(([0-9])|([0-9])([0-9]))$/.test(index_repeat[1])){ // check number of times to loop
                index_repeat[1] = Number(index_repeat[1]);
                loopMarkersQueue[index_repeat[0]] = index_repeat[1];
                general_lib.displayConsoleElement('#', 64);
                return message.channel.send("```Looping:\n|  " + index_repeat[0] + "  |  " + song_requester + "  |  " + index_repeat[1] + "  | " + song_name + "\n```");
            } else {
                general_lib.displayConsoleElement('#', 64);
                return message.channel.send('Could not understand number of loops/repetitions.');    
            }
        } else {
            general_lib.displayConsoleElement('#', 64);
            return message.channel.send('Could not find number' + ```\n``` + value + ```\n``` + 'in the Queue.');
        }
    } else {
        general_lib.displayConsoleElement('#', 64);
        return message.channel.send('Could not get the content number.');
    }

}



client.login(token);