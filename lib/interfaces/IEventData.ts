export default interface IEventData {
    event_id?: string;
    level?: "info" | "warning" | "error" | "debug" | "fatal";
    data: any,
    extra?: Record<string, any>;
    httpContext?: any;
    browserContext?: any;
    nodeContext?: any;
    serviceWorkerEnvironment: boolean
}