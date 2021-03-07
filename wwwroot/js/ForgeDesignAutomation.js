$(document).ready(function () {
    $('#startWorkitem').click(prepareWorkitem);
    startConnection();
});

function prepareWorkitem() {
    lineDataToJSON();
    startWorkitem();
}

function clearAccount() {
    jQuery.ajax({
        url: 'api/forge/designautomation/account',
        method: 'DELETE',
        success: function () {
            writeLog('Account cleared, all appbundles & activities deleted');              
        }
    });
}

function createAppBundleActivity() {
    startConnection(function () {
        writeLog("Defining appbundle and activity for Inventor");
        createAppBundle (function () {
            createActivity()
        });
    });
}

function createAppBundle(cb) {
    writeLog("Create Bundle");
    jQuery.ajax({
        url: 'api/forge/designautomation/appbundles',
        method: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            //zipFileName: 'DA4ShelfBuilderPlugin.bundle.zip',
            engine: document.getElementById('engines').value
        }),
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
            engine: choosenBucket
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
        $('#appBuckets').jstree(true).refresh();
    });
}