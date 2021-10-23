const general_lib = require('./general_functions.js');

// role specific
// attempts to reset variables and queues
// should be used whenever some error halts the normal workflow
function masterreset(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume, inner_call){
    general_lib.displayConsoleElement('#', 64);
    console.log("MASTERRESET FUNCTION CALLED");
    if (message.member.roles.cache.some(role => role.name === 'Debugador del bot' || role.name === 'Debugador')  ||  inner_call===true) {
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
        return;
    }
    
}

// role specific
// displays some variavles on console and on chat for debugging purposes
function detailedstatus(message, serverQueue, authorQueue, timestampQueue, loopMarkersQueue, current_volume){
    general_lib.displayConsoleElement('#', 64);
    console.log("DETAILEDSTATUS FUNCTION CALLED");
    if (message.member.roles.cache.some(role => role.name === 'Debugador del bot' || role.name === 'Debugador')) {
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
                        display_songs += i + ' {\n';
                        display_songs += 'title: ' + serverQueue[m][i].title + '\n';
                        display_songs += 'url: '   + serverQueue[m][i].url   + '\n';
                        display_songs += 'time: '  + serverQueue[m][i].time  + '\n';
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


module.exports = { masterreset, detailedstatus };