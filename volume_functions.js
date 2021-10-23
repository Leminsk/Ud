const general_lib = require('./general_functions.js');

// sets volume to a certain percentage (minimum 0, maximum 200)
function volume(message, shared){
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');

    var value = message.content.substring(4);

    if (value.includes("ume")){
        value = value.substring(3);
    }

    if(value.charAt(0) === " "){
        value = value.substring(1);
    }

    if(/^([0-9]+(\.[0-9]+)?|Infinity)$/.test(value)){
        value = Number(value);
        if (value >= 0 && value <= 200){
            shared.current_volume = value/100;
            if (shared.dispatcher != null){
                shared.dispatcher.setVolumeLogarithmic(shared.current_volume);
            }
            
            text_value = shared.current_volume*100;
            return message.channel.send(`Current volume: ${text_value}`);
        } else {
            return message.channel.send('Invalid volume range. (0.00 ~ 200.00)');
        }
    } else {
        return message.channel.send('Could not understand volume.');
    }
}


// increase current volume by 20%
function vup(message, shared) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    shared.current_volume = 1.2*shared.current_volume;
    // ceiling value
    if (shared.current_volume >= 2) {
        shared.current_volume = 2;
    }
    if (shared.dispatcher != null){
        shared.dispatcher.setVolumeLogarithmic(shared.current_volume);
    }
    text_value = general_lib.round2decimal(shared.current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


// increase current volume by 50%
function vUP(message, shared) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    shared.current_volume = 1.5*shared.current_volume;
    // ceiling value
    if (shared.current_volume >= 2) {
        shared.current_volume = 2;
    }
    if (shared.dispatcher != null){
        shared.dispatcher.setVolumeLogarithmic(shared.current_volume);
    }
    text_value = general_lib.round2decimal(shared.current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


// decrease current volume by 20%
function vdown(message, shared) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    shared.current_volume = 0.8*shared.current_volume;
    // floor value
    if (shared.current_volume <= 0) {
        shared.current_volume = 0;
    }
    if (shared.dispatcher != null){
        shared.dispatcher.setVolumeLogarithmic(shared.current_volume);
    }
    text_value = general_lib.round2decimal(shared.current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


// decrease current volume by 50%
function vDOWN(message, shared) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    shared.current_volume = 0.5*shared.current_volume;
    // floor value
    if (shared.current_volume <= 0) {
        shared.current_volume = 0;
    }
    if (shared.dispatcher != null){
        shared.dispatcher.setVolumeLogarithmic(shared.current_volume);
    }
    text_value = general_lib.round2decimal(shared.current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


// reset volume to its initial value (0.25)
function vreset(message, shared){
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    shared.current_volume = initial_volume;

    if (shared.dispatcher != null){
        shared.dispatcher.setVolumeLogarithmic(shared.current_volume);
    }

    text_value = general_lib.round2decimal(shared.current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


module.exports = { volume, vup, vUP, vdown, vDOWN, vreset };