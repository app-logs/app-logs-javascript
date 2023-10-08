interface Location {
    ancestorOrigins: any;
    hash: string;
    host: string;
    hostname: string;
    href: string;
    origin: string;
    pathname: string;
    port: string;
    protocol: string;
    search: string;
    assign(url: string | URL): void;
    reload(): void;
    replace(url: string | URL): void;
}

interface Navigator {
    clipboard: any;
    credentials: any;
    doNotTrack: string | null;
    geolocation: any;
    maxTouchPoints: number;
    mediaCapabilities: any;
    mediaDevices: any;
    mediaSession: any;
    permissions: any;
    serviceWorker: any;
    userActivation: any;
    wakeLock: any;
}

export default interface IBrowserContext {
    location: Location;
    navigator: Navigator;
}