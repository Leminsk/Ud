const general_lib = require('./general_functions.js');



//async
async function execute(message, shared) {
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

    shared.authorQueue.push(message.author["lastMessage"]["member"]["user"]["username"]);//authorQueue[authorQueue.length] = message.author["username"];
    loopMarkersQueue.push(0);
    if (args.length === 3){
        timestampQueue.push(args[1]);
    } else {
        timestampQueue.push('0');
    }


	if (!shared.serverQueue || shared.serverQueue.songs.length === 0) {
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
            play(message, message.guild, queueContract.songs[0], shared, args);
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
        console.log(shared.authorQueue);
        console.log(shared.timestampQueue);
        console.log(shared.loopMarkersQueue);
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
        console.log(shared.serverQueue.songs);
        console.log(shared.authorQueue);
        console.log(shared.timestampQueue);
        console.log(shared.loopMarkersQueue);
        general_lib.displayConsoleElement('/', 64);
        let vq = queue_lib.videoqueue(message, shared, false);
		return message.channel.send(`Added to the queue: ${song.title}\n\n Current Queue:\n` + '```\n' + vq +'\n```');
	}

}



async function play(message, guild, song, shared, args) {
    general_lib.displayConsoleElement('#', 64);
    console.log("PLAY FUNCTION CALLED");
	const serverQueue = await queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        shared.play_status = false;
		return message.channel.send(`No more content to play. (Queue empty)`);
	}

    // check for start timestamp
    if (args.length === 3) {
        console.log("args[1]:");
        console.log(args[1]);
        shared.dispatcher = serverQueue.connection.play(ytdl(song.url, {begin: args[1]/* , filter: 'audioonly', dlChunkSize: 0 */}))
		.on('finish', () => { //old 'end' event
			console.log(`EVENT 'finish' DETECTED. Stream ended, attempting to go to next one.`);
            if(shared.loopMarkersQueue[0] > 0){
                shared.loopMarkersQueue[0]--
            } else if(shared.loopMarkersQueue[0] === 0) {
                serverQueue.songs.shift();
                shared.authorQueue.shift();
                shared.timestampQueue.shift();
                shared.loopMarkersQueue.shift();
            } else {
                console.log(`On indefinite loop...`);
            }
            play(message, guild, serverQueue.songs[0], shared, 2);
        })
        .on('error', error => {
            console.log(`EVENT 'error' DETECTED. ERROR on dispatcher = serverQueue.connection.play(ytdl(song.url))`);
			console.error(error);
            console.log(`Attempting a reset.`);
            masterreset(message, serverQueue, shared.authorQueue, shared.timestampQueue, shared.loopMarkersQueue, shared.current_volume, true);
        });
    } else {
        // no timestamp given              /* old playStream */
        shared.dispatcher = serverQueue.connection.play(ytdl(song.url/* , {filter: 'audioonly', dlChunkSize: 0} */))
		.on('finish', () => { //old 'end' event
			console.log(`EVENT 'finish' DETECTED. Stream ended, attempting to go to next one.`);
            if(shared.skip_loop === true){
                shared.loopMarkersQueue[0] = 0;
                shared.skip_loop = false;
            }
            if(shared.loopMarkersQueue[0] > 0){
                shared.loopMarkersQueue[0]--;
            } else if(shared.loopMarkersQueue[0] === 0) {
                serverQueue.songs.shift();
                shared.authorQueue.shift();
                shared.timestampQueue.shift();
                shared.loopMarkersQueue.shift();
            } else { // negative
                console.log(`On indefinite loop...`);
            }
            play(message, guild, serverQueue.songs[0], shared, 2);
        })
        .on('error', error => {
            console.log(`EVENT 'error' DETECTED. ERROR on dispatcher = serverQueue.connection.play(ytdl(song.url))`);
			console.error(error);
            console.log(`Attempting a reset.`);
            masterreset(message, serverQueue, shared.authorQueue, shared.timestampQueue, shared.loopMarkersQueue, shared.current_volume, true);
        });
        /*.on('finish', () => {
			console.log('Stream finished, attempting to go to next one.');
            serverQueue.songs.shift();
            authorQueue.shift();
            play(message, guild, serverQueue.songs[0], authorQueue);
		})*/
    }
    
    shared.play_status = true;
    shared.dispatcher.setVolumeLogarithmic(current_volume);
    let vq = queue_lib.videoqueue(message, serverQueue, false, authorQueue, loopMarkersQueue);
    console.log("PLAY FUNCTION NORMAL EXIT");
    general_lib.displayConsoleElement('#', 64);

    if(shared.loopMarkersQueue[0] >= 0 ){
        return message.channel.send(`Now Playing...\n`+ '```\n' + song.title + '\n```' + `Current Queue:\n` + '```\n' + vq +'\n```');
    }

}








module.exports = { execute, play };