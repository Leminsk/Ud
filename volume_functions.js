const general_lib = require('./general_functions.js');

// sets volume to a certain percentage (minimum 0, maximum 200)
function volume(message, dispatcher, current_volume){
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


// increase current volume by 20%
function vup(message, dispatcher, current_volume) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = 1.2*current_volume;
    // ceiling value
    if (current_volume >= 2) {
        current_volume = 2;
    }
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = general_lib.round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


// increase current volume by 50%
function vUP(message, dispatcher, current_volume) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = 1.5*current_volume;
    // ceiling value
    if (current_volume >= 2) {
        current_volume = 2;
    }
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = general_lib.round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


// decrease current volume by 20%
function vdown(message, dispatcher, current_volume) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = 0.8*current_volume;
    // floor value
    if (current_volume <= 0) {
        current_volume = 0;
    }
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = general_lib.round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


// decrease current volume by 50%
function vDOWN(message, dispatcher, current_volume) {
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = 0.5*current_volume;
    // floor value
    if (current_volume <= 0) {
        current_volume = 0;
    }
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = general_lib.round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


// reset volume to its initial value (100% or 1)
function vreset(message, dispatcher, current_volume){
    if (!message.member.voice.channel) return message.channel.send('You have to be in a voice channel.');
    current_volume = initial_volume;
    if (dispatcher != null){
        dispatcher.setVolumeLogarithmic(current_volume);
    }
    text_value = general_lib.round2decimal(current_volume*100);
    return message.channel.send(`Current volume: ${text_value}`);
}


module.exports = { volume, vup, vUP, vdown, vDOWN, vreset };