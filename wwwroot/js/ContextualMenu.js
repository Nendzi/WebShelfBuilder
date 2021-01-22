const cm = document.getElementById('cm');

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
})