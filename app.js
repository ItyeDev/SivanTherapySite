const VERSION = '1.0.22';

document.getElementById('site-version').textContent = 'v' + VERSION;

function saveContact() {
    const vCardData = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:סיון אייל',
        'ORG:פסיכותרפיה אינטגרטיבית וטיפול באמנות',
        'TITLE:פסיכותרפיסטית (M.A)',
        'TEL;TYPE=CELL:050-9981821',
        'EMAIL:sivan.eyal2@gmail.com',
        'ADR;TYPE=WORK;;גילון, משגב;;Israel',
        'END:VCARD'
    ].join('\r\n');

    const blob = new Blob([vCardData], { type: 'text/vcard' });

    function downloadFallback() {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'sivan.vcf');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    // Web Share API with files – Android/iOS opens native share sheet → Contacts app
    if (navigator.share) {
        const file = new File([blob], 'sivan.vcf', { type: 'text/vcard' });
        navigator.share({ files: [file] })
            .catch(function(err) {
                if (err.name !== 'AbortError') {
                    downloadFallback();
                }
            });
        return;
    }

    // Fallback for desktop browsers
    downloadFallback();
}

function openMap(query) {
    var isAndroidOrIOS = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
    var url = isAndroidOrIOS
        ? 'geo:0,0?q=' + encodeURIComponent(query)
        : 'https://maps.google.com/maps?q=' + encodeURIComponent(query);
    window.open(url, '_blank', 'noopener,noreferrer');
}
