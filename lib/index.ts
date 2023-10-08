import axios from "axios";
import { serializeError } from "./helpers/serialize-error";
import IEventData from "./interfaces/IEventData";
import IInitOptions from "./interfaces/IInitOptions";
import INodeContext from "./interfaces/INodeContext";
import IBrowserContext from "./interfaces/IBrowserContext";

let _appLogsInitOptions: IInitOptions | undefined;


declare global {
    interface Window {
        appLogsInitOptions: IInitOptions
    }
}

function init(options: IInitOptions) {
    if (isNodeContext()) {
        global.appLogsInitOptions = options;
    } else if (isBrowserContext()) {
        window.appLogsInitOptions = options;
    } else {
        _appLogsInitOptions = options;
    }
}

function getAppLogsInitOptions(): IInitOptions | undefined {
    if (isNodeContext()) {
        return global.appLogsInitOptions;
    } else if (isBrowserContext()) {
        return window.appLogsInitOptions;
    } else {
        _appLogsInitOptions;
    }
}

function isBrowserContext() {
    return typeof window === "object";
}

function isNodeContext() {
    return typeof process === "object" && typeof require === "function";
}

function getBrowserContext() {
    let data: Partial<IBrowserContext> | undefined = undefined;

    if (isBrowserContext()) {
        // initialize data
        data = {};

        // current href
        data.location = window.location;

        // set navigator
        data.navigator = window.navigator;
    }

    return data;
}

function getNodeContext() {
    let data: Partial<INodeContext> | undefined = undefined;

    if (isNodeContext()) {
        data = {};

        // get app usage
        const usage = process.memoryUsage();

        // set usage
        data.usage = {
            rss: `${usage.rss / 1024 / 1024} mb`,
            heapTotal: `${usage.heapTotal / 1024 / 1024} mb`,
            heapUsed: `${usage.heapUsed / 1024 / 1024} mb`,
            external: `${usage.external / 1024 / 1024} mb`,
        };

        // node environment
        data.environment = process.env.NODE_ENV;

        // node process id
        data.processId = process.pid;

        // os information
        const os = require('node:os');

        // os information
        data.os = {
            name: os.hostname(),
            architecture: os.arch(),
            machine: os.machine(),
            platform: os.platform(),
            type: os.type(),
            version: os.version(),
            cpus: os.cpus(),
            freemem: os.freemem()
        }
    }

    return data;
}

function isServiceWorkerEnvironment() {
    return typeof importScripts === "function";
}

async function captureException(input: any, extra?: Record<string, any>) {
    // construct the payload
    const payload: IEventData = {
        event_id: generateUuid(),
        level: "error",
        data: serializeError(input),
        extra,
        browserContext: getBrowserContext(),
        nodeContext: getNodeContext(),
        serviceWorkerEnvironment: isServiceWorkerEnvironment(),
        timestamp: new Date().getTime()
    }

    // initial options
    const initOptions = getAppLogsInitOptions();

    // initialization options
    if (initOptions) {
        await axios.request({
            url: initOptions.drainUrl,
            method: 'post',
            data: payload
        }).then(() => {
            // success
        }).catch(() => {
            console.warn('AppLogs SDK: Unable to submit the captured exception.');
        })
    } else {
        console.warn('AppLogs SDK: Unable to get initialization options.')
    }

}

function generateUuid() {
    let
        d = new Date().getTime(),
        d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        let r = Math.random() * 16;
        if (d > 0) {
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
    });
}

async function logEvent(eventData: Omit<IEventData, "browserContext" | "nodeContext" | "serviceWorkerEnvironment" | "timestamp">) {
    // construct the payload
    const payload: IEventData = {
        event_id: generateUuid(),
        ...eventData,
        data: serializeError(eventData.data),
        browserContext: getBrowserContext(),
        nodeContext: getNodeContext(),
        serviceWorkerEnvironment: isServiceWorkerEnvironment(),
        timestamp: new Date().getTime()
    }

    // initial options
    const initOptions = getAppLogsInitOptions();

    // initialization options
    if (initOptions) {
        await axios.request({
            url: initOptions.drainUrl,
            method: 'post',
            data: payload
        }).then(() => {
            // success
        }).catch(() => {
            console.warn('AppLogs SDK: Unable to submit the log event.');
        })
    } else {
        console.warn('AppLogs SDK: Unable to get initialization options.')
    }
}

const AppLogs = {
    captureException,
    logEvent,
    init,
}

export default AppLogs; 