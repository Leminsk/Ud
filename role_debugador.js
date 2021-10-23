const general_lib = require('./general_functions.js');
const queue_lib = require('./queue_functions.js');
const pjson = require('./package.json');
const Discord = require('discord.js');
const ytdl = require('ytdl-core');
const YouTube = require('discord-youtube-api');

// role specific
// attempts to reset variables and queues
// should be used whenever some error halts the normal workflow
function masterreset(message, shared, inner_call){
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
                if(shared.serverQueue.connection.dispatcher !== null){
                    shared.serverQueue.connection.dispatcher.end();
                    try{
                        shared.serverQueue.songs.splice(0, shared.authorQueue.length);
                    } catch(err) {
                        console.log(err);
                    }
                }
            }
            
            console.log('Attempting to reset variables.');
            //serverQueue = queue.get(message.guild.id);
            try{
                queue_lib.flush(message, shared, true);
            } catch (err) {
                console.log(err);
            }
            try{
                queue_lib.skip(message, shared, true);
            } catch (err) {
                console.log(err);
            }
            // flush doesn't clear everything
            shared.authorQueue.splice(0, shared.authorQueue.length);// stupid method of clearing array because js is a little bit of a pain in the rear
            shared.timestampQueue.splice(0, shared.timestampQueue.length);
            shared.loopMarkersQueue.splice(0, shared.loopMarkersQueue.length);
            shared.play_status = false;
            shared.current_volume = shared.initial_volume;
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
                masterreset(message, shared, inner_call);
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
function detailedstatus(message, shared){
    general_lib.displayConsoleElement('#', 64);
    console.log("DETAILEDSTATUS FUNCTION CALLED");
    if (message.member.roles.cache.some(role => role.name === 'Debugador del bot' || role.name === 'Debugador')) {
        general_lib.displayConsoleElement('-', 46);
        console.log('Called by: ');
        console.log(message.author["lastMessage"]["member"]["user"]);
        general_lib.displayConsoleElement('-', 46);
        try{
            let display_songs = '\nn/a';
            if(typeof shared.serverQueue !== 'undefined'){
                display_songs = '\n';
                for (var m in shared.serverQueue){
                    for (var i=0; i<shared.serverQueue[m].length; i++){
                        display_songs += i + ' {\n';
                        display_songs += 'title: ' + shared.serverQueue[m][i].title + '\n';
                        display_songs += 'url: '   + shared.serverQueue[m][i].url   + '\n';
                        display_songs += 'time: '  + shared.serverQueue[m][i].time  + '\n';
                        display_songs += '}\n';
                    }
                }
            }
            let dashes = '\n----------------------------------------------\n';
            let detailed_text = '```\n'+'serverQueue.songs:'  + display_songs           + dashes+
                                        'authorQueue:\n'      + shared.authorQueue      + dashes+
                                        'timestampQueue:\n'   + shared.timestampQueue   + dashes+
                                        'loopMarkersQueue:\n' + shared.loopMarkersQueue + dashes+
                                        'play_status:\n'      + shared.play_status      + dashes+
                                        'current_volume:\n'   + shared.current_volume   + dashes;
            detailed_text += `Node.js Version: ${process.version}\n`
                            +`discord.js Version: ${Discord.version}\n`
                            +`ytdl-core Version: ${ytdl.version}\n`
                            +`discord-youtube-api Version: ${YouTube.version}\n`
                            +`Ud Version: ${pjson.version}`
                            +'\n```';
            message.channel.send(detailed_text);

            ///////////////////////////////////////////////////////////////////////
            console.log('serverQueue.songs:');
            console.log(display_songs);
            general_lib.displayConsoleElement('-', 46);
            console.log('authorQueue:');
            console.log(shared.authorQueue);
            general_lib.displayConsoleElement('-', 46);
            console.log('timestampQueue:');
            console.log(shared.timestampQueue);
            general_lib.displayConsoleElement('-', 46);
            console.log('loopMarkersQueue:');
            console.log(shared.loopMarkersQueue);
            general_lib.displayConsoleElement('-', 46);
            console.log('play_status:');
            console.log(shared.play_status);
            general_lib.displayConsoleElement('-', 46);
            console.log('current_volume:');
            console.log(shared.current_volume);
            general_lib.displayConsoleElement('-', 46);
            console.log(`Node.js Version: ${process.version}`);
            console.log(`discord.js Version: ${Discord.version}`);
            console.log(`ytdl-core Version: ${ytdl.version}`);
            console.log(`discord-youtube-api Version: ${YouTube.version}`);
            console.log(`Ud version: ${pjson.version}`);
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