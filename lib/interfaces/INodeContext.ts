export default interface INodeContext {
    usage: { rss: string; heapTotal: string; heapUsed: string; external: string },
    environment: string;
    processId: number;
    processTitle: string,
    os: {
        name: string,
        architecture: string,
        machine: string,
        platform: string,
        type: string,
        version: string,
        cpus: string,
        freemem: string
    }
}