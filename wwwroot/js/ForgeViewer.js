var viewer;

$(document).ready(function () {
    $('#forSketcher').click(function () {
        openSketcher();
    });
    $('#forModeler').click(function () {
        openDesignAutomation();
    });
});

function openSketcher() {
    window.location = 'sketcher.html';
}

function openDesignAutomation() {
    window.location = 'forgeda.html';
}

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
    });
}

function onDocumentLoadSuccess(doc) {
    var viewables = doc.getRoot().getDefaultGeometry();
    var loadingCircle = document.getElementById('loading');
    loadingCircle.style.display = 'block';
    viewer.loadDocumentNode(doc, viewables).then(i => {
        setTimeout(() => {
            loadingCircle.style.float = 'left';
        }, 2000);        
    })
    // documented loaded, user can upload background image for visalization   
};


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
