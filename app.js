const VERSION = '1.0.38';

document.getElementById('site-version').textContent = 'v' + VERSION;

document.documentElement.classList.add('mobile-collapse-ready');

const mobileView = window.matchMedia('(max-width: 767px)');
const mobileToggles = document.querySelectorAll('.faq-toggle, .tool-toggle');

function syncMobileView() {
    mobileToggles.forEach(function(button) {
        button.setAttribute('aria-expanded', String(!mobileView.matches));
        button.disabled = !mobileView.matches;
        button.tabIndex = mobileView.matches ? 0 : -1;
    });
}

mobileToggles.forEach(function(button) {
    button.addEventListener('click', function() {
        if (!mobileView.matches) return;
        button.setAttribute('aria-expanded', String(button.getAttribute('aria-expanded') !== 'true'));
    });
});
syncMobileView();
mobileView.addEventListener('change', syncMobileView);

function sendAdsConversion(action, callback) {
    const settings = window.adsConversions;
    const sendTo = settings?.sendTo[action];
    if (!/^AW-\d+$/.test(settings?.id) || !sendTo?.startsWith(settings.id + '/') || sendTo.includes('REPLACE_')) {
        return false;
    }

    const parameters = { send_to: sendTo };
    if (callback) {
        parameters.event_callback = callback;
        parameters.event_timeout = 1500;
    }
    gtag('event', 'conversion', parameters);
    return true;
}

function sendAdsActionEvent(action, callback) {
    const settings = window.adsConversions;
    if (!/^AW-\d+$/.test(settings?.id)) return false;

    const events = {
        form: { name: 'generate_lead', category: 'Contact', label: 'Contact Form Submit' },
        whatsapp: { name: 'contact', category: 'Engagement', label: 'WhatsApp Click' },
        call: { name: 'contact', category: 'Engagement', label: 'Phone Call Click' }
    };
    const actionEvent = events[action];
    const parameters = {
        send_to: settings.id,
        event_category: actionEvent.category,
        event_label: actionEvent.label
    };
    if (callback) {
        parameters.event_callback = callback;
        parameters.event_timeout = 1500;
    }
    gtag('event', actionEvent.name, parameters);
    return true;
}

document.addEventListener('click', function(event) {
    const link = event.target.closest('a[href]');
    if (!link) return;

    if (link.protocol === 'tel:') {
        let navigated = false;
        const navigate = function() {
            if (navigated) return;
            navigated = true;
            window.location.href = link.href;
        };
        const conversionSent = sendAdsConversion('call', navigate);
        if (sendAdsActionEvent('call', conversionSent ? null : navigate)) {
            event.preventDefault();
            setTimeout(navigate, 1600);
        }
    } else if (['wa.me', 'api.whatsapp.com'].includes(link.hostname.toLowerCase())) {
        sendAdsActionEvent('whatsapp');
        sendAdsConversion('whatsapp');
    }
});

const contactForm = document.querySelector('.contact-form');
contactForm.addEventListener('submit', async function(event) {
    event.preventDefault();
    const submitButton = contactForm.querySelector('[type="submit"]');
    if (submitButton.disabled) return;
    const status = contactForm.querySelector('[role="status"]');
    const endpoint = new URL(contactForm.action);
    endpoint.pathname = '/ajax' + endpoint.pathname;
    submitButton.disabled = true;
    status.textContent = 'שולחת הודעה...';

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(Object.fromEntries(new FormData(contactForm)))
        });
        if (!response.ok) throw new Error('FormSubmit rejected the request');
        const result = await response.json();
        if (result.success !== true && result.success !== 'true') throw new Error('FormSubmit did not confirm success');

        sendAdsActionEvent('form');
        sendAdsConversion('form');
        contactForm.reset();
        status.textContent = 'ההודעה נשלחה בהצלחה. אחזור אליכם בהקדם.';
    } catch (error) {
        status.textContent = 'לא הצלחנו לשלוח את ההודעה. אפשר לנסות שוב או לפנות בטלפון או בוואטסאפ.';
        console.error('Contact form submission failed', error);
    } finally {
        submitButton.disabled = false;
    }
});

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
