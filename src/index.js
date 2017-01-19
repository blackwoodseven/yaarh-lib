'use strict';
const PathParser = require('pathparser')

class YaarhLib {
  constructor() {
    this._routes = {
      get: new PathParser,
      post: new PathParser,
      put: new PathParser,
      delete: new PathParser,
      options: new PathParser,
      head: new PathParser,
      patch: new PathParser
    }
    this._interceptors = []
    this.handler = this.handler.bind(this)
  }

  register (method, path, handler) {
    const self = this;
    this._routes[method].add(path, function() {
      self.exec(handler, this)
    })
  }

  get(path, handler) {
    this.register('get', path, handler)
  }
  post(path, handler){
    this.register('post', path, handler)
  }
  put(path, handler){
    this.register('put', path, handler)
  }
  delete(path, handler){
    this.register('delete', path, handler)
  }
  options(path, handler){
    this.register('options', path, handler)
  }
  head(path, handler){
    this.register('head', path, handler)
  }
  patch(path, handler){
    this.register('patch', path, handler)
  }
  any(path, handler){
    this.register('get', path, handler)
    this.register('post', path, handler)
    this.register('put', path, handler)
    this.register('delete', path, handler)
    this.register('options', path, handler)
    this.register('head', path, handler)
    this.register('patch', path, handler)
  }

  intercept(handler){
    this._interceptors.push(handler)
  }

  exec(handler, pathParameters) {
    //pathParameters come from pathparser library
    //and it is attaching a pathParameters.url on that we just don't want
    //so we remove it
    delete pathParameters.url

    const event = Object.assign({}, this._currentEvent, { pathParameters })

    const shouldStop = this._interceptors.reduce(
        (shouldStop, interceptor) => shouldStop || interceptor(event),
        false
    )
    if (shouldStop) {
      return callback({ message: shouldStop })
    }

    handler(event)
      .then( data => this._callback(null, data))
      .catch( err => this._callback(err))
  }

  handler(event, lambdaContext, callback) {
    console.log('Processing event', event)
    const method = event.httpMethod.toLowerCase()
    const exist = this._routes[method].run('/'+event.pathParameters.proxy)
    console.log('Path Match found', exist)
    if(!exist){
      return callback(null, {
        statusCode: 404,
        headers: {
          'Content-Type' : 'application/json'
        },
        body: JSON.stringify({
          "message" : `Could not find matching action for method "${event.httpMethod}" path "${event.pathParameters.proxy}"`
        })
      })
    }

    this._currentEvent = Object.assign({}, event, { lambdaContext })
    this._callback = callback
  }
}

module.exports = YaarhLib
