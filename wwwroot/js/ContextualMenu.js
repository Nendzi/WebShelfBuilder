const cm = document.getElementById('cm');

var firstPointX_coord;
var firstPointY_coord;

function showContexMenu(show = true) {
    cm.style.display = show ? 'block' : 'none';
}

document.getElementById('sketchViewer').addEventListener('contextmenu', (event) => {
    event.preventDefault();

    showContexMenu();

    if (event.y + cm.offsetHeight < window.innerHeight) {
        cm.style.top = event.y + 'px';
    }
    else {
        cm.style.top = window.innerHeight - cm.offsetHeight + 'px';
    }

    if (event.x + cm.offsetWidth < window.innerWidth) {
        cm.style.left = event.x + 'px';
    }
    else {
        cm.style.left = window.innerWidth - cm.offsetWidth + 'px';
    }
});

window.addEventListener('click', () => {
    showContexMenu(false);
});

$('#stopDrawLine').click(stopDrawing);

function stopDrawing() {
    canDrawNewLine = true;
    selectionMode = true;
    updatePosition(0, 0, 0);
    updatePosition(0, 0, 3);
    settingSwitches();
    resetLineCounter();
    document.getElementById('info').style.display = 'none';
}

var closeCommandIsEnable = true;

$('#closeLines').click(function () {
    if (closeCommandIsEnable) {
        closeConture();
    }
    else {
        displayInfo('This contour cannot be closed ' + nextLineOrientation);
    }
});

function closeConture() {
    // at least four points must be on canvas for closing
    if (lineCount > 2) {
        // read first point from current string
        points.push(new THREE.Vector3(firstPointX_coord, firstPointY_coord, 0));
        createLine();
        resetLineCounter();
        stopDrawing();
    }
    else {
        displayInfo('Close command can be used only on three and more lines.');
    }
};

$('#clearCanvas').click(clearAllLines);

function clearAllLines() {
    document.getElementById('info').style.display = 'none';
    initEnv();
    initVars();
}

$('#deleteLine').click(deletedSelectedLine);

function deletedSelectedLine() {
    //deletee seleced line
    // set index on zero
    var index = 0;
    // search for selected line in all lines
    for (var line of whiteboard.children) {
        // compare like objects
        if (line === pickedObject) {
            //if line have been found delete it from children
            whiteboard.children.splice(index, 1);
            // simulate escape pressed
            escPressed();
            // show changes
            render();
            // job is done, go home
            return;
        }
        index++;
    }
}

$('#filterVert').click(getVerticalCoordinate);

function getVerticalCoordinate() {
    anyFilterOn = true;
    verFilterOn = true;
    selectionMode = true;
}

$('#filterHor').click(getHorizontalCoordinate);

function getHorizontalCoordinate() {
    anyFilterOn = true;
    horFilterOn = true;
    selectionMode = true;
}

$('#pointFrom').click(getPoint);

function getPoint() {
    anyFilterOn = true;
    horFilterOn = true;
    verFilterOn = true;
    selectionMode = true;
}

$('#elementTo').click(toElement);

function toElement() {
    anyFilterOn = true;
    makeTouch = true;
    selectionMode = true;
    verFilterOn = false;
    horFilterOn = false;
}

function resetLineCounter() {
    lineCount = 0;
}

function testClosePossibility(inputX, inputY) {
    var closeCondition1 = nextLineOrientation == 'vertical' && firstPointY_coord == inputY;
    var closeCondition2 = nextLineOrientation == 'horizontal' && firstPointX_coord == inputX;
    var closeCondition = closeCondition1 || closeCondition2;

    if (closeCondition) {
        closeCommandIsEnable = true;
    }
    else {
        closeCommandIsEnable = false;
    }
}

function displayInfo(message) {
    var infoWnd = document.getElementById('infoWnd');
    infoWnd.children[1].innerHTML = message;
    infoWnd.style.display = 'block';
    infoWnd.style.top = window.innerHeight / 2 + 'px';
    infoWnd.style.left = window.innerWidth / 2 + 'px';
}