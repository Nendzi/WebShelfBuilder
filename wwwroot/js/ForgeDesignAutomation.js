$(document).ready(function () {
    prepareLists();
    startConnection();
    $('#loginAndSettings').click(loginAndEngineSetup);
    //createAppBundleActivity();
});

function prepareLists() {
    list('engines', '/api/forge/designautomation/engines');
}

function list(control, endpoint) {
    $('#' + control).find('option').remove().end();
    jQuery.ajax({
        url: endpoint,
        success: function (list) {
            if (list.length === 0)
                $('#' + control).append($('<option>', { disabled: true, text: 'Nothing found' }));
            else
                list.forEach(function (item) {
                    var test = item.toLowerCase();
                    if (test.includes('inventor+20')) {
                        $('#' + control).append($('<option>', { value: item, text: convertItemToText(item) }));
                    }
                })
        }
    });
}

function convertItemToText(item) {
    var text;
    switch (item)
    {
        case 'Autodesk.Inventor+2018':
            text = '2018';
            break;
        case 'Autodesk.Inventor+2019':
            text = '2019';
            break;
        case 'Autodesk.Inventor+2020':
            text = '2020';
            break;
        case 'Autodesk.Inventor+2021':
            text = '2021';
            break;
        case 'Autodesk.Inventor+2022beta':
            text = '2022 beta';
            break;
        default:
            text = '2021';
            break;
    }
    return text;
}

function loginAndEngineSetup() {
    var wndElem = document.getElementById('loginSetupWnd');
    wndElem.style.display = 'block';
    $.post({
        url: 'api/forge/oauth/cred',
        contentType: 'application/json',
        data: JSON.stringify({
            ForgeClient: document.getElementById('forgeClientId').value,
            ForgeSecret: document.getElementById('forgeClientSecret').value
        }),
        success: function () {
            var wndElem = document.getElementById('loginSetupWnd');
            wndElem.style.display = 'none';
            createAppBundleActivity();
        }
    });
}

function createAppBundleActivity() {
    startConnection(function () {
        writeLog("Defining appbundle and activity for Inventor");
        createActivity(function () {
            createAppBundle()
        });
    });
}

function createAppBundle(cb) {
    writeLog("Create Bundle");
    jQuery.ajax({
        url: 'api/forge/designautomation/appbundles',
        method: 'POST',
        contentType: 'application/json'/*,
        data: JSON.stringify({
            zipFileName: 'DA4ShelfBuilderPlugin.bundle.zip',
            engine: document.getElementById('engines').value})*/
        ,
        success: function (res) {
            writeLog('AppBundle: ' + res.appBundle + ', v' + res.version);
            if (cb) cb();
        }
    });
}

function createActivity(cb) {
    writeLog("Create Activity");
    jQuery.ajax({
        url: 'api/forge/designautomation/activities',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            //zipFileName: 'MyWallShelf.zip',
            engine: document.getElementById('engines').value
        }),
        success: function (res) {
            writeLog('Activity: ' + res.activity);
            if (cb) cb();
        }
    });
}

function startWorkitem() {
    // TODO - this piece of code will be used for sending image in visualization module
    //var inputFileField = document.getElementById('inputFile');
    //if (inputFileField.files.length === 0) { alert('Please select an input file'); return; }
    //if ($('#activity').val() === null) { alert('Please select an activity'); return };
    //var file = inputFileField.files[0];

    startConnection(function () {
        var formData = new FormData();
        var myJSONString = JSON.stringify(myShelf);
        formData.append('shelfData', myJSONString);
        formData.append('forgeData', JSON.stringify({
            activityName: 'shelfconfig',
            browerConnectionId: connectionId
        }));
        writeLog('Uploading input file...');
        $.ajax({
            url: 'api/forge/designautomation/workitems',
            data: formData,
            processData: false,
            contentType: false,
            type: 'POST',
            success: function (res) {
                writeLog('Workitem started: ' + res.workItemId);
            }
        });
    });
}

function writeLog(text) {
    $('#outputlog').append('<div style="border-top: 1px dashed #C0C0C0">' + text + '</div>');
    var elem = document.getElementById('outputlog');
    elem.scrollTop = elem.scrollHeight;
}

var connection;
var connectionId;

function startConnection(onReady) {
    if (connection && connection.connectionState) { if (onReady) onReady(); return; }
    connection = new signalR.HubConnectionBuilder().withUrl("/api/signalr/designautomation").build();
    connection.start()
        .then(function () {
            connection.invoke('getConnectionId')
                .then(function (id) {
                    connectionId = id; // we'll need this...
                    if (onReady) onReady();
                });
        });

    connection.on("downloadResult", function (url) {
        writeLog('<a href="' + url + '">Download result file here</a>');
    });

    connection.on("onComplete", function (message) {
        writeLog(message);
    });
}
