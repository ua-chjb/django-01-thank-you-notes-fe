export const trackPageView = (path) => {
    if (window.gtag) {
        window.gtag("config", "G-L5BGCDP9QQ", {
            page_path: path
        });
    }
};