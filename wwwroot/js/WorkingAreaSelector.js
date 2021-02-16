$(document).ready(function () {
    $('#forSketcher').click(showSketchViewer);
    $('#forModeler').click(showForgeViewer);
    $('#forVisualization').click(showShowroomViewer);
});

function showSketchViewer() {
    buttonAction('sketchViewer','forSketcher');
}

function showForgeViewer() {
    buttonAction('forgeViewer','forModeler');
}

function showShowroomViewer() {
    buttonAction('showroomViewer','forVisualization');
}

function buttonAction(whichViewer,whichButton) {
    switchViewers(whichViewer);
    inactivateButtons();
    activateButton(whichButton);
}

function switchViewers(whichViewer) {
    var viewers = [];

    viewers.push(document.getElementById('sketchViewer'));
    viewers.push(document.getElementById('forgeViewer'));
    viewers.push(document.getElementById('showroomViewer'));

    for (var i = 0; i <viewers.length; i++) {
        viewers[i].style.display = 'none';
    }

    var viewerIndex = 0;
    switch (whichViewer) {
        case 'sketchViewer':
            viewerIndex = 0;
            break;
        case 'forgeViewer':
            viewerIndex = 1;
            break;
        case 'showroomViewer':
            viewerIndex = 2;
            break;
        default:
    }

    viewers[viewerIndex].style.display = 'initial';
}

function inactivateButtons() {
    var buttons = [];

    buttons.push(document.getElementById('forSketcher'));
    buttons.push(document.getElementById('forModeler'));
    buttons.push(document.getElementById('forVisualization'));

    for (var i = 0; i < buttons.length; i++) {
        if (!buttons[i].classList.contains('bttn-inactive')) {
            buttons[i].classList.add('bttn-inactive');
        }   
    }
}

function activateButton(whichButton) {
    document.getElementById(whichButton).classList.remove('bttn-inactive');
}
