var isOnLeft = true;

function changeSliderPosition() {
    var position;

    if (isOnLeft) {
        position = 30;
        fileTypeToTranslate = "zipfile2D";
    }
    else {
        position = 2;
        fileTypeToTranslate = "zipfile3D";
    }

    isOnLeft = !isOnLeft;
    var slider = document.getElementById('discID');
    slider.style.left = position + 'px';
    $('#appBuckets').jstree(true).refresh();
}