const { CloverWebSocketInterface } = require('remote-pay-cloud')
const WebSocketClient = require('nodejs-websocket')
const WebSocket = require('ws')

const webSocketFactory = {
  create: ({ webSocketLibrary }) => ({
    get: (endpoint) => {
      const webSocketOverrides = {
        createWebSocket: function(endpoint) {
          // To support self-signed certificates you must pass rejectUnauthorized = false.
          // https://github.com/websockets/ws/blob/master/examples/ssl.js
          const sslOptions = { rejectUnauthorized: false }
          if (webSocketLibrary === 'nodejs-websocket') {
            return WebSocketClient.connect(endpoint, sslOptions)
          }
          // Use the ws library by default.
          return new WebSocket(endpoint, sslOptions)
        }
      }
      if (webSocketLibrary === 'nodejs-websocket') {
        webSocketOverrides.connect = function() {
          console.log('✨', this.endpoint)
          this.webSocket = this.createWebSocket(this.endpoint)
          // The nodejs-websocket library uses 'on' instead of 'addEventListener' and it
          // sends the data unwrapped.  We are accounting for these differences here so
          // that nodejs-websocket plays nicely with our API.
          this.webSocket.on('connect', event => this.notifyOnOpen({ data: event })) // not standard
          this.webSocket.on('text', event => this.notifyOnMessage({ data: event })) // not standard
          this.webSocket.on('binary', event => this.notifyOnMessage({ data: event })) // not standard
          this.webSocket.on('close', event => this.notifyOnClose({ data: event }))
          this.webSocket.on('error', event => this.notifyOnError({ data: event }))
          return this
        }
      }

      return Object.assign(new CloverWebSocketInterface(endpoint), webSocketOverrides)
    }
  })
}

module.exports = webSocketFactory