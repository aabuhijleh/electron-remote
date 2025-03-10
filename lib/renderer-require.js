'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.rendererRequireDirect = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

/**
 * Creates a BrowserWindow, requires a module in it, then returns a Proxy
 * object that will call into it. You probably want to use {requireTaskPool}
 * instead.
 *
 * @param  {string} modulePath  The path of the module to include.
 * @param  {number} timeout     The timeout to use, defaults to 240sec
 * @return {Object}             Returns an Object with a `module` which is a Proxy
 *                              object, and a `unsubscribe` method that will clean up
 *                              the window.
 */
let rendererRequireDirect = exports.rendererRequireDirect = (() => {
  var _ref = _asyncToGenerator(function* (modulePath) {
    let timeout = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 240 * 1000;

    let bw = new BrowserWindow({ width: 500, height: 500, show: false, webPreferences: { nodeIntegration: true } });
    let fullPath = require.resolve(modulePath);

    let ready = _Observable.Observable.merge((0, _remoteEvent.fromRemoteWindow)(bw, 'did-finish-load', true), (0, _remoteEvent.fromRemoteWindow)(bw, 'did-fail-load', true).filter(function (_ref2) {
      var _ref3 = _slicedToArray(_ref2, 2);

      let errCode = _ref3[1];
      return errCode !== 0;
    }).mergeMap(function (_ref4) {
      var _ref5 = _slicedToArray(_ref4, 3);

      let errMsg = _ref5[2];
      return _Observable.Observable.throw(new Error(errMsg));
    })).take(1).toPromise();

    /* Uncomment for debugging!
    bw.show();
    bw.openDevTools();
    */

    let preloadFile = _path2.default.join(__dirname, 'renderer-require-preload.html');
    bw.loadURL(`file:///${preloadFile}?module=${encodeURIComponent(fullPath)}`);
    yield ready;

    let fail = yield (0, _executeJsFunc.executeJavaScriptMethod)(bw, 'window.moduleLoadFailure');
    if (fail) {
      let msg = yield (0, _executeJsFunc.executeJavaScriptMethod)(bw, 'window.moduleLoadFailure.message');
      throw new Error(msg);
    }

    return {
      module: (0, _executeJsFunc.createProxyForRemote)(bw).requiredModule,
      executeJavaScriptMethod: function (chain) {
        for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }

        return (0, _executeJsFunc.executeJavaScriptMethodObservable)(bw, timeout, chain, ...args).toPromise();
      },
      executeJavaScriptMethodObservable: function (chain) {
        for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
          args[_key2 - 1] = arguments[_key2];
        }

        return (0, _executeJsFunc.executeJavaScriptMethodObservable)(bw, timeout, chain, ...args);
      },
      unsubscribe: function () {
        return bw.isDestroyed() ? bw.destroy() : bw.close();
      }
    };
  });

  return function rendererRequireDirect(_x) {
    return _ref.apply(this, arguments);
  };
})();

/**
 * requires a module in BrowserWindows that are created/destroyed as-needed, and
 * returns a Proxy object that will secretly marshal invocations to other processes
 * and marshal back the result. This is the cool method in this library.
 *
 * Note that since the global context is created / destroyed, you *cannot* rely
 * on module state (i.e. global variables) to be consistent
 *
 * @param  {string} modulePath       The path to the module. You may have to
 *                                   `require.resolve` it.
 * @param  {Number} maxConcurrency   The maximum number of concurrent processes
 *                                   to run. Defaults to 4.
 * @param  {Number} idleTimeout      The amount of time to wait before closing
 *                                   a BrowserWindow as idle, in ms
 * @param  {Number} methodTimeout    The amount of time to wait before a method
 *                                   fails, in ms
 *
 * @return {Proxy}                   An ES6 Proxy object representing the module.
 */


exports.requireTaskPool = requireTaskPool;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _remoteEvent = require('./remote-event');

var _AsyncSubject = require('rxjs/AsyncSubject');

var _Observable = require('rxjs/Observable');

var _Subject = require('rxjs/Subject');

require('rxjs/add/observable/merge');

require('rxjs/add/observable/throw');

require('rxjs/add/observable/fromPromise');

require('rxjs/add/observable/of');

require('rxjs/add/observable/defer');

require('rxjs/add/operator/map');

require('rxjs/add/operator/mergeAll');

require('rxjs/add/operator/mergeMap');

require('rxjs/add/operator/multicast');

require('rxjs/add/operator/take');

require('rxjs/add/operator/toPromise');

var _executeJsFunc = require('./execute-js-func');

require('./custom-operators');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const d = require('debug')('electron-remote:renderer-require');

const BrowserWindow = process.type === 'renderer' ? require('electron').remote.BrowserWindow : require('electron').BrowserWindow;function requireTaskPool(modulePath) {
  let maxConcurrency = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 4;
  let idleTimeout = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5 * 1000;
  let methodTimeout = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 240 * 1000;

  return new RendererTaskpoolItem(modulePath, maxConcurrency, idleTimeout, methodTimeout).moduleProxy;
}

/**
 * This class implements the scheduling logic for queuing and dispatching method
 * invocations to various background windows. It is complicated. But in like,
 * a cool way.
 */
class RendererTaskpoolItem {
  constructor(modulePath, maxConcurrency, idleTimeout, methodTimeout) {
    const freeWindowList = [];
    const invocationQueue = new _Subject.Subject();
    const completionQueue = new _Subject.Subject();

    // This method will find a window that is currently idle or if it doesn't
    // exist, create one.
    const getOrCreateWindow = () => {
      let item = freeWindowList.pop();
      if (item) return _Observable.Observable.of(item);

      return _Observable.Observable.fromPromise(rendererRequireDirect(modulePath, methodTimeout));
    };

    // Here, we set up a pipeline that maps a stream of invocations (i.e.
    // something we can pass to executeJavaScriptMethod) => stream of Future
    // Results from various windows => Stream of completed results, for which we
    // throw the Window that completed the result back onto the free window stack.
    invocationQueue.map((_ref6) => {
      let chain = _ref6.chain,
          args = _ref6.args,
          retval = _ref6.retval;
      return _Observable.Observable.defer(() => {
        return getOrCreateWindow().mergeMap(wnd => {
          d(`Actually invoking ${chain.join('.')}(${JSON.stringify(args)})`);
          let ret = wnd.executeJavaScriptMethodObservable(chain, ...args);

          ret.multicast(retval).connect();
          return ret.map(() => wnd).catch(() => _Observable.Observable.of(wnd));
        });
      });
    }).mergeAll(maxConcurrency).subscribe(wnd => {
      if (!wnd || !wnd.unsubscribe) throw new Error("Bogus!");
      freeWindowList.push(wnd);
      completionQueue.next(true);
    });

    // Here, we create a version of RecursiveProxyHandler that will turn method
    // invocations into something we can push onto our invocationQueue pipeline.
    // This is the object that ends up being returned to the caller of
    // requireTaskPool.
    this.moduleProxy = _executeJsFunc.RecursiveProxyHandler.create('__removeme__', (methodChain, args) => {
      let chain = methodChain.splice(1);

      d(`Queuing ${chain.join('.')}(${JSON.stringify(args)})`);
      let retval = new _AsyncSubject.AsyncSubject();

      invocationQueue.next({ chain: ['requiredModule'].concat(chain), args, retval });
      return retval.toPromise();
    });

    // If we haven't received any invocations within a certain idle timeout
    // period, burn all of our BrowserWindow instances
    completionQueue.guaranteedThrottle(idleTimeout).subscribe(() => {
      d(`Freeing ${freeWindowList.length} taskpool processes`);
      while (freeWindowList.length > 0) {
        let wnd = freeWindowList.pop();
        if (wnd) wnd.unsubscribe();
      }
    });
  }
}