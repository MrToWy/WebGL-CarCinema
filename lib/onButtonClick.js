function dayOrNight() {
    let button = document.getElementById("dayOrNight");
    if (button.innerHTML === "Day") {
        button.innerHTML = "Night"
    } else {
        button.innerHTML = "Day"
    }
}

function openWindow() {
    let button = document.getElementById("window");
    if (button.innerHTML === "Open Window") {
        button.innerHTML = "Close Window"
    } else {
        button.innerHTML = "Open Window"
    }
}

function hideSettings() {
    let button = document.getElementById("settings");
    if(button.hidden === true){
        button.hidden = false;
    } else {
        button.hidden = true;
    }

}