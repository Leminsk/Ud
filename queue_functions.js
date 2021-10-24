const general_lib = require('./general_functions.js');




// end current song/video being played and goes to next element in queue
function skip(message, shared, inner_call) {
    if (!message.member.voice.channel && !inner_call) return message.channel.send('You have to be in a voice channel.');
    general_lib.displayConsoleElement('#', 64);
    console.log("SKIP FUNCTION CALLED");
    try{
        try{
            shared.skip_loop = true;
            shared.serverQueue.connection.dispatcher.end() //.stopPlaying() replaces .end()?
            console.log('Music ended?.');
            console.log("SKIP FUNCTION NORMAL EXIT");
        } catch (err) {
            shared.authorQueue.shift();
            shared.loopMarkersQueue.shift();
            shared.timestampQueue.shift();
            shared.skip_loop = false;
            shared.queue = new Map();
            shared.serverQueue = shared.queue.get(message.guild.id);
            try{
                shared.serverQueue.songs.shift();
            } catch (err) {
                console.log("SKIP FUNCTION FAILED");
                console.log(err)
                general_lib.displayConsoleElement('-', 46);
                return;
            }
            
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
    return;
}



// clears all queues and ends current song/video/stream
function stop(message, shared) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    general_lib.displayConsoleElement('#', 64);
    console.log("STOP FUNCTION CALLED");
    try{
        shared.serverQueue.connection.dispatcher.end(); //.stopPlaying() replaces .end()?
        shared.authorQueue = authorQueue.splice(0, authorQueue.length); // stupid method of clearing array because js is a little bit of a pain in the rear
        shared.loopMarkersQueue = loopMarkersQueue.splice(0, loopMarkersQueue.length);
        shared.timestampQueue = timestampQueue.splice(0, timestampQueue.length);
        shared.serverQueue.songs = [];
        /*play(message, message.guild, serverQueue.songs[0], authorQueue);*/
        console.log('All operations halted.');
        shared.play_status = false;
        shared.skip_loop = true;
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
    return;
}




function pause(message, shared) {
    general_lib.displayConsoleElement('#', 64);
    console.log("PAUSE FUNCTION CALLED");
    //return;
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (!play_status) return message.channel.send('Already paused.');
    try{
        shared.serverQueue.connection.dispatcher.pause(true);
        console.log("PAUSE FUNCTION NORMAL EXIT");
        play_status = false;
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
    return;
}


// only supposed to be used after after !pause
function resume(message, shared) {
    general_lib.displayConsoleElement('#', 64);
    console.log("RESUME FUNCTION CALLED");
    //return;
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    if (play_status) return message.channel.send('No video to resume.');
    try{
        shared.serverQueue.connection.dispatcher.resume(true);
        console.log("RESUME FUNCTION NORMAL EXIT");
        shared.play_status = true;
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
    return;
}


// prints song queue
function videoqueue(message, shared, return_message){
    general_lib.displayConsoleElement('#', 64);
    console.log("VIDEOQUEUE FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    try{
        let vq = "";
        let user_lengths = [];
        let loop_lengths = []
        
        for (var i=0; i<shared.authorQueue.length; i++){

            user_lengths.push(shared.authorQueue[i].length);

            if(shared.loopMarkersQueue[i] < 0){
                loop_lengths.push(1);
            } else {
                loop_lengths.push(shared.loopMarkersQueue[i].toString().length);
            }
            
        }
        let max_username_length = Math.max.apply(Math, user_lengths);
        let max_loop_length = Math.max.apply(Math, loop_lengths);

        for (var m in shared.serverQueue){
            for (var i=0; i<shared.serverQueue[m].length; i++){
                var converted_time = general_lib.secondsToHms(shared.serverQueue[m][i].time);

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
                var spaces = (shared.serverQueue[m].length - 1).toString().length - (i).toString().length;
                for (var j=0; j<spaces; j++){
                    index_padding += " "
                }

                vq = vq + "|  " + index_padding + i + "  |  " + space_padding + authorQueue[i] + "  |  " + loop_padding + loop_string + "  | " + "(" + converted_time + ") "+ shared.serverQueue[m][i].title + "\n";
            }
        }

        if (return_message === true){
            if (vq.length === 0) {
                console.log("VIDEOQUEUE FUNCTION EMPTY QUEUE EXIT");
                return message.channel.send('The queue is empty.');
            } else {
                console.log("VIDEOQUEUE FUNCTION QUEUE DISPLAY EXIT");
                return message.channel.send('```\n' + String.raw`${vq}` + '\n```');
            }
        } else {
            console.log("VIDEOQUEUE FUNCTION VALUE RETURNED");
            return vq;
        }
    } catch (err) {
        general_lib.displayConsoleElement('*', 46);
        console.log("VIDEOQUEUE FUNCTION FAILED");
        
        var inner_vars =  { message, return_message, vq, user_lengths, loop_lengths, max_username_length, max_loop_length };
        var output_vars = { shared, inner_vars };

        general_lib.displayVariables(output_vars);
        
        console.log(err);
        general_lib.displayConsoleElement('*', 46);
        general_lib.displayConsoleElement('#', 64);
    }
    
}




// empty the queue except for the song playing (song 0)
function flush(message, shared, inner_call){
    general_lib.displayConsoleElement('#', 64);
    console.log("FLUSH FUNCTION CALLED");
    if (!message.member.voice.channel && !inner_call) return message.channel.send('You have to be in a voice channel.');
    var counter = 0;
    while( counter < serverQueue.songs.length-1){
        shared.serverQueue.songs.pop();
        shared.authorQueue.pop();
        shared.timestampQueue.pop()
        shared.loopMarkersQueue.pop()
    }
    console.log("FLUSH FUNCTION EXIT");
    general_lib.displayConsoleElement('#', 64);
    return message.channel.send('Queue has been flushed.');
}


// removes song from queue based on its index/number
function remove(message, shared){
    general_lib.displayConsoleElement('#', 64);
    console.log("REMOVE FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    var value = message.content.substring(7);

    if(value === ""){
        skip(message, shared, true);
    } 
    if(value.charAt(0) === " "){
        value = value.substring(1);
    }
    if(/^(([0-9])|([0-9])([0-9]))$/.test(value)){ // can only remove up to index 99
        value = Number(value);
        if (value === 0) {
            //return message.channel.send('Can\'t remove song currently playing. (use !skip for that)');
            skip(message, shared, true);
        } else if (value < shared.serverQueue.songs.length){
            var song_name = shared.serverQueue.songs[value].title;
            var song_requester = shared.authorQueue[value];
            shared.serverQueue.songs.splice(value, 1);
            shared.authorQueue.splice(value, 1);
            shared.loopMarkersQueue.splice(value, 1);
            return message.channel.send("Removed from the Queue:\n```| " + value + " | " + song_requester + " | " + song_name + "\n```");
        } else {
            return message.channel.send('Could not find number' + ```\n``` + value + ```\n``` + 'in the Queue.');
        }
    } else {
        return message.channel.send('Could not get the content number.');
    }
}

// marks content as loopable (0: no loop, n: loop n times, -1: loop indefinitely), defaults to loop the first content indefinitely (n=-1)
function loop(message, shared){
    general_lib.displayConsoleElement('#', 64);
    console.log("LOOP FUNCTION CALLED");
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');

    var value = message.content.substring(5);

    if(value === "" && shared.loopMarkersQueue.length > 0){

        shared.loopMarkersQueue[0] = -1
        general_lib.displayConsoleElement('#', 64);
        return message.channel.send('Looping first content indefinitely...');

    } else if (value === "") {

        console.log('Attempted loop, but loopMarkersQueue was empty.');
        general_lib.displayConsoleElement('#', 64);
        return;

    }

    if(value.charAt(0) === " "){
        value = value.substring(1);
    }
    let index_repeat = value.split(" ");


    if (/^(([0-9])|([0-9])([0-9]))$/.test(index_repeat[0])){ // can only remove up to index 99
        index_repeat[0] = Number(index_repeat[0]);
        var song_name = shared.serverQueue.songs[index_repeat[0]].title;
        var song_requester = shared.authorQueue[index_repeat[0]];

        if (index_repeat.length === 1){ // loop index indefinitely    

            shared.loopMarkersQueue[index_repeat[0]] = -1;
            general_lib.displayConsoleElement('#', 64);
            return message.channel.send("```Looping:\n| " + index_repeat[0] + "  |  " + song_requester + "  |  ∞  | " + song_name + "\n```");

        } else if(index_repeat.length === 2){

            if (/^(([0-9])|([0-9])([0-9]))$/.test(index_repeat[1])){ // check number of times to loop

                index_repeat[1] = Number(index_repeat[1]);
                shared.loopMarkersQueue[index_repeat[0]] = index_repeat[1];
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






module.exports = { videoqueue, skip, stop, pause, resume, flush, remove, loop };