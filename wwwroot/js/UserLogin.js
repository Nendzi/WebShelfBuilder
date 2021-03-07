$(document).ready(function () {
    $('#login').click(login);
    $('#projectSelect').click(selectProject);
    $('#loginSetup').click(showLoginInForm);
    $('#loginWithNewBucket').click(createNewBucket)
});

var bucketPrefix = "wallshelfconfig";

function showLoginInForm () {
    document.getElementById('loginSetupWnd').style.display = 'block';
}

function prepareLists() {
    list('buckets', '/api/forge/oss/buckets');
}

function createNewBucket() {
    var bucketKey = bucketPrefix + '-' + document.getElementById('forgeBucket').value;
    jQuery.post({
        url: '/api/forge/oss/buckets',
        contentType: 'application/json',
        data: JSON.stringify({ 'bucketKey': bucketKey }),
        success: function (res) {
            alert('New bucket has created');
            // TODO - apply new created bucket
            window.location = 'sketcher.html';
        },
        error: function (err) {
            if (err.status == 409)
                alert('Bucket already exists - 409: Duplicated')
            console.log(err);
        }
    });
}

function list(control, endpoint) {
    $('#' + control).find('option').remove().end();
    jQuery.ajax({
        url: endpoint,
        dataType: "json",
        multiple: false,
        data: function (node) {
            return {
                "id": node.id,
                "fttp": fileTypeToTranslate
            };
        },
        success: function (list) {
            if (list.length === 0)
                $('#' + control).append($('<option>', { disabled: true, text: 'Nothing found' }));
            else
                list.forEach(function (item) {
                    var test = item.text.toLowerCase();
                    if (test.includes(bucketPrefix)) {
                        $('#' + control).append($('<option>', { value: item.id, text: convertItemToText(item.text) }));
                    }
                })
        }
    });
}

function convertItemToText(item) {
    var text;
    text = item.replace(bucketPrefix + '-', '');
    return text;
}

function login() {
    $.post({
        url: 'api/forge/oauth/cred',
        contentType: 'application/json',
        data: JSON.stringify({
            ForgeClient: document.getElementById('forgeClientId').value,
            ForgeSecret: document.getElementById('forgeClientSecret').value
        }),
        success: function () {
            prepareLists();
            var projSel = document.getElementById('projectSelector');
            projSel.style.display = 'block';
            var newBucket = document.getElementById('newBucket');
            newBucket.style.display = 'block';
        }
    });
}

var choosenBucket;

function selectProject() {       
    choosenBucket = document.getElementById('buckets').value;
    var engSel = document.getElementById('projectSelector');
    engSel.style.display = 'none';
    var wndElem = document.getElementById('loginSetupWnd');
    wndElem.style.display = 'none';
    var newBucket = document.getElementById('newBucket');
    newBucket.style.display = 'none';
    // TODO - apply selected bucket
    window.location = 'sketcher.html';
}