var isOnRight = false;

$(".infotextConteiner").click(function () {
    $('.tab').toggleClass("offsetTab");
    $('.sale').toggleClass("fontColorIsWhite");
    $('.rent').toggleClass("fontColorIsBlue");
    $(this).toggleClass("rotateOne");

    if (isOnRight) {
        $(this).toggleClass("rotateTwo");
        fileTypeToTranslate = "zipfile3D";
    }
    else {
        isOnRight = true;
        fileTypeToTranslate = "zipfile2D";
    }
    $('#appBuckets').jstree(true).refresh();
});