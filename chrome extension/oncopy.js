// Message sending to scripts start hare ------------------------------------------------------
function send_message(message) {
    chrome.runtime.sendMessage(message);
}
// Message sending to scripts ends here --------------------------------------------------------

// Message receiving from scripts start here ---------------------------------------------------
chrome.runtime.onMessage.addListener(received_message);

function received_message(request, sender, sendResponse) {
    switch (request.context) {
        case 'login_check_content':
            if (request.status === 'true') {
                window.addEventListener('mouseup', wordselected);

            }
            break;
    }
}
// Message receiving from scripts ends here ----------------------------------------------------

// Registering for word selection events -------------------------------------------------------
var login_check = {
    'from': 'content',
    'context': 'login_check_content'
};
send_message(login_check);
//----------------------------------------------------------------------------------------------

// Show snackbar -------------------------------------------------------------------------------
function wordselected() {
    var thetext = getSelectionText()
    if (thetext.length > 0) {
        //console.log(thetext) 
        //chrome.runtime.sendMessage(thetext);
        show_snack(thetext);
    }
}

function getSelectionText() {
    var selectedText = "";
    if (window.getSelection) {
        selectedText = window.getSelection().toString();
    }
    return selectedText;
}

function show_snack(selected_text) {

    var selected_data = selected_text;

    if ($('#snackbar').length) {
        $("#snackbar").remove();
    }

    if (selected_text.length > 15) {
        selected_text = selected_text.substring(0, 15) + " ..";
    }

    $('body').append(
        '<style>#snackbar {visibility: hidden;min-width: 300px;margin-left: -125px;background-color: #333;color: #fff;text-align: left;border-radius: 2px;padding: 16px;position: fixed;z-index: 5;left: 50%;bottom: 30px;font-size: 17px;}' +
        '#snackbar.show {visibility: visible;-webkit-animation: fadein 0.5s, fadeout 0.5s 2.5s;animation: fadein 0.5s, fadeout 0.5s 2.5s;}' +
        '#sync {background-color: #333;color: #FFFF00;float: right;outline-width: 0;border: none;display: block;cursor: pointer;}' +
        '@-webkit-keyframes fadein {from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;}}' +
        '@keyframes fadein {from {bottom: 0; opacity: 0;}to {bottom: 30px; opacity: 1;}}' +
        '@-webkit-keyframes fadeout {from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;}}' +
        '@keyframes fadeout {from {bottom: 30px; opacity: 1;}to {bottom: 0; opacity: 0;}}</style>' +
        '<div id="snackbar">' + selected_text + '<div id="sync">SYNC</div></div>'

    );

    var x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function() { x.className = x.className.replace("show", ""); }, 3000);

    $('#sync').click(function(e) {
        e.preventDefault();
        x.className = x.className.replace("show", "");

        var data = $.trim(selected_data);

        if (data.length > 0) {
            var meta_data = {
                'from': 'content',
                'context': 'send_data',
                'data': data
            };
            console.log(data);
            send_message(meta_data);
        }
    });
}
//----------------------------------------------------------------------------------------------