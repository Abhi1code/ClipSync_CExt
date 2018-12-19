// Message sending to scripts start hare ------------------------------------------------------
function send_message(message) {
    chrome.runtime.sendMessage(message);
}
// Message sending to scripts ends here --------------------------------------------------------

// Message receiving from scripts start here ---------------------------------------------------
chrome.runtime.onMessage.addListener(received_message);

function received_message(request, sender, sendResponse) {
    switch (request.context) {
        case 'login_check':
            login(request);
            break;
        case 'fetch_primary_data':
            display_data(request, 'forward');
            break;
        case 'fetch_secondary_data':
            display_data(request, 'reverse');
            console.log(request.data);
            break;
        case 'no_data':
            $('#loader').hide();
            break;
    }
}
// Message receiving from scripts ends here ----------------------------------------------------

// Login section start --------------------------------------------------------------------------
$('#header').fadeOut();
$('#message').fadeOut();
$('#footer').fadeOut();
var login_check = {
    'from': 'popup',
    'context': 'login_check'
};
send_message(login_check);

function login(request) {
    if (request.status === 'true') {
        cancel_dialog(request);

    } else {
        $("#login_loader").css("display", "none");
        $("#login").click(function() {
            $("#login_loader").css("display", "block");

            var login = {
                'from': 'popup',
                'context': 'login',
            };
            send_message(login);
        });
    }
}

function cancel_dialog(request) {
    load_primary_data();
    $('#message').fadeIn();
    $('#card').fadeOut();
    $('#header').fadeIn();
    $('#footer').fadeIn();
    $('#name').append(request.name);
    $('#email').append(request.email);
    $('#avatar').attr("src", request.photourl);

}
// Login section end ----------------------------------------------------------------------------

// Message displaying command p -------------------------------------------------------------------
function load_primary_data() {
    var data = {
        'from': 'popup',
        'context': 'fetch_primary_data',
    };
    send_message(data);
}

function display_data(request, direction) {

    $('#loader').hide();
    insert(request.device_id, request.data, direction);

    /* scroll event triggered when bottom is reached 

     $('#message').on('scroll', function() {
         if ($(this).scrollTop() + $(this).innerHeight() >= $(this)[0].scrollHeight) {
             console.log('end reached');
         }
     });
     */
    var i = 0;
    $('#message').on('scroll', function() {
        var pos = $('#message').scrollTop();
        if (pos == 0) {
            if (i == 0) {
                //console.log('top reached');
                $('#loader').show();
                var data = {
                    'from': 'background',
                    'context': 'fetch_secondary_data'
                };
                block_unwanted_call(data);
                i++;
            }

        }
    });

}

var lastClicked = 0;

function block_unwanted_call(data) {

    var now = new Date();
    if (now - lastClicked > 300) {
        lastClicked = now;
        //console.log('Done');
        send_message(data);
    }
}

function insert(device_id, data, direction) {

    if (data.length > 0) {

        if (direction === 'forward') {
            if (device_id === 'ext') {
                $('#table').prepend('<li id="row"><span style="background-color: rgb(250, 178, 160);float: right;border-top-left-radius: 20px;' +
                    'border-bottom-left-radius: 20px;border-bottom-right-radius: 20px;padding: 5px;max-width: 80%;text-decoration-color: #000000;' +
                    'font-size: 15px;color: #000000;padding-left: 10px;margin-bottom: 10px;">' + data + '</span></li>');
            } else {
                $('#table').prepend('<li id="row"><span style="background-color: rgb(66, 77, 238);float: left;border-top-right-radius: 20px;' +
                    'border-bottom-left-radius: 20px;border-bottom-right-radius: 20px;padding: 5px;max-width: 80%;text-decoration-color: #000000;' +
                    'font-size: 15px;color: #000000;padding-right: 10px;margin-bottom: 10px;padding-left: 10px;margin-left: -23px;">' + data + '</span></li>');
            }
            $("html, div").animate({ scrollTop: $('body').height() }, 1000);

            /*scroll to top-- -
            $(document).ready(function() {
                $("#send1").click(function() {
                    $('html, div').animate({
                        scrollTop: $("body").offset().top
                    }, 1000);
                    //console.log('triggered');

                });
            });*/


        } else {
            if (device_id === 'ext') {
                $('#table').append('<li id="row"><span style="background-color: rgb(250, 178, 160);float: right;border-top-left-radius: 20px;' +
                    'border-bottom-left-radius: 20px;border-bottom-right-radius: 20px;padding: 5px;max-width: 80%;text-decoration-color: #000000;' +
                    'font-size: 15px;color: #000000;padding-left: 10px;margin-bottom: 10px;">' + data + '</span></li>');
            } else {
                $('#table').append('<li id="row"><span style="background-color: rgb(66, 77, 238);float: left;border-top-right-radius: 20px;' +
                    'border-bottom-left-radius: 20px;border-bottom-right-radius: 20px;padding: 5px;max-width: 80%;text-decoration-color: #000000;' +
                    'font-size: 15px;color: #000000;padding-right: 10px;margin-bottom: 10px;padding-left: 10px;margin-left: -23px;">' + data + '</span></li>');
            }
        }

    }

}
// ----------------------------------------------------------------------------------------------

// Sending function -----------------------------------------------------------------------------
$("#send").click(function() {
    add_data();
});

document.getElementById("paste").addEventListener("keydown", function(e) {
    if (e.keyCode === 13) { //checks whether the pressed key is "Enter"
        e.preventDefault();
        add_data();
    }
});

function add_data() {
    var data = $.trim($('#paste').val());
    if (data.length > 0) {
        insert('ext', data, 'forward');
        var meta_data = {
            'from': 'popup',
            'context': 'send_data',
            'data': data
        };
        send_message(meta_data);
    }
    $('#paste').val("");
}
// ----------------------------------------------------------------------------------------------