/**
 * Title: Commons
 * File: ietdanalysis_commons.js
 * Author: Dong H Jeong
 * Desc: Checking internal process
 * History
 *  - 03/18/2025 Initial version created
 *
 * Reference:
 */

// Function to show full-page Bootstrap spinner
// using bootstrap-5.3.0
function showFullPageSpinner() {
    // Check if the full-page loader already exists
    let fullPageLoader = document.getElementById('fullPageLoader');

    if (!fullPageLoader) {
        // Create the full-page loader
        fullPageLoader = document.createElement('div');
        fullPageLoader.id = 'fullPageLoader';
        fullPageLoader.style.position = 'fixed';
        fullPageLoader.style.top = '0';
        fullPageLoader.style.left = '0';
        fullPageLoader.style.width = '100%';
        fullPageLoader.style.height = '100%';
        fullPageLoader.style.backgroundColor = 'rgba(255, 255, 255, 0.7)';
        fullPageLoader.style.display = 'flex';
        fullPageLoader.style.justifyContent = 'center';
        fullPageLoader.style.alignItems = 'center';
        fullPageLoader.style.zIndex = '9999'; // Higher than anything else

        // Create Bootstrap spinner
        fullPageLoader.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary mb-3" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <h5 class="text-primary">Processing data...</h5>
            </div>
        `;

        document.body.appendChild(fullPageLoader);
    } else {
        // If it exists, make sure it's visible
        fullPageLoader.style.display = 'flex';
    }
}

// Function to hide full-page Bootstrap spinner
// using bootstrap-5.3.0

function hideFullPageSpinner() {
    const fullPageLoader = document.getElementById('fullPageLoader');

    if (fullPageLoader) {
        fullPageLoader.style.display = 'none';
    }
}



// Helper function to process zoom action
function processZoomAction(chart, event) {
    (async () => {
        try {
            let min = event.min === null ? event.dataMin : event.min;
            let max = event.max === null ? event.dataMax : event.max;

            // Optional: Add a small delay to ensure UI responsiveness
            await new Promise(resolve => setTimeout(resolve, 10));

            await new Promise((resolve) => {
                if (typeof Zoom_based_UpdateCharts === 'function') {
                    Zoom_based_UpdateCharts(min, max);
                }
                resolve();
            });
        } finally {
            // Hide spinner after processing
            hideFullPageSpinner();
            chart.hideLoading();
        }
    })();
}


/**
 * Show notification to user
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 */
function showNotification(title, message) {
    // If using a notification library like toastr
    if (typeof toastr !== 'undefined') {
        toastr.success(message, title);
        return;
    }

    // Simple fallback notification
    if (!document.getElementById('notification-container')) {
        const notificationHTML = `
            <div id="notification-container" style="position: fixed; top: 20px; right: 20px; z-index: 9999;"></div>
        `;
        $('body').append(notificationHTML);
    }

    const notification = `
        <div class="notification" style="background-color: #4CAF50; color: white; padding: 15px; margin-bottom: 10px; border-radius: 5px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); min-width: 250px;">
            <h4 style="margin: 0 0 5px; font-size: 16px;">${title}</h4>
            <p style="margin: 0; font-size: 14px;">${message}</p>
        </div>
    `;

    const $notification = $(notification);
    $('#notification-container').append($notification);

    // Auto-remove after 2 seconds
    setTimeout(() => {
        $notification.fadeOut(300, function() {
            $(this).remove();
        });
    }, 2000);
}