/**
 * NeoSketch AI Web Showcase Scripts
 */

document.addEventListener('DOMContentLoaded', () => {
    // Smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Toast notification when download starts
    const downloadBtns = document.querySelectorAll('a[download]');
    downloadBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            console.log('Downloading NeoSketch APK release...');
        });
    });
});
