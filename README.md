## What is app-logs-javascript?

The app-logs-javascript package is a JavaScript client for the [App-Logs](https://app-logs.com) error-tracking app. It provides a simple and easy-to-use API for logging errors and tracking their status.

## Why use app-logs-javascript?

There are many benefits to using app-logs-javascript, including:

* It is easy to use and integrate into your existing code.
* It provides a comprehensive set of features for error tracking, including detailed error reports, custom error labels, and error grouping.
* It is reliable and scalable, so you can be confident that it will be able to handle your error tracking needs, even as your application grows.

## How to install app-logs-javascript

To install the app-logs-javascript package, run the following command:
```powershell
npm install app-logs-javascript
```

or

```powershell
yarn add app-logs-javascript
```

## How to use app-logs-javascript

Once the package is installed, you can import the init function and initialize the client into your JavaScript code as follows:

```javascript
import { init } from 'app-logs-javascript';

// initialization (calling this function one time is enough)
init({ drainUrl: 'YOUR_DRAIN_URL_FROM_THE_APP_SETTING' });
```

To log an error or any data, simply call the `logEvent()` method:
```javascript
import { logEvent } from 'app-logs-javascript';

// data
const transferData = { txId: 2023, label: 'test payment' }

// log the event
logEvent({
    level: "info",
    data: transferData
});
```

To catch an exception, simply call the `captureException()` method in the catch block as follows:
```javascript
import { captureException } from 'app-logs-javascript';

try {
    // your logic here
} catch(error) {
    // log the exception
    captureException(error, {
        userId: 'usr2023',
        operation: 'registration process'
    });
}
```

## Contributing

We welcome contributions to the app-logs-javascript package. If you find a bug or have a suggestion for improvement, please create an issue on GitHub.

## License

The app-logs-javascript package is licensed under the MIT License.