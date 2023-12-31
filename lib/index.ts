import axios, { AxiosError } from "axios";
import { serializeError } from "./helpers/serialize-error";
import IBrowserContext from "./interfaces/IBrowserContext";
import IEventData from "./interfaces/IEventData";
import IInitOptions from "./interfaces/IInitOptions";
import INodeContext from "./interfaces/INodeContext";

let _appLogsInitOptions: IInitOptions | undefined;


declare global {
    interface Window {
        appLogsInitOptions: IInitOptions | undefined
    }

    var appLogsInitOptions: IInitOptions | undefined;
}

/**
 * Initialize the client
 * 
 * @param options initialization options
 */
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
        // if the drain url is not defined, we take it from the env
        if (!global.appLogsInitOptions?.drainUrl) {
            global.appLogsInitOptions = {
                drainUrl: (process.env.APP_LOGS_DRAIN_URL ?? process.env.NEXT_PUBLIC_APP_LOGS_DRAIN_URL)!
            }
        }

        return global.appLogsInitOptions;
    } else if (isBrowserContext()) {
        return window.appLogsInitOptions;
    } else {
        return _appLogsInitOptions;
    };
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

        // browser context
        data.browserContext = getBrowserContext();

        // get app usage
        const usage = process.memoryUsage ? process.memoryUsage() : null;

        // set usage
        data.usage = usage ? {
            rss: `${usage.rss / 1024 / 1024} mb`,
            heapTotal: `${usage.heapTotal / 1024 / 1024} mb`,
            heapUsed: `${usage.heapUsed / 1024 / 1024} mb`,
            external: `${usage.external / 1024 / 1024} mb`,
        } : undefined;

        // set process value
        data.processTitle = process.title;

        // node environment
        data.environment = process.env.NODE_ENV;

        // node process id
        data.processId = process.pid;

        // os information
        const os = require('os');

        // os parameters
        const osParameters = Object.keys(os);

        // os information
        data.os = {};

        for (const osKey of osParameters) {
            try {
                if (typeof os[osKey] === "function") {
                    data.os[osKey] = os[osKey]();
                } else {
                    data.os[osKey] = os[osKey];
                }
            } catch (error) {
                // ignore
            }
        }
    }

    return data;
}

function isServiceWorkerEnvironment() {
    return typeof importScripts === "function";
}

/**
 * Capture an exception
 * 
 * @param input exception data
 * @param extra extra information
 */
async function captureException(input: any, extra?: Record<string, any>) {
    try {
        // construct the payload
        const payload: IEventData = {
            event_id: generateUuid(),
            source: "javascript",
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
        if (initOptions?.drainUrl) {
            await axios.request({
                url: initOptions.drainUrl,
                method: 'post',
                data: payload
            }).then(() => {
                // success
            }).catch((err: AxiosError<any>) => {
                console.warn('AppLogs SDK: Unable to submit the captured exception.', err.response?.data?.message);
            })
        } else {
            console.warn('AppLogs SDK: Unable to get initialization options. Make sure to restart the application after initialization.')
        }
    } catch (error) {
        console.error('AppLogs SDK: internal error.', serializeError(error));
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

/**
 * Log an event
 * 
 * @param eventData event data
 */
async function logEvent(eventData: Omit<IEventData, "source" | "browserContext" | "nodeContext" | "serviceWorkerEnvironment" | "timestamp">) {
    try {
        // construct the payload
        const payload: IEventData = {
            event_id: generateUuid(),
            ...eventData,
            data: serializeError(eventData.data),
            browserContext: getBrowserContext(),
            nodeContext: getNodeContext(),
            serviceWorkerEnvironment: isServiceWorkerEnvironment(),
            source: "javascript",
            timestamp: new Date().getTime(),
        }

        // initial options
        const initOptions = getAppLogsInitOptions();

        // initialization options
        if (initOptions?.drainUrl) {
            await axios.request({
                url: initOptions.drainUrl,
                method: 'post',
                data: payload
            }).then(() => {
                // success
            }).catch((err: AxiosError<any>) => {
                console.warn('AppLogs SDK: Unable to submit the log event.', err.response?.data?.message);
            })
        } else {
            console.warn('AppLogs SDK: make sure you call the init method with the required parameter (drainUrl).')
        }
    } catch (error) {
        console.error('AppLogs Js Client SDK: internal error.', serializeError(error));
    }
}

const AppLogs = {
    captureException,
    logEvent,
    init,
}

export default AppLogs; 