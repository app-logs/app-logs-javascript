import IBrowserContext from "./IBrowserContext";

export default interface INodeContext {
    usage: { rss: string; heapTotal: string; heapUsed: string; external: string },
    environment: string;
    processId: number;
    processTitle: string,
    browserContext: Partial<IBrowserContext>;
    os: any
}