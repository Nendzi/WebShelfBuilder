var lineCoordinates = { x1: 0, y1: 0, x2: 0, y2: 0 };
var actualLength;
var newLength;
var clipboardCoord = { x: 0, y: 0 }

document.getElementById('updateLength1').onclick = function (event) {
    updateCoordinates('first');
}

document.getElementById('updateLength2').onclick = function (event) {
    updateCoordinates('second');
}

function lineOrj() {
    var output = false;
    populateLineCoords();

    var x1 = lineCoordinates.x1;
    var y1 = lineCoordinates.y1;
    var x2 = lineCoordinates.x2;
    var y2 = lineCoordinates.y2;

    var deltaX = Math.abs(x1 - x2);
    var deltaY = Math.abs(y1 - y2);

    if (deltaY < 0.0001) {
        return 'hor'
    }
    if (deltaX < 0.0001) {
        return 'ver';
    }
    return 'incl';
}

document.getElementById('extendStartPoint1').onclick = function (event) {
    extendOnXY(0, 1)
}

document.getElementById('extendStartPoint2').onclick = function (event) {
    extendOnXY(3, 4)
}

function extendOnXY(pos1, pos2) {
    // da li je horizontalan
    if (lineOrj() == 'hor') {
        // ako je horizontalan menjaj samo Y koordinate
        pickedObject.geometry.attributes.position.array[pos1] = clipboardCoord.x;
    }
    if (lineOrj() == 'ver') {
        // ako je vertikalan menjaj samo X koordinate
        pickedObject.geometry.attributes.position.array[pos2] = clipboardCoord.y;
    }
    if (lineOrj() == 'incl') {
        // ovo noje dobro jer mora duž linije da se produžava
        // TODO - rešiti ovo u budućnosti
        pickedObject.geometry.attributes.position.array[pos1] = clipboardCoord.x;
        pickedObject.geometry.attributes.position.array[pos2] = clipboardCoord.y;
    }
    pickedObject.geometry.attributes.position.needsUpdate = true;
    render();
    // simulate esc pressed
    escPressed();
}

document.getElementById('copyStartPoint1').onclick = function (event) {
    grabXY(0, 1);
}

document.getElementById('copyStartPoint2').onclick = function (event) {
    grabXY(3, 4);
}

function grabXY(pos1, pos2) {
    clipboardCoord.x = pickedObject.geometry.attributes.position.array[pos1];
    clipboardCoord.y = pickedObject.geometry.attributes.position.array[pos2];
}

document.getElementById('pasteStartPoint1').onclick = function (event) {
    alignOnXorY();
}

document.getElementById('pasteStartPoint2').onclick = function (event) {
    alignOnXorY();
}

function alignOnXorY() {
    // da li je horizontalan
    if (lineOrj() == 'hor') {
        // ako je horizontalan menjaj samo Y koordinate
        pickedObject.geometry.attributes.position.array[1] = clipboardCoord.y;
        pickedObject.geometry.attributes.position.array[4] = clipboardCoord.y;
    }
    if (lineOrj() == 'ver') {
        // ako je vertikalan menjaj samo X koordinate
        pickedObject.geometry.attributes.position.array[0] = clipboardCoord.x;
        pickedObject.geometry.attributes.position.array[3] = clipboardCoord.x;
    }
    if (lineOrj() == 'incl') {
        // samo tačku jedan menjaj
        pickedObject.geometry.attributes.position.array[0] = clipboardCoord.x;
        pickedObject.geometry.attributes.position.array[1] = clipboardCoord.y;
    }
    pickedObject.geometry.attributes.position.needsUpdate = true;
    render();
    // simulate esc pressed
    escPressed();
}

function populateLineCoords() {
    lineCoordinates.x1 = pickedObject.geometry.attributes.position.array[0];
    lineCoordinates.y1 = pickedObject.geometry.attributes.position.array[1];
    lineCoordinates.x2 = pickedObject.geometry.attributes.position.array[3];
    lineCoordinates.y2 = pickedObject.geometry.attributes.position.array[4];
}

function showLineProperties() {
    const propPanel = document.getElementById('lineProp');
    propPanel.style.visibility = 'visible';
    populateLineCoords();

    var x1 = lineCoordinates.x1;
    var y1 = lineCoordinates.y1;
    var x2 = lineCoordinates.x2;
    var y2 = lineCoordinates.y2;

    fillFirstCoord(x1, y1);
    fillSecondCoord(x2, y2);

    actualLength = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    document.getElementById('lineLen').value = actualLength;
}

//update only current line changing coordinate depends on input parametar
function updateCoordinates(whichEnd) {
    var newX;
    var newY;

    newLength = document.getElementById('lineLen').value;

    var deltaXn = newLength / actualLength * (lineCoordinates.x2 - lineCoordinates.x1);
    var deltaYn = newLength / actualLength * (lineCoordinates.y2 - lineCoordinates.y1);

    if (whichEnd == 'first') {
        newX = lineCoordinates.x2 - deltaXn;
        newY = lineCoordinates.y2 - deltaYn;
        fillFirstCoord(newX, newY);
    }
    else {
        newX = lineCoordinates.x1 + deltaXn;
        newY = lineCoordinates.y1 + deltaYn;
        fillSecondCoord(newX, newY);
    }
    pickedObject.geometry.attributes.position.needsUpdate = true;
    render();
    // simulate esc pressed
    escPressed();
}

function fillFirstCoord(x, y) {
    document.getElementById('firstPoint_x').value = x;
    document.getElementById('firstPoint_y').value = y;

    pickedObject.geometry.attributes.position.array[0] = x;
    pickedObject.geometry.attributes.position.array[1] = y;
}

function fillSecondCoord(x, y) {
    document.getElementById('lastPoint_x').value = x;
    document.getElementById('lastPoint_y').value = y;

    pickedObject.geometry.attributes.position.array[3] = x;
    pickedObject.geometry.attributes.position.array[4] = y;
}