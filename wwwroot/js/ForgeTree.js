$(document).ready(function () {
    prepareAppBucketTree();
    $('#refreshBuckets').click(function () {
        $('#appBuckets').jstree(true).refresh();
    });
    $('#loginSetup').click(function () {
        document.getElementById('loginSetupWnd').style.display = 'block';
    });
    $('#showFormCreateBucket').click(function () {
        createNewBucket();
    });

    $('#discID').click(changeSliderPosition);

    $('#hiddenUploadField').change(function () {
        var node = $('#appBuckets').jstree(true).get_selected(true)[0];
        var _this = this;
        if (_this.files.length == 0) return;
        var file = _this.files[0];
        switch (node.type) {
            case 'bucket':
                var formData = new FormData();
                formData.append('fileToUpload', file);
                formData.append('bucketKey', node.id);

                $.ajax({
                    url: '/api/forge/oss/objects',
                    data: formData,
                    processData: false,
                    contentType: false,
                    type: 'POST',
                    success: function (data) {
                        $('#appBuckets').jstree(true).refresh_node(node);
                        _this.value = '';
                    }
                });
                break;
        }
    });
});

function createNewBucket() {
    var bucketKey = 'wallshelfconfig';
    jQuery.post({
        url: '/api/forge/oss/buckets',
        contentType: 'application/json',
        data: JSON.stringify({ 'bucketKey': bucketKey }),
        success: function (res) {
            $('#appBuckets').jstree(true).refresh();
        },
        error: function (err) {
            if (err.status == 409)
                alert('Bucket already exists - 409: Duplicated')
            console.log(err);
        }
    });
}

var fileTypeToTranslate = "zipfile3D";

function prepareAppBucketTree() {
    $('#appBuckets').jstree({
        'core': {
            'themes': { "icons": true },
            'data': {
                "url": '/api/forge/oss/buckets',
                "dataType": "json",
                'multiple': false,
                "data": function (node) {
                    return {
                        "id": node.id,
                        "fttp": fileTypeToTranslate
                    };
                }
            }
        },
        'types': {
            'default': {
                'icon': 'glyphicon glyphicon-question-sign'
            },
            '#': {
                'icon': 'glyphicon glyphicon-cloud'
            },
            'bucket': {
                'icon': 'glyphicon glyphicon-folder-open'
            },
            'zipfile3D': {
                'icon': 'glyphicon glyphicon-equalizer'
            },
            'zipfile2D': {
                'icon': 'glyphicon glyphicon-file'
            },
            'pdfobject': {
                'icon': 'glyphicon glyphicon-picture'
            }
        },
        "plugins": ["types", "state", "sort", "contextmenu"],
        contextmenu: { items: autodeskCustomMenu }
    }).on('loaded.jstree', function () {
        $('#appBuckets').jstree('open_all');
    }).bind("activate_node.jstree", function (evt, data) {
        document.getElementById('responseMessage').innerHTML = '';
        /*if (data != null && data.node != null && data.node.type == 'pdfobject' && fileTypeToTranslate =='zipfile2D') {
            $("#showroomViewer").empty();
            var urn = data.node.id;
            getForgeToken(function (access_token) {
                jQuery.ajax({
                    url: 'https://developer.api.autodesk.com/modelderivative/v2/designdata/' + urn + '/manifest',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    success: function (res) {
                        if (res.status === 'success') launchViewer(urn);
                        else $("#showroomViewer").html('The translation job still running: ' + res.progress + '. Please try again in a moment.');
                    },
                    error: function (err) {
                        var msgButton = 'This file is not translated yet! ' +
                            '<button class="btn btn-xs btn-info" onclick="translatePDFObject()"><span class="glyphicon glyphicon-eye-open"></span> ' +
                            'Start translation</button>'
                        $("#showroomViewer").html(msgButton);
                    }
                });
            })
        }
        else*/ if (data != null && data.node != null && data.node.type == fileTypeToTranslate) {
            $("#showroomViewer").empty();
            var urn = data.node.id;
            getForgeToken(function (access_token) {
                jQuery.ajax({
                    url: 'https://developer.api.autodesk.com/modelderivative/v2/designdata/' + urn + '/manifest',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    success: function (res) {
                        if (res.status === 'success') launchViewer(urn);
                        else $("#showroomViewer").html('The translation job still running: ' + res.progress + '. Please try again in a moment.');
                    },
                    error: function (err) {
                        var msgButton = 'This file is not translated yet! ' +
                            '<button class="btn btn-xs btn-info" onclick="translateObject()"><span class="glyphicon glyphicon-eye-open"></span> ' +
                            'Start translation</button>'
                        $("#showroomViewer").html(msgButton);
                    }
                });
            });
        }
    });
}

function autodeskCustomMenu(autodeskNode) {
    var items;

    switch (autodeskNode.type) {
        case "bucket":
            items = {
                uploadFile: {
                    label: "Upload file",
                    action: function () {
                        uploadFile();
                    },
                    icon: 'glyphicon glyphicon-cloud-upload'
                }/*, for this version deleting of bucket is forbidden
                deleteBucket: {
                    label: "Delete bucket",
                    action: function () {
                        deleteBucket();
                    },
                    icon: 'glyphicon glyphicon-trash'
                }*/
            };
            break;
        case "pdfobject":
            items = {
                /*translateFile: {
                    label: "Translate",
                    action: function () {
                        var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
                        translatePDFObject(treeNode);
                    },
                    icon: 'glyphicon glyphicon-eye-open'
                },*/
                deleteFile: {
                    label: "Delete",
                    action: function () {
                        var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
                        deleteFile(treeNode);
                    },
                    icon: 'glyphicon glyphicon-remove'
                },
                downloadFile: {
                    label: "Download",
                    action: function () {
                        var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
                        downloadObject(treeNode);
                    },
                    icon: 'glyphicon glyphicon-cloud-download'
                }
            };
            break;
        case "zipfile2D":
        case "zipfile3D":
            items = {
                translateFile: {
                    label: "Translate",
                    action: function () {
                        var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
                        translateObject(treeNode);
                    },
                    icon: 'glyphicon glyphicon-eye-open'
                },
                downloadFile: {
                    label: "Download",
                    action: function () {
                        var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
                        downloadObject(treeNode);
                    },
                    icon: 'glyphicon glyphicon-cloud-download'
                },
                deleteFile: {
                    label: "Delete",
                    action: function () {
                        var treeNode = $('#appBuckets').jstree(true).get_selected(true)[0];
                        deleteFile(treeNode);
                    },
                    icon: 'glyphicon glyphicon-remove'
                }
            };
            break;
    }
    return items;
}

function uploadFile() {
    $('#hiddenUploadField').click();
}

/* for this version deleting of b ucket is forbidden
function deleteBucket() {
    var node = $('#appBuckets').jstree(true).get_selected(true)[0];
    jQuery.ajax({
        url: '/api/forge/oss/buckets',
        contentType: 'application/json',
        data: JSON.stringify({ 'bucketKey': node.id }),
        type: 'DELETE',
        success: function (res) {
            $('#appBuckets').jstree(true).refresh();
        },
        error: function (err) { console.log(err); }
    });
}*/

function translateObject(node) {
    $("#showroomViewer").empty();
    if (node == null) node = $('#appBuckets').jstree(true).get_selected(true)[0];
    var bucketKey = node.parents[0];
    var objectKey = node.id;
    jQuery.post({
        url: '/api/forge/modelderivative/jobs',
        contentType: 'application/json',
        data: JSON.stringify({ 'bucketKey': bucketKey, 'objectName': objectKey, 'objectType': fileTypeToTranslate }),
        success: function (res) {
            $("#showroomViewer").html('Translation started! Please try again in a moment.');
        },
    });
}

function translatePDFObject(node) {
    $("#showroomViewer").empty();
    if (node == null) node = $('#appBuckets').jstree(true).get_selected(true)[0];
    var bucketKey = node.parents[0];
    var objectKey = node.id;
    jQuery.post({
        url: '/api/forge/modelderivative/jobs',
        contentType: 'application/json',
        data: JSON.stringify({ 'bucketKey': bucketKey, 'objectName': objectKey, 'objectType': 'pdfobject' }),
        success: function (res) {
            $("#showroomViewer").html('Translation started! Please try again in a moment.');
        },
    });
}

function downloadObject(node) {
    var bucketKey = node.parent;
    var objectName = node.text;
    jQuery.ajax({
        url: '/api/forge/objects/signed',
        contentType: 'application/json',
        data: JSON.stringify({ 'bucketKey': bucketKey, 'fileToDownload': objectName }),
        type: 'POST',
        success: function (res) {
            document.getElementById('responseMessage').innerHTML = '<a class="download" href="' + res.signedUrl + '">Download result file here</a>';
        },
        error: function (err) {
            document.getElementById('responseMessage').innerHTML = '<p class="download">' + err.Message + '</p>';
        }
    });
}

function deleteFile(node) {
    $("#showroomViewer").empty();
    var node = $('#appBuckets').jstree(true).get_selected(true)[0];
    var bucketKey = node.parent;
    var objectKey = node.text;

    jQuery.ajax({
        url: '/api/forge/oss/objects/delete',
        contentType: 'application/json',
        data: JSON.stringify({ 'bucketKey': bucketKey, 'objectKey': objectKey }),
        type: 'DELETE',
        success: function (res) {
            $('#appBuckets').jstree(true).refresh();
        },
        error: function (err) { console.log(err); }
    });
}