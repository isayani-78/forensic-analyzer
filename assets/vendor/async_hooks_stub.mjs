export class AsyncResource {
  constructor() {}
  runInAsyncScope(fn, thisArg, ...args) {
    return fn.apply(thisArg, args);
  }
}

export default {
  AsyncResource
};