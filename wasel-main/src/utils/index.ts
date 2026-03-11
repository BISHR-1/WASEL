export function createPageUrl(pageName: string, params?: Record<string, string | number>) {
    let url = '/' + pageName.replace(/ /g, '-');
    
    if (params) {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            searchParams.set(key, String(value));
        });
        url += '?' + searchParams.toString();
    }
    
    return url;
}