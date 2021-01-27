const cm = document.getElementById('cm');

var firstPointX_coord;
var firstPointY_coord;

function showContexMenu(show = true) {
    cm.style.display = show ? 'block' : 'none';
}

sketch.addEventListener('contextmenu', (event) => {
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

$('#closeLines').click(function () {
    // at least four points must be on canvas for closing
    if (scene.children.length > 3) {
        // read first point from current string
        points.push(new THREE.Vector3(firstPointX_coord, firstPointY_coord, 0));
        createLine();
        stopDrawing();
    }
    else {
        document.getElementById('infoWnd').style.display = 'block';
        document.getElementById('infoWnd').style.top = window.innerHeight / 2 + 'px';
        document.getElementById('infoWnd').style.left = window.innerWidth / 2 + 'px';
    }
});

$('#clearCanvas').click(clearAllLines);

function stopDrawing() {
    canDrawNewLine = true;
    selectionMode = true;
    updatePosition(0, 0, 0);
    updatePosition(0, 0, 3);
    settingSwitches();
}

function clearAllLines() {
    initEnv();
    initVars();
}