/* eslint-disable node/no-unsupported-features/es-syntax */

import pathToRegexp from 'path-to-regexp';

import { WebDriverError } from './errors';

export type HttpMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'ALL';

const routes = new WeakMap();

export function Command(httpMethod: HttpMethod, uriTemplate: string) {
  return function (target, propertyKey, descriptor) {
    let originalMethod = descriptor.value;

    descriptor.value = async function jsonMethodWrapper(req, res) {
      try {
        const result = await originalMethod.call(this, { req, res });
        res.status(200).json({ value: result });
      } catch (err) {
        const wderr = WebDriverError.cast(err);
        res.status(wderr.status).json({
          value: wderr.toJSON(),
        });
      }
    };

    routes.set(descriptor.value, [httpMethod, uriTemplate]);
    return descriptor;
  };
}

function getCommands(instance) {
  const proto = Reflect.getPrototypeOf(instance);

  return Object.getOwnPropertyNames(proto)
    .map((name) => Reflect.getOwnPropertyDescriptor(proto, name))
    .map((descriptor) => descriptor.value)
    .filter((maybeRouteFn) => typeof maybeRouteFn === 'function' && routes.has(maybeRouteFn));
}

export function addRoutes(instance, app) {
  const commands = getCommands(instance);
  return commands.reduce(function(app, callback) {
    const [method, path] = routes.get(callback);
    return app[method.toLowerCase()](path, callback.bind(instance));
  }, app);
}

function addRoute(app, callback) {
  const [method, path] = routes.get(callback);
  return app[method.toLowerCase()](path, callback);
}

export function hasRoute(instance, routeName) {
  const commands = getCommands(instance);
  const regexps = commands.map((fn) => pathToRegexp(routes.get(fn)[1]));
  return regexps.some((regexp) => regexp.test(routeName));
}
