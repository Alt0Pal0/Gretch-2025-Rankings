// Analytics tracking utility
class AnalyticsTracker {
    constructor() {
        this.tracked = false;
    }

    // Track page view
    async trackPageView(pagePath = null, referrer = null) {
        // Avoid double tracking
        if (this.tracked) return;
        
        try {
            const path = pagePath || window.location.pathname;
            const ref = referrer || document.referrer;
            
            await fetch('/api/track-view', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    page_path: path,
                    referrer: ref
                })
            });
            
            this.tracked = true;
            console.debug('📊 Page view tracked:', path);
            
        } catch (error) {
            console.debug('Analytics tracking failed:', error);
            // Fail silently - don't disrupt user experience
        }
    }

    // Auto-track on page load
    autoTrack() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.trackPageView();
            });
        } else {
            this.trackPageView();
        }
    }
}

// Create global instance
window.analytics = new AnalyticsTracker();

// Auto-track unless explicitly disabled
if (!window.DISABLE_ANALYTICS) {
    window.analytics.autoTrack();
}