import IBrowserContext from "./IBrowserContext";
import INodeContext from "./INodeContext";

export default interface IEventData {
    event_id?: string;
    level?: "info" | "warning" | "error" | "debug" | "fatal";
    data: any,
    extra?: Record<string, any>;
    httpContext?: any;
    browserContext?: Partial<IBrowserContext>;
    nodeContext?: Partial<INodeContext>;
    serviceWorkerEnvironment: boolean;
    timestamp: number;
}