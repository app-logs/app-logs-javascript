export type ErrorObject = {
    name?: string;
    message?: string;
    stack?: string;
    cause?: unknown;
    code?: string;
} & Record<string, any>;

export type ErrorLike = {
    [key: string]: unknown;
    name: string;
    message: string;
    stack: string;
    cause?: unknown;
    code?: string;
};

export interface Options {
    /**
    The maximum depth of properties to preserve when serializing/deserializing.

    @default Number.POSITIVE_INFINITY

    @example
    ```
    import {serializeError} from 'serialize-error';

    const error = new Error('🦄');
    error.one = {two: {three: {}}};

    console.log(serializeError(error, {maxDepth: 1}));
    //=> {name: 'Error', message: '…', one: {}}

    console.log(serializeError(error, {maxDepth: 2}));
    //=> {name: 'Error', message: '…', one: { two: {}}}
    ```
    */
    readonly maxDepth?: number;

    /**
    Indicate whether to use a `.toJSON()` method if encountered in the object. This is useful when a custom error implements its own serialization logic via `.toJSON()` but you prefer to not use it.

    @default true
    */
    readonly useToJSON?: boolean;
}

const list = [
    // Native ES errors https://262.ecma-international.org/12.0/#sec-well-known-intrinsic-objects
    EvalError,
    RangeError,
    ReferenceError,
    SyntaxError,
    TypeError,
    URIError,

    // Built-in errors
    globalThis.DOMException,

    // Node-specific errors
    // https://nodejs.org/api/errors.html
    globalThis.AssertionError,
    globalThis.SystemError,
]
    // Non-native Errors are used with `globalThis` because they might be missing. This filter drops them when undefined.
    .filter(Boolean)
    .map(
        constructor => [constructor.name, constructor],
    );

const errorConstructors = new Map<string, ErrorConstructor>(list as any);

const stringify_original = JSON.stringify;

// big int parsing support
function JsonStringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number) {
    replacer = (_key, value) => (typeof value === 'bigint'
        ? value.toString()
        : value)
    return stringify_original(value, replacer, space);
} JSON.stringify

export class NonError extends Error {
    name = 'NonError';

    constructor(message) {
        super(NonError._prepareSuperMessage(message));
    }

    static _prepareSuperMessage(message) {
        try {
            return JsonStringify(message);
        } catch {
            return String(message);
        }
    }
}

const commonProperties = [
    {
        property: 'name',
        enumerable: false,
    },
    {
        property: 'message',
        enumerable: false,
    },
    {
        property: 'stack',
        enumerable: false,
    },
    {
        property: 'code',
        enumerable: true,
    },
    {
        property: 'cause',
        enumerable: false,
    },
];

const toJsonWasCalled = Symbol('.toJSON was called');

const toJSON = from => {
    if (Object.isExtensible(from)) {
        from[toJsonWasCalled] = true;
    }
    const json = from.toJSON();
    delete from[toJsonWasCalled];
    return json;
};

const getErrorConstructor = name => errorConstructors.get(name) ?? Error;

// eslint-disable-next-line complexity
const destroyCircular = ({
    from,
    seen,
    to,
    forceEnumerable,
    maxDepth,
    depth,
    useToJSON,
    serialize,
}: {
    from: any,
    seen: any[],
    to?: any,
    forceEnumerable?: boolean,
    maxDepth: number,
    depth: number,
    useToJSON?: boolean,
    serialize?: boolean,
}) => {
    if (!to) {
        if (Array.isArray(from)) {
            to = [];
        } else if (!serialize && isErrorLike(from)) {
            const Error = getErrorConstructor(from.name);
            to = new Error();
        } else {
            to = {};
        }
    }

    seen.push(from);

    if (depth >= maxDepth) {
        return to;
    }

    if (useToJSON && typeof from.toJSON === 'function' && from[toJsonWasCalled] !== true) {
        return toJSON(from);
    }

    const continueDestroyCircular = (value: any) => destroyCircular({
        from: value,
        seen: [...seen],
        forceEnumerable,
        maxDepth,
        depth,
        useToJSON,
        serialize
    });

    for (const [key, value] of Object.entries(from)) {
        // eslint-disable-next-line node/prefer-global/buffer
        if (typeof Buffer === 'function' && Buffer.isBuffer(value)) {
            to[key] = '[object Buffer]';
            continue;
        }

        // TODO: Use `stream.isReadable()` when targeting Node.js 18.
        if (value !== null && typeof value === 'object' && typeof value['pipe'] === 'function') {
            to[key] = '[object Stream]';
            continue;
        }

        if (typeof value === 'function') {
            continue;
        }

        if (!value || typeof value !== 'object') {
            to[key] = value;
            continue;
        }

        if (!seen.includes(from[key])) {
            depth++;
            to[key] = continueDestroyCircular(from[key]);

            continue;
        }

        to[key] = '[Circular]';
    }

    for (const { property, enumerable } of commonProperties) {
        if (typeof from[property] !== 'undefined' && from[property] !== null) {
            Object.defineProperty(to, property, {
                value: isErrorLike(from[property]) ? continueDestroyCircular(from[property]) : from[property],
                enumerable: forceEnumerable ? true : enumerable,
                configurable: true,
                writable: true,
            });
        }
    }

    return to;
};

export function serializeError<ErrorType>(value: ErrorType, options: Options = {}) {
    const {
        maxDepth = Number.POSITIVE_INFINITY,
        useToJSON = true,
    } = options;

    if (typeof value === 'object' && value !== null) {
        return destroyCircular({
            from: value,
            seen: [],
            forceEnumerable: true,
            maxDepth,
            depth: 0,
            useToJSON,
            serialize: true,
            to: undefined
        });
    }

    // People sometimes throw things besides Error objects…
    if (typeof value === 'function') {
        // `JSON.stringify()` discards functions. We do too, unless a function is thrown directly.
        return `[Function: ${value.name ?? 'anonymous'}]`;
    }

    return value;
}

export function deserializeError(value: ErrorObject | any, options: Options = {}) {
    const { maxDepth = Number.POSITIVE_INFINITY } = options;

    if (value instanceof Error) {
        return value;
    }

    if (isMinimumViableSerializedError(value)) {
        const Error = getErrorConstructor(value.name);
        return destroyCircular({
            from: value,
            seen: [],
            to: new Error(),
            maxDepth,
            depth: 0,
            serialize: false,

        });
    }

    return new NonError(value);
}

export function isErrorLike(value: any) {
    return Boolean(value)
        && typeof value === 'object'
        && 'name' in value
        && 'message' in value
        && 'stack' in value;
}

function isMinimumViableSerializedError(value) {
    return Boolean(value)
        && typeof value === 'object'
        && 'message' in value
        && !Array.isArray(value);
}

export default errorConstructors;