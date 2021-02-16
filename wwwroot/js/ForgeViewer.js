var viewer;

$(document).ready(function () {
    $('#startWorkitem').click(prepareWorkitem);

});

function launchViewer(urn) {
    var options = {
        env: 'AutodeskProduction',
        getAccessToken: getForgeToken
    };
    Autodesk.Viewing.Initializer(options, () => {
        viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('showroomViewer'), { extensions: ['Autodesk.DocumentBrowser'] });
        viewer.setTheme('light-theme');
        viewer.start();
        viewer.setLightPreset(18);
        var documentId = 'urn:' + urn;
        Autodesk.Viewing.Document.load(documentId, onDocumentLoadSuccess, onDocumentLoadFailure);
    });/*
    Autodesk.Viewing.Initializer({ accessToken: '' }, async function () {
        const viewer = new Autodesk.Viewing.GuiViewer3D(document.getElementById('showroomViewer'));
        viewer.start();
        viewer.setTheme('light-theme');
        await viewer.loadExtension('Autodesk.glTF');
        //viewer.loadModel('models/rac_basic_sample_project/gltf/model.gltf');
        viewer.loadModel('models/Sponza/glTF/Sponza.gltf');
    });*/
}

function onDocumentLoadSuccess(doc) {
    var viewables = doc.getRoot().getDefaultGeometry();
    viewer.loadDocumentNode(doc, viewables).then(i => {
        // documented loaded, user can upload background image for visalization
    });
}

function onDocumentLoadFailure(viewerErrorCode) {
    console.error('onDocumentLoadFailure() - errorCode:' + viewerErrorCode);
}

function getForgeToken(callback) {
    fetch('/api/forge/oauth/token').then(res => {
        res.json().then(data => {
            callback(data.access_token, data.expires_in);
        });
    });
}

function prepareWorkitem() {

    lineDataToJSON();
    startWorkitem();
}