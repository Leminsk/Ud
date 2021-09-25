const general_lib = require('./general_functions.js');

// prints song queue
function videoqueue(message, serverQueue, return_message, authorQueue, loopMarkersQueue){
    general_lib.displayConsoleElement('#', 64);
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
                var converted_time = general_lib.secondsToHms(serverQueue[m][i].time);

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
                general_lib.displayConsoleElement('#', 64);
                return message.channel.send('The queue is empty.');
            } else {
                console.log("VIDEOQUEUE FUNCTION QUEUE DISPLAY EXIT");
                general_lib.displayConsoleElement('#', 64);
                return message.channel.send('```\n' + String.raw`${vq}` + '\n```');
            }
        } else {
            console.log("VIDEOQUEUE FUNCTION VALUE RETURNED");
            general_lib.displayConsoleElement('#', 64);
            return vq;
        }
    } catch (err) {
        general_lib.displayConsoleElement('*', 46);
        console.log("VIDEOQUEUE FUNCTION FAILED");
        general_lib.displayConsoleElement('-', 46);
        console.log(err);
        general_lib.displayConsoleElement('*', 46);
        general_lib.displayConsoleElement('#', 64);
    }
    
}



// end current song/video being played and goes to next element in queue
function skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (!serverQueue) return message.channel.send('There is no song that I could skip.');
    general_lib.displayConsoleElement('#', 64);
    console.log("SKIP FUNCTION CALLED");
    try{
        try{
            global.skip_loop = true;
            serverQueue.connection.dispatcher.end() //.stopPlaying() replaces .end()?
            console.log('Music ended?.');
            console.log("SKIP FUNCTION NORMAL EXIT");
            general_lib.displayConsoleElement('#', 64);
        } catch (err) {
            queue = new Map();
            serverQueue = queue.get(message.guild.id);
            serverQueue.songs.shift();
            authorQueue.shift();
            loopMarkersQueue.shift();
            timestampQueue.shift();
            global.skip_loop = false;
        }
        /*serverQueue.songs.shift();
        authorQueue.shift();
        play(message, message.guild, serverQueue.songs[0], authorQueue);*/
        return message.channel.send('Skipping video...');
    } catch (err) {
        general_lib.displayConsoleElement('*', 46);
        console.log("SKIP FUNCTION FAILED");
        general_lib.displayConsoleElement('-', 46);
        console.log(err);
        general_lib.displayConsoleElement('*', 46);
        general_lib.displayConsoleElement('#', 64);
    }
    console.log("SKIP FUNCTION EMPTY EXIT");
    general_lib.displayConsoleElement('#', 64);
    return;
}



// clears all queues and ends current song/video/stream
function stop(message, serverQueue, timestampQueue, authorQueue, loopMarkersQueue) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    general_lib.displayConsoleElement('#', 64);
    console.log("STOP FUNCTION CALLED");
    try{
        serverQueue.connection.dispatcher.end(); //.stopPlaying() replaces .end()?
        authorQueue = authorQueue.splice(0, authorQueue.length); // stupid method of clearing array because js is a little bit of a pain in the rear
        loopMarkersQueue = loopMarkersQueue.splice(0, loopMarkersQueue.length);
        timestampQueue = timestampQueue.splice(0, timestampQueue.length);
        serverQueue.songs = [];
        /*play(message, message.guild, serverQueue.songs[0], authorQueue);*/
        console.log('All operations halted.');
        global.play_status = false;
        global.skip_loop = true;
        general_lib.displayConsoleElement('#', 64);
        return message.channel.send('Video has been stopped and queues have been cleared.');
    } catch (err) {
        general_lib.displayConsoleElement('*', 46);
        console.log("STOP FUNCTION FAILED");
        general_lib.displayConsoleElement('-', 46);
        console.log(err);
        general_lib.displayConsoleElement('*', 46);
        general_lib.displayConsoleElement('#', 64);
    }
    console.log("STOP FUNCTION EMPTY EXIT");
    general_lib.displayConsoleElement('#', 64);
    return;
}




function pause(message, serverQueue) {
    general_lib.displayConsoleElement('#', 64);
    console.log("PAUSE FUNCTION CALLED");
    general_lib.displayConsoleElement('#', 64);
    //return;
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (!global.play_status) return message.channel.send('Already paused.');
    try{
        serverQueue.connection.dispatcher.pause(true);
        console.log("PAUSE FUNCTION NORMAL EXIT");
        global.play_status = false;
        general_lib.displayConsoleElement('#', 64);
        return message.channel.send('Song paused.');
    } catch (err) {
        general_lib.displayConsoleElement('*', 46);
        console.log("PAUSE FUNCTION FAILED");
        general_lib.displayConsoleElement('-', 46);
        console.log(err);
        general_lib.displayConsoleElement('*', 46);
        general_lib.displayConsoleElement('#', 64);
    }
    console.log("PAUSE FUNCTION EMPTY EXIT");
    general_lib.displayConsoleElement('#', 64);
    return;
}


// only supposed to be used after after !pause
function resume(message, serverQueue) {
    general_lib.displayConsoleElement('#', 64);
    console.log("RESUME FUNCTION CALLED");
    general_lib.displayConsoleElement('#', 64);
    //return;
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (global.play_status) return message.channel.send('No video to resume.');
    try{
        serverQueue.connection.dispatcher.resume(true);
        console.log("RESUME FUNCTION NORMAL EXIT");
        global.play_status = true;
        general_lib.displayConsoleElement('#', 64);
        return message.channel.send('Resuming...');
    } catch (err) {
        general_lib.displayConsoleElement('*', 46);
        console.log("STOP FUNCTION FAILED");
        general_lib.displayConsoleElement('-', 46);
        console.log(err);
        general_lib.displayConsoleElement('*', 46);
        general_lib.displayConsoleElement('#', 64);
    }
    console.log("RESUME FUNCTION EMPTY EXIT");
    general_lib.displayConsoleElement('#', 64);
    return;
}





// empty the queue except for the song playing (song 0)
function flush(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue){
    general_lib.displayConsoleElement('#', 64);
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
    general_lib.displayConsoleElement('#', 64);
    return message.channel.send('Queue has been flushed.');
}


// removes song from queue based on its index/number
function remove(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue){
    general_lib.displayConsoleElement('#', 64);
    console.log("REMOVE FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var value = message.content.substring(7);

    if(value === ""){
        general_lib.displayConsoleElement('#', 64);
        skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
    } 
    if(value.charAt(0) === " "){
        value = value.substring(1);
    }
    if(/^(([0-9])|([0-9])([0-9]))$/.test(value)){ // can only remove up to index 99
        value = Number(value);
        if (value === 0) {
            general_lib.displayConsoleElement('#', 64);
            //return message.channel.send('Can\'t remove song currently playing. (use !skip for that)');
            skip(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue);
        } else if (value < serverQueue.songs.length){
            var song_name = serverQueue.songs[value].title;
            var song_requester = authorQueue[value];
            serverQueue.songs.splice(value, 1);
            authorQueue.splice(value, 1);
            loopMarkersQueue.splice(value, 1);
            general_lib.displayConsoleElement('#', 64);
            return message.channel.send("```Removed from the Queue:\n| " + value + " | " + song_requester + " | " + song_name + "\n```");
        } else {
            general_lib.displayConsoleElement('#', 64);
            return message.channel.send('Could not find number' + ```\n``` + value + ```\n``` + 'in the Queue.');
        }
    } else {
        general_lib.displayConsoleElement('#', 64);
        return message.channel.send('Could not get the content number.');
    }
}


module.exports = { videoqueue, skip, stop, pause, resume, flush, remove }