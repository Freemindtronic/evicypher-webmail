/**
 * Zeroconf-related tasks.
 *
 * - {@link isZeroconfRunning}: returns whether the Zeroconf service is running or not.
 * - {@link resetZeroconf}: reset Zeroconf phone discovery
 *
 * @module
 */
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
/**
 * A basic task that returns the current state of the Zeroconf service. The
 * current state is reported as a boolean: true if running, false if not.
 */
export const isZeroconfRunning = 
// eslint-disable-next-line require-yield
function (context) {
    return __asyncGenerator(this, arguments, function* () {
        return yield __await(context.zeroconfRunning);
    });
};
/**
 * A basic task that empty the list of phone discovered by the Zeroconf service.
 * It allows a new inspection of all the phones on the network.
 */
export const resetZeroconf = 
// eslint-disable-next-line require-yield
function (context) {
    return __asyncGenerator(this, arguments, function* () {
        // Empty phone list
        context.network.clear();
        // Start fast scan to refresh list
        context.scanFaster.set(true);
        setTimeout(() => {
            context.scanFaster.set(false);
        }, 50);
    });
};
//# sourceMappingURL=zeroconf.js.map