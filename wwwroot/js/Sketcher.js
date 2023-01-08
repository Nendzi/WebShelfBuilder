const sketch = document.getElementById('visual');
var windowWidth = sketch.clientWidth;
var windowHeight = sketch.clientHeight - 3;

const showroom = document.getElementById('showroomViewer');
showroom.style.width = windowWidth + 'px';
showroom.style.height = windowHeight + 'px';

var renderer, scene, camera

var linePreview;
var line;
var firstPointMarker;
var secondPointMarker;
var MAX_POINTS;
var drawCount;

var points;
var pointsNumber

// catch cursor coordinates when click on sketcher
var cursor_x;
var cursor_y;
var authenticCoord;
var isItFirstCatch;

var needAnimate;
var canDrawNewLine;
var selectionMode;
var keepSelected;
var anyFilterOn;
var horFilterOn;
var verFilterOn;
var makeTouch;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
//var pickedObjectColor;
var pickedObject;

initRender()
initEnv();
initVars();

function initRender() {
    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(windowWidth, windowHeight);
    document.getElementById('sketchViewer').appendChild(renderer.domElement);
}

function initEnv() {
    //scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xd5cdbf);

    //camera
    var hlfscrw = Math.floor(windowWidth / 2);
    var hlfscrh = Math.floor(windowHeight / 2);
    camera = new THREE.OrthographicCamera(-hlfscrw, hlfscrw, -hlfscrh, hlfscrh, 1, 500);
    //camera = new THREE.PerspectiveCamera(45, windowWidth / windowHeight, 1, 500);
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    //geometry
    const preLineGeometry = new THREE.BufferGeometry();
    const lineGeometry = new THREE.BufferGeometry();
    const sphereGeometry = new THREE.SphereGeometry(5, 32, 32);

    //attributes
    var positions = new Float32Array(6);
    preLineGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    var nurbs = new Float32Array(MAX_POINTS * 3);
    lineGeometry.addAttribute('nurb', new THREE.BufferAttribute(nurbs, 3));

    //drawcalls    
    drawCount = 2;
    preLineGeometry.setDrawRange(0, drawCount);

    //material    
    const preLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
    const firstPointMaterial = new THREE.MeshBasicMaterial({ color: 0xff00ff });
    const secondPointMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });

    //line
    linePreview = new THREE.Line(preLineGeometry, preLineMaterial);
    scene.add(linePreview);

    //spheres as point markers
    firstPointMarker = new THREE.Mesh(sphereGeometry, firstPointMaterial);
    scene.add(firstPointMarker);
    secondPointMarker = new THREE.Mesh(sphereGeometry, secondPointMaterial);
    scene.add(secondPointMarker);
    setMakrerOnLineEnd(3);
    setMakrerOnLineEnd(4);

    //first render
    render();
}

function initVars() {
    MAX_POINTS = 80;
    points = [];
    authenticCoord = [];
    pointsNumber = 0;
    cursor_x = -1;
    cursor_y = -1;
    isItFirstCatch = true;

    needAnimate = false;
    canDrawNewLine = false;
    selectionMode = false;
    keepSelected = false;
    anyFilterOn = false;
    horFilterOn = false;
    verFilterOn = false;
    makeTouch = false;

    pickedObject = null;
}

function updatePosition(x, y, index) {
    var positions = linePreview.geometry.attributes.position.array;

    authenticCoord[0 + index] = x + windowWidth / 2;
    authenticCoord[1 + index] = y + windowHeight / 2;

    positions[index++] = x;
    positions[index++] = y;
    positions[index++] = 1;
}

function render() {

    renderer.render(scene, camera);
}

function horOrient(x, y) {
    var abs_x = Math.abs(x);
    var abs_y = Math.abs(y);
    if (abs_x >= abs_y) {
        //point is closer to x axis and should be horizontal
        return true
    }
    // point is closer to y-axis and should be vertical
    return false;
}

//this function will be for animate
document.getElementById('sketchViewer').onmousemove = function (event) {

    var x_coord = event.offsetX - windowWidth / 2;
    var y_coord = event.offsetY - windowHeight / 2;

    // keep horizontal or vertical lines
    if (horOrient(x_coord - cursor_x, y_coord - cursor_y)) {
        y_coord = cursor_y;
    }
    else {
        x_coord = cursor_x;
    }

    // part for preview line drawing
    if (pointsNumber > 0) {
        if (needAnimate) {
            updatePosition(x_coord, y_coord, 3);
            updatePreview();
            //show text which represents lenght
            var info = document.getElementById('info');
            info.style.display = 'block';
            info.style.left = (authenticCoord[0] + authenticCoord[3]) / 2 + 'px';
            info.style.top = (authenticCoord[1] + authenticCoord[4]) / 2 + 'px';
            info.innerHTML = lineLength(authenticCoord);
        }
    }

    //part for raycasting
    if (selectionMode) {
        mouse.x = event.offsetX / windowWidth * 2 - 1;
        mouse.y = -(event.offsetY / windowHeight * 2 - 1);

        selectionHandler();
    }
}

function lineLength(coord) {
    var deltaX = Math.abs(coord[3] - coord[0]);
    var deltaY = Math.abs(coord[4] - coord[1]);

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function selectionHandler() {
    if (pickedObject && !keepSelected) {
        pickedObject.material.color.setHex(0x0000ff);//(pickedObjectColor);
        pickedObject = undefined;
    }

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length) {
        pickedObject = intersects[0].object;
        pickedObjectColor = pickedObject.material.color.getHex();
        pickedObject.material.color.setHex(0x00ff00);
    }
    render();
}

function updatePreview() {
    linePreview.geometry.attributes.position.needsUpdate = true;
    render();
}

function setMakrerOnLineEnd(endId,zIndex) {
    //endId can be 1 or 2
    var marker;
    var xm;
    var ym;

    if (endId == 1) {
        xm = pickedObject.geometry.attributes.position.array[0];
        ym = pickedObject.geometry.attributes.position.array[1];
    }
    else if (endId == 2) {
        xm = pickedObject.geometry.attributes.position.array[3];
        ym = pickedObject.geometry.attributes.position.array[4];
    } else {
        //use 3 or 4 for moving sphere beyond camera
        endId = endId-2;
        xm = 0;
        ym = 0;
        zIndex = 200;
    }
    marker = scene.children[endId];
    marker.position.copy(new THREE.Vector3(xm, ym, zIndex));
    marker.matrixAutoUpdate = false;
    marker.updateMatrix();
}

document.getElementById('sketchViewer').onclick = function (event) {
    // first check if something selected
    if (pickedObject && !anyFilterOn) {
        // and show end points coordinates
        showLineProperties();
        // add point markers on the line ends
        setMakrerOnLineEnd(1,10);
        setMakrerOnLineEnd(2,10);
        render();
        // set var for keeping selection
        keepSelected = true;
        // and restrict new selection
        selectionMode = false;
        // immedate return from function and do not draw line
        return;
    }

    if (pickedObject && makeTouch) {
        x_coord = cursor_x;
        y_coord = cursor_y;
        var firstX = pickedObject.geometry.attributes.position.array[0];
        var secondX = pickedObject.geometry.attributes.position.array[3];
        var firstY = pickedObject.geometry.attributes.position.array[1];
        var secondY = pickedObject.geometry.attributes.position.array[4];
        // if touched line horizontal get y coordinate
        if (firstY == secondY) {
            y_coord = firstY;
        }
        // if touched line vertical get x coordinate
        if (firstX == secondX) {
            x_coord = firstX;
        }
        makeTouch = false;
        anyFilterOn = false;

        // set first point for line preview
        updatePosition(x_coord, y_coord, 0);
        // set point for line. Which point will be depends of array points
        points.push(new THREE.Vector3(x_coord, y_coord, 0));
        //it is time for drawing line
        createLine();
        settingSwitches();
        // u ovom momentu sačuvaj koordinate tačke koja je stvarno izračunata i na osnovu kojih je napravljena nova linija
        cursor_x = x_coord;
        cursor_y = y_coord;
        // similate esc pressed
        escPressed();
        // job is done, go out.
        return;
    }

    // check if app is in filter coordinates mode
    if (pickedObject && anyFilterOn) {
        x_coord = cursor_x;
        y_coord = cursor_y;
        if (verFilterOn) {
            var mouse_x = event.offsetX - windowWidth / 2;
            var mouse_y = event.offsetY - windowHeight / 2;
            var firstX = pickedObject.geometry.attributes.position.array[0];
            var secondX = pickedObject.geometry.attributes.position.array[3];
            if (distance(firstX, mouse_x) < distance(secondX, mouse_x)) {
                // firstX should be selected
                x_coord = firstX;
            }
            else {
                // secondX should be selected
                x_coord = secondX;
            }
        }
        if (horFilterOn) {
            var mouse_x = event.offsetX - windowWidth / 2;
            var mouse_y = event.offsetY - windowHeight / 2;
            var firstY = pickedObject.geometry.attributes.position.array[1];
            var secondY = pickedObject.geometry.attributes.position.array[4];
            if (distance(firstY, mouse_y) < distance(secondY, mouse_y)) {
                // firstX should be selected
                y_coord = firstY;
            }
            else {
                // secondX should be selected
                y_coord = secondY;
            }
        }
        //
        if (horFilterOn && verFilterOn) {
            isItFirstCatch = false;
        }
        // reset all setted flags
        anyFilterOn = false;
        verFilterOn = false;
        horFilterOn = false;
        selectionMode = false;

        // set first point for line preview
        updatePosition(x_coord, y_coord, 0);
        // set point for line. Which point will be depends of array points
        points.push(new THREE.Vector3(x_coord, y_coord, 0));
        //it is time for drawing line
        createLine();
        settingSwitches();
        // u ovom momentu sačuvaj koordinate tačke koja je stvarno izračunata i na osnovu kojih je napravljena nova linija
        cursor_x = x_coord;
        cursor_y = y_coord;
        // similate esc pressed
        escPressed();
        // job is done, go out.
        return;
    }

    // catch coordinates at this point if it is first catch;
    if (isItFirstCatch) {
        cursor_x = event.offsetX - windowWidth / 2;
        cursor_y = event.offsetY - windowHeight / 2;
        isItFirstCatch = false;
    }

    //this part is for drawing lines
    var x_coord = event.offsetX - windowWidth / 2;
    var y_coord = event.offsetY - windowHeight / 2;

    // keep horizontal or vertical lines
    if (horOrient(x_coord - cursor_x, y_coord - cursor_y)) {
        y_coord = cursor_y;
    }
    else {
        x_coord = cursor_x;
    }

    // set first point for line preview
    updatePosition(x_coord, y_coord, 0);

    // set point for line. Which point will be depends of array points
    points.push(new THREE.Vector3(x_coord, y_coord, 0));

    // save first point for closing loop
    if (points.length == 1) {
        firstPointX_coord = x_coord;
        firstPointY_coord = y_coord;
    }

    //it is time for drawing line
    createLine();
    settingSwitches();

    // u ovom momentu sačuvaj koordinate tačke koja je stvarno izračunata i na osnovu kojih je napravljena nova linija
    cursor_x = x_coord;
    cursor_y = y_coord;
}

function distance(a, b) {
    var dist;
    dist = Math.abs(a - b);
    return dist;
}

function createLine() {
    pointsNumber++;

    // if we have more than one choosen point then create new line.
    if (pointsNumber > 1) {
        var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        var line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        pointsNumber = 1;
        // last point will be first point
        points.shift();

        render();
    }
}

function settingSwitches() {
    if (canDrawNewLine) {
        pointsNumber = 0;
        points = [];
        needAnimate = false;
        canDrawNewLine = false;
        isItFirstCatch = true;
        updatePreview();
    }
    else {
        selectionMode = false;
        needAnimate = true;
    }
}

document.getElementById('closeBtn').onclick = function (event) {
    document.getElementById('infoWnd').style.display = 'none';
}

window.onkeyup = function (event) {
    var keyChar = event.key;

    if (keyChar == 'Escape') {
        escPressed();
    }
}

function escPressed() {
    keepSelected = false;
    selectionMode = true;
    //simulate a little mouse movement
    mouse.x++;
    mouse.y++;
    selectionHandler();
    // hide properties if the is no selection
    const propPanel = document.getElementById('lineProp');
    propPanel.style.visibility = 'hidden';
    // hide markers-spheres by moving them beyond camera
    setMakrerOnLineEnd(3);
    setMakrerOnLineEnd(4);
}