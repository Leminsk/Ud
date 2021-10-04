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

/* console text divider */
function displayConsoleElement(char, amount){
    console.log( char.repeat(amount) );
}


module.exports = { secondsToHms, round2decimal, displayConsoleElement, displayConsoleElement };