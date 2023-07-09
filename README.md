# Welcome to `@beyond-js/backend` package

This package is a key component of BeyondJS and must be installed as a dependency to use Bridges in your project.
@beyond-js/backend provides a node-based backend service with Websocket connection and supports the execution of
Bridges, which allow you to create backend APIs with included data typing and corresponding client code to consume it.

Installation:

To install BeyondJS/Backend, run the following command in your terminal:

```
npm install @beyond-js/backend
```

### Config

- `MAX_ACTIVE_REQUEST`: [default: 60] Sets the maximum number of concurrent WebSocket connections that the library can handle, preventing overload and ensuring resource allocation efficienc

- `CACHE_EXPIRATION_TIME`: Allows setting the duration for caching response answers, improving performance by avoiding redundant computations within the specified timeframe.


### Documentation:

For more information on using `@beyond-js/backend` and creating Bridges, see the full documentation at the following
link: [BeyondJS/ Backend docs](https://beyondjs.com/docs/backend/intro).


### License

MIT.