var login_success = false;
var displayName;
var email;
var emailVerified;
var photoURL;
var isAnonymous;
var uid;
var device_name = 'chrome_extension';
var start = 1;
var key = "";
var scroll_count = 1;

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
            login_check();
            break;
        case 'login':
            startSignIn();
            break;
        case 'fetch_primary_data':
            pull_first_data_set();
            break;
        case 'fetch_secondary_data':
            pull_other_data_set();
            break;
        case 'send_data':
            send_data(request);
            break;
        case 'login_check_content':
            login_check_content(request);
            break;
    }
}
// Message receiving from scripts ends here ----------------------------------------------------

// Initialize Firebase----------------------------------------------------------------------
var config = {
    apiKey: "AIzaSyCi_rU_cWd-U2Qx9YvswFpygS_mXxh7Xo8",
    authDomain: "clipsync-77d18.firebaseapp.com",
    databaseURL: "https://clipsync-77d18.firebaseio.com",
    projectId: "clipsync-77d18",
    storageBucket: "clipsync-77d18.appspot.com",
    messagingSenderId: "749113595662"
};
firebase.initializeApp(config);
var database_ref = firebase.database();

window.onload = function() {
    initApp();
};


//-------------------------------------------------------------------------------------------

// Login check functions --------------------------------------------------------------------

function initApp() {
    // Listen for auth state changes.
    // [START authstatelistener]
    firebase.auth().onAuthStateChanged(function(user) {
        if (user) {
            // User is signed in.
            login_success = true;
            displayName = user.displayName;
            email = user.email;
            emailVerified = user.emailVerified;
            photoURL = user.photoURL;
            isAnonymous = user.isAnonymous;
            uid = user.uid;
            console.log("login success");
            add_listener();
            //console.log(uid);
            login_check();
            // [END_EXCLUDE]
            database_ref.ref().once("value", function(snapshot) {
                if (!snapshot.hasChild(uid)) {
                    database_ref.ref(uid).child('name').set(displayName);
                    database_ref.ref(uid).child('email').set(email);
                    database_ref.ref(uid).child('photo_url').set(photoURL);
                }
                database_ref.ref(uid).child('devices').child(device_name).child('device_id').set('ext');
                database_ref.ref(uid).child('devices').child(device_name).child('status').set('true');
            });

        } else {
            // Let's try to get a Google auth token programmatically.
            // [START_EXCLUDE]
            login_success = false;
            console.log("login not processed");
            login_check();

            // [END_EXCLUDE]
        }

        // [END authstatelistener]
    });
}

function login_check() {
    if (login_success) {
        var login = {
            'from': 'background',
            'context': 'login_check',
            'status': 'true',
            'name': displayName,
            'email': email,
            'photourl': photoURL
        };
        send_message(login);

    } else {
        var login = {
            'from': 'background',
            'context': 'login_check',
            'status': 'false'
        };
        send_message(login);
    }
}

function login_check_content(request) {
    if (login_success) {
        var login = {
            'from': 'background',
            'context': 'login_check_content',
            'status': 'true',
            'name': displayName,
            'email': email,
            'photourl': photoURL
        };
        send_message(login);

    } else {
        var login = {
            'from': 'background',
            'context': 'login_check_content',
            'status': 'false'
        };
        send_message(login);
    }
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, login, function(response) {
            //console.log(response.farewell);
        });
    });
}
//--------------------------------------------------------------------------------------------

// Execute login sequence and start firebase sequence ----------------------------------------

function startAuth(interactive) {
    //console.log("hack1");
    // Request an OAuth token from the Chrome Identity API.
    console.log("startauth");
    chrome.identity.getAuthToken({ interactive: true }, function(token) {

        if (token) {
            // Authorize Firebase with the OAuth Access Token.
            //console.log('hack2');
            var credential = firebase.auth.GoogleAuthProvider.credential(null, token);
            //console.log('hack3');
            firebase.auth().signInAndRetrieveDataWithCredential(credential).then(function(user) {

                //console.log(user.uid);
                //initApp();
                login_check();

            }).catch(function(error) {
                // The OAuth token might have been invalidated. Lets' remove it from cache.
                //console.log('hack');
                //if (error.code === 'auth/invalid-credential') {

                firebase.auth().signOut();
                chrome.identity.removeCachedAuthToken({ token: token }, function() {
                    startAuth(interactive);
                });
                //}
            });
        } else {
            console.error('The OAuth Token was null');
        }
    });
}

function startSignIn() {
    if (firebase.auth().currentUser) {
        firebase.auth().signOut();
        startAuth(true);
    } else {
        startAuth(true);
    }
}

// ------------------------------------------------------------------------------------------------------------

// Retrieve first set of data ---------------------------------------------------------------------------------
function pull_first_data_set() {
    var i = 0;
    database_ref.ref(uid).child('post').limitToLast(8).once("value", function(snapshot) {
        console.log(snapshot.numChildren());
        snapshot.forEach(function(childSnapshot) {
            if (i == 0) {
                key = childSnapshot.key;
            }
            process_primary_data_set(childSnapshot);
            i++;
        });
    });
    if (i == 0) {
        var data = {
            'from': 'background',
            'context': 'no_data'
        };
        send_message(data);
    }
}

// ------------------------------------------------------------------------------------------------------------

// Retrieve other data sets ---------------------------------------------------------------------------------
function pull_other_data_set() {
    var i = 1;
    var array = [];
    database_ref.ref(uid).child('post').orderByKey().limitToLast((5 * scroll_count)).endAt(key).once("value", function(snapshot) {
        console.log(snapshot.numChildren());
        snapshot.forEach(function(childSnapshot) {
            if (i == 1) {
                key = childSnapshot.key;
            }
            if (i != snapshot.numChildren()) {
                //process_secondary_data_set(childSnapshot);
                array.push(childSnapshot);
            }
            i++;
        });
        reverse_data(array);
        scroll_count++;
    });
    if (i == 1) {
        var data = {
            'from': 'background',
            'context': 'no_data'
        };
        send_message(data);
    }
}

function reverse_data(array) {
    array.reverse();
    array.forEach(myFunction);

    function myFunction(value) {
        process_secondary_data_set(value);
    }
}

// ------------------------------------------------------------------------------------------------------------

// process and send data set ----------------------------------------------------------------------------------
function process_primary_data_set(snapshot) {
    var data = {
        'from': 'background',
        'context': 'fetch_primary_data',
        'device_id': snapshot.child('device_id').val(),
        'data': snapshot.child('data').val()
    };
    send_message(data);
    copyToClipboard(snapshot.child('data').val());
}

function process_secondary_data_set(snapshot) {
    var data = {
        'from': 'background',
        'context': 'fetch_secondary_data',
        'device_id': snapshot.child('device_id').val(),
        'data': snapshot.child('data').val()
    };
    send_message(data);
    copyToClipboard(snapshot.child('data').val());
}
// -------------------------------------------------------------------------------------------------------------

// send data ---------------------------------------------------------------------------------------------------
function send_data(data) {
    database_ref.ref(uid).child('post').push({
        'device_id': 'ext',
        'data': data.data
    });
    copyToClipboard(data.data);
}
// -------------------------------------------------------------------------------------------------------------

// Add listener to data changes --------------------------------------------------------------------------------
function add_listener() {
    if (login_success) {
        var query = database_ref.ref(uid).child('post').limitToLast(1);
        query.on('child_added', function(childSnapshot, prevChildKey) {

            if (start != 1) {
                if (childSnapshot.val().device_id != 'ext') {
                    copyToClipboard(childSnapshot.val().data);
                    console.log(childSnapshot.val().data);
                    console.log(childSnapshot.val().device_id);
                    process_primary_data_set(childSnapshot);
                }
            }
            start++;
        });
    }
}
// --------------------------------------------------------------------------------------------------------------

// Copy to clipboard --------------------------------------------------------------------------------------------
function copyToClipboard(text) {
    //console.log('copying');
    const input = document.createElement('input');
    input.style.position = 'fixed';
    input.style.opacity = 0;
    input.value = text;
    document.body.appendChild(input);
    input.select();
    document.execCommand('Copy');
    document.body.removeChild(input);
};

//---------------------------------------------------------------------------------------------------------------