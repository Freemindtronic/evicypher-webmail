/**
 * Persistent background script.
 *
 * The background script is responsible for starting backgrounds tasks and services.
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
import debug from 'debug';
import { browser } from 'webextension-polyfill-ts';
import { ErrorMessage, ExtensionError } from '$/error';
import { Observable } from '$/observable';
import { Task, } from '$/task';
import { isZeroconfServiceInstalled, startZeroconfService, } from './services/zeroconf';
import { cloud } from './tasks/cloud';
import { decrypt, decryptFiles } from './tasks/decrypt';
import { encrypt, encryptFiles } from './tasks/encrypt';
import { login } from './tasks/login';
import { pair } from './tasks/pair';
import { isZeroconfRunning, resetZeroconf } from './tasks/zeroconf';
import 'cypress/types/bluebird';
/** Variables for the IP address generator */
var localIpList = [];
var option = null;
var resp;
var DefaultPort = 10001;
var DefaultTimeDisplay = 60;
class IPHolder {
    constructor(options) {
        this.auto = options.auto;
        this.high = options.high;
        this.low = options.low;
    }
}
var defaultIPHolder = new IPHolder({
    auto: true,
    high: ip2int('192.168.0.1'),
    low: ip2int('192.168.0.127'),
});
const options = { auto: true };
const ipHolder = new IPHolder(options);
function parameterHolder(dark, log, fill, border, twoStep, searchcc, bordercc, fillcc, searchlogin, uncheck, uncheckcc, searchcr, searchRegister, force, port, banner, timeDisplay, IPholder, enableEviDNS) {
    this.dark = dark;
    this.log = log;
    this.fill = fill;
    this.border = border;
    this.bordercc = bordercc;
    this.fillcc = fillcc;
    this.uncheckcc = uncheckcc;
    this.uncheck = uncheck;
    this.force = force;
    this.port = port;
    this.banner = banner;
    this.searchRegister = searchRegister;
    this.searchcc = searchcc;
    this.searchcr = searchcr;
    this.searchlogin = searchlogin;
    this.twoStep = twoStep;
    this.timeDisplay = timeDisplay;
    this.IPholder = IPholder;
    this.enableEviDNS = enableEviDNS;
}
/** The background context, used to share information between tasks and services. */
const context = {
    zeroconfRunning: false,
    network: new Map(),
    scanFaster: new Observable(false),
    newDeviceFound: new Observable(undefined),
};
/**
 * Starts a background task, on a given port.
 *
 * @param task - Background task to start
 * @param port - Browser port to exchange with the foreground task
 * @param log - A logger function
 */
const startTask = async (task, port, log) => {
    log('Starting background task');
    // Start the background task
    const controller = new AbortController();
    const generator = task(context, (report) => {
        if (!controller.signal.aborted)
            port.postMessage({ type: 'report', report });
    }, controller.signal);
    // Handle disconnections and abortion requests
    port.onDisconnect.addListener(() => {
        controller.abort();
    });
    port.onMessage.addListener((message) => {
        if (message.type === 'abort')
            controller.abort();
    });
    // Run all the steps of the background task
    let result = await generator.next();
    while (!result.done && !controller.signal.aborted)
        result = await nextStep(generator, result, port, log);
    if (result.done)
        port.postMessage({ type: 'result', result: result.value });
};
/**
 * Runs one step of the generator (i.e. the code of a background task between
 * two `yield`s), and returns the result.
 */
const nextStep = async (generator, result, port, log) => {
    // Send a request
    port.postMessage({ type: 'request', request: result.value });
    // Wait for the response to arrive
    const message = await new Promise((resolve) => {
        const onMessage = (message) => {
            port.onMessage.removeListener(onMessage);
            resolve(message);
        };
        port.onMessage.addListener(onMessage);
    });
    log('Message received: %o', message);
    // If its a response to a request, resume the background task
    if (message.type === 'response')
        return generator.next(message.response);
    // Abort requests are handled in the main function, no need to handle them twice
    if (message.type === 'abort')
        return result;
    throw new Error(`Unexpected message: ${message}`);
};
// Enable logging
if (process.env.NODE_ENV !== 'production')
    debug.enable('*');
// Start the Zeroconf scanning service
isZeroconfServiceInstalled()
    .then(async (installed) => installed
    ? // If the service is properly installed, start it
        startZeroconfService(context)
    : // Otherwise, open a tutorial
        browser.tabs.create({
            url: browser.runtime.getURL('/zeroconf-unavailable.html'),
        }))
    .catch((error) => {
    debug('service:zeroconf')('%o', error);
    context.zeroconfRunning = false;
});
/**
 * Asynchronous generator function generating IP Addresses converted from
 * integers using the int2ip() function. It yields/generates the entire array of
 * IP addresses each time 'yield ipList' is called in a brute-force manner.
 */
function bruteForceGenerator() {
    return __asyncGenerator(this, arguments, function* bruteForceGenerator_1() {
        const ipList = generateListIP().map((ip) => int2ip(parseIPToInt(ip)));
        while (true) {
            yield yield __await(ipList);
            yield __await(new Promise(() => setTimeout(() => 1000)));
        }
    });
}
/** @param ip */
function parseIPToInt(ip) {
    const parts = ip.split('.');
    return ((parseInt(parts[0]) << 24) +
        (parseInt(parts[1]) << 16) +
        (parseInt(parts[2]) << 8) +
        parseInt(parts[3]));
}
// WILL HAVE TO CONVERT THIS JS GENERATOR INTO TS WITH MODULAR FUNCTIONS
function generateListIP(option = {}) {
    const Ips = [];
    if (option.IPholder === undefined || option.IPholder.auto) {
        for (const element of localIpList)
            for (let j = 1; j < 255; j++)
                Ips.push(`${element} ${j}`);
        initListIP({
            error: () => {
                console.log('an error has occured');
            },
            warning: () => {
                console.log('a warning has been issued');
            },
        });
    }
    else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        for (let i = option.IPholder.low || 0; i <= option.IPholder.high || 0; i++)
            Ips.push(i);
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Ips;
}
// Additional functions used in the generateListIP function:
// function initParameter(callback: any) {
//   getParameter(function (resp: any) {
//     option = resp
//     initFunctionnality(callback)
//     callback()
//   })
// }
// GetParameter function
// function getParameter(callback: (tempParam: ParameterHolder) => void): void {
//   //create ext.js file and insert storage API in it
//   browser.storage.local.get('parameterHolder',  (resp: {parameterHolder?: ParameterHolder}) => {
//     if (resp.parameterHolder) var tempParam: ParameterHolder = resp.parameterHolder
//     else {
//        tempParam = defaultParameterHolder
//     }
//     callback(tempParam)
//   })
// }
function getParameter(callback) {
    browser.storage.local.get('parameterHolder', (resp) => {
        if (resp.parameterHolder) {
            var tempParam = resp.parameterHolder;
        }
        else {
            var tempParam = defaultParameterHolder;
        }
        callback(tempParam);
    });
}
// Its setParameter function
asyncfunction;
setParameter(optionvalue, string);
Promise < void  > {
    try: {
        const: newoption = optionvalue !== null && optionvalue !== void 0 ? optionvalue : option,
        await: browser.storage.local.set({ parameterHolder: newoption })
    }, catch(error) {
        console.log('an error has occured');
    }
};
// Initfunctionality
function initFunctionnality(callback) {
    if (option.IPholder === undefined || option.IPholder.auto) {
        initListIP({
            error() {
                if (callback !== undefined)
                    callback();
            },
        });
    }
}
// Function that converts fro integer to ip
function int2ip(ipInt) {
    return ((ipInt >>> 24) +
        '.' +
        ((ipInt >> 16) & 255) +
        '.' +
        ((ipInt >> 8) & 255) +
        '.' +
        (ipInt & 255));
}
// function initListIP(callback: any) {
//   //console.log("initListIP");
//   try {
//     var once = true
//     //console.log("initListIP");
//     localIpList = []
//     var myPeerConnection =
//       window.RTCPeerConnection ||
//       window.RTCPeerConnection ||
//       window.RTCPeerConnection
//     var pc = new myPeerConnection({ iceServers: [] }),
//       noop = function () {},
//       ipRegex =
//         /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g
//     pc.createDataChannel('')
//     pc.createOffer()
//       .then(function (sdp) {
//         sdp.sdp.split('\n').forEach(function (line) {
//           //console.log("line");
//           //console.log(line);
//           if (line.indexOf('candidate') < 0) return
//           line.match(ipRegex).forEach(function (ip) {
//             addToList(ip)
//           })
//         })
//         pc.setLocalDescription(sdp, noop, noop)
//       })
//       .catch(function (reason) {})
//     pc.onicecandidate = function (ice) {
//       //console.log("ice");
//       //console.log(ice);
//       if (
//         ice &&
//         ice.candidate &&
//         ice.candidate.candidate &&
//         ice.candidate.candidate.indexOf('.local') != -1
//       ) {
//         if (callback != undefined && once) {
//           once = false
//           callback.error()
//         }
//         return
//       } else if (
//         !ice ||
//         !ice.candidate ||
//         !ice.candidate.candidate ||
//         !ice.candidate.candidate.match(ipRegex)
//       )
//         return
//       //console.log(ice.candidate.candidate);
//       ice.candidate.candidate.match(ipRegex).forEach(function (ip) {
//         if (ip.length < 16) addToList(ip)
//       })
//     }
//   } catch (e) {
//     //console.log("catch");
//     //console.log(callback);
//     if (callback != undefined) callback.warning()
//   }
// }
function initListIP(callback) {
    var _a;
    try {
        const myPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection;
        if (!myPeerConnection) {
            console.error('web error');
        }
        myPeerConnection.addEventListener();
        const pc = new myPeerConnection({ iceServers: [] });
        const noop = function () { };
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/g;
        pc.createDataChannel('');
        pc.createOffer()
            .then(function (sdp) {
            sdp.sdp.split('\n').forEach(function (line) {
                var _a;
                if (line.indexOf('candidate') < 0)
                    return;
                (_a = line.match(ipRegex)) === null || _a === void 0 ? void 0 : _a.forEach(function (ip) {
                    addToList(ip);
                });
            });
            pc.setLocalDescription(sdp, noop, noop);
            //since setLocalDescription alone is deprecated it is then
            //cut down into two parts and handled by a then catch:
            // pc.setLocalDescription(sdp).then(() => {
            //     console.log('local description set successfully')
        })
            .catch(() => {
            console.log('local desc encountered err');
        });
        pc.onicecandidate = (ice) => {
            var _a;
            if (ice &&
                ice.candidate &&
                ice.candidate.candidate.indexOf('.local') != -1) {
                if (callback.error) {
                    callback.error();
                }
                return;
            }
            else if (!ice ||
                !ice.candidate ||
                !ice.candidate.candidate ||
                !ice.candidate.candidate.match(ipRegex))
                return;
            (_a = ice.candidate.candidate.match(ipRegex)) === null || _a === void 0 ? void 0 : _a.forEach(function (ip) {
                if (ip.length < 16)
                    addToList(ip);
            });
        };
    }
    catch (e) {
        if (callback != undefined) {
            (_a = callback.warning) === null || _a === void 0 ? void 0 : _a.call(callback);
        }
    }
}
//function that adds the IP  to the list
function addToList(ip) {
    //console.log("addToList");
    var mask = getmaskFill(ip);
    if (localIpList.indexOf(ip2int(mask).toString()) === -1) {
        localIpList.push(ip2int(mask).toString());
    }
}
function ip2int(ip) {
    return (ip.split('.').reduce(function (ipInt, octet) {
        return (ipInt << 8) + parseInt(octet, 10);
    }, 0) >>> 0);
}
//another function to be converted from js to ts
//another function to be converted from js to ts
function getmask(url) {
    return url.substring(0, url.lastIndexOf('.'));
}
//another function to be converted from js to ts
function getmaskFill(url) {
    return getmask(url) + '.0';
}
export function initParameter(callback) {
    getParameter(function (resp) {
        option = resp;
        initFunctionnality(callback);
        callback();
    });
}
//function that would be better to be implemented from scratch
// function initParameterOption(callback, error) {
//   getParameter(function (resp) {
//     option = resp
//     initFunctionnality(error)
//     if (option.searchlogin) $('.ui.checkbox.searchlogin').checkbox('check')
//     else $('.row.searchlogin').hide()
//     if (option.searchcc) $('.ui.checkbox.searchcc').checkbox('check')
//     else $('.row.searchcc').hide()
//     if (option.searchcr) $('.ui.checkbox.searchcr').checkbox('check')
//     else $('.row.searchcr').hide()
//     if (option.dark) $('.ui.checkbox.DarkMode').checkbox('check')
//     document.getElementById('inputPort').value = option.port
//     if (option.force) $('.ui.checkbox.forcePort').checkbox('check')
//     if (option.log) $('.ui.checkbox.autlog').checkbox('check')
//     if (option.searchRegister)
//       $('.ui.checkbox.searchRegister').checkbox('check')
//     if (option.twoStep) $('.ui.checkbox.twoStep').checkbox('check')
//     if (option.fill) $('.ui.checkbox.fill').checkbox('check')
//     if (option.border) $('.ui.checkbox.border').checkbox('check')
//     if (option.fillcc) $('.ui.checkbox.fillcc').checkbox('check')
//     if (option.bordercc) $('.ui.checkbox.bordercc').checkbox('check')
//     if (option.uncheck) $('.ui.checkbox.uncheck').checkbox('check')
//     if (option.uncheckcc) $('.ui.checkbox.uncheckcc').checkbox('check')
//     if (option.IPholder == undefined || option.IPholder.auto) {
//       $('.ui.checkbox.forceIP').checkbox('check')
//       $('#ipform').hide()
//     }
//     if (option.IPholder == undefined) {
//       option.IPholder = defaultIPHolder
//       $('#ip_high').val(utils.int2ip(defaultIPHolder.high))
//       $('#ip_low').val(utils.int2ip(defaultIPHolder.low))
//     } else {
//       $('#ip_high').val(utils.int2ip(option.IPholder.high))
//       $('#ip_low').val(utils.int2ip(option.IPholder.low))
//     }
//     if (option.enableEviDNS) $('.ui.checkbox.enableEviDNS').checkbox('check')
//     isNativeSupported().then((res) => {
//       if (res) {
//         $('#inactiveEviDNS').hide()
//       } else {
//         $('#activeEviDNS').hide()
//       }
//     })
//     $('.ui.checkbox.searchlogin').checkbox({
//       onChecked: function () {
//         option.searchlogin = true
//         $('.row.searchlogin').show()
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.searchlogin = false
//         $('.row.searchlogin').hide()
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.searchcc').checkbox({
//       onChecked: function () {
//         option.searchcc = true
//         $('.row.searchcc').show()
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.searchcc = false
//         $('.row.searchcc').hide()
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.searchcr').checkbox({
//       onChecked: function () {
//         option.searchcr = true
//         $('.row.searchcr').show()
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.searchcr = false
//         $('.row.searchcr').hide()
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.DarkMode').checkbox({
//       onChecked: function () {
//         option.dark = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.dark = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.twoStep').checkbox({
//       onChecked: function () {
//         option.twoStep = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.twoStep = false
//         setParameter()
//       },
//     })
//     document
//       .getElementById('inputPort')
//       .addEventListener('input', function (evt) {
//         option.port = this.value
//         setParameter()
//       })
//     document.getElementById('resetPort').addEventListener('click', function () {
//       document.getElementById('inputPort').value = DefaultPort
//       option.port = DefaultPort
//       setParameter()
//       document.getElementById('iconResetPort').classList.add('loading')
//       setTimeout(function () {
//         document.getElementById('iconResetPort').classList.remove('loading')
//       }, 1000)
//     })
//     $('.ui.checkbox.forceIP').checkbox({
//       onChecked: function () {
//         initListIP({
//           error: function () {
//             if (callback != undefined) error()
//           },
//           warning: function () {},
//         })
//         option.IPholder.auto = true
//         $('#ipform').hide()
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.IPholder.auto = false
//         $('#ipform').show()
//         setParameter()
//       },
//     })
//     $.fn.form.settings.rules.ip_range = function (ip_high, ip_low) {
//       var element = $("input[name='" + ip_low + "']")
//       if (element && element.val()) {
//         var low = $.map(element.val().split('.'), function (value) {
//           const parsed = parseInt(value, 10)
//           if (isNaN(parsed)) {
//             return null
//           }
//           return parsed
//         })
//         var high = $.map(ip_high.split('.'), function (value) {
//           const parsed = parseInt(value, 10)
//           if (isNaN(parsed)) {
//             return null
//           }
//           return parsed
//         })
//         if (high.length != 4 || low.length != 4) return true
//         for (var i = 0; i < 4; i++) {
//           if (high[i] == null || low[i] == null) return true
//         }
//         if (low[0] != high[0]) return false
//         if (low[0] == 172 && low[1] != high[1]) return false
//         else if (low[0] == 192 && low[1] == 168 && low[2] != high[2])
//           return false
//         else if (low[3] == 0 || high[3] == 0 || low[3] == 255 || high[3] == 255)
//           return true
//         var temp = true
//         for (var i = 0; i < 4; i++) {
//           if (i != 0) temp = high[i] == low[i]
//           if (!temp && high[i] < low[i]) {
//             return false
//           }
//         }
//         return true
//       }
//       return false
//     }
//     $('#ipformMargin').form({
//       fields: {
//         ip_low: {
//           identifier: 'ip_low',
//           rules: [
//             {
//               type: 'empty',
//               prompt: ext.i18n.getMessage('emptyIP'),
//             },
//             {
//               type: 'regExp',
//               value: url,
//               prompt: ext.i18n.getMessage('regexIP'),
//             },
//           ],
//         },
//         ip_high: {
//           identifier: 'ip_high',
//           rules: [
//             {
//               type: 'empty',
//               prompt: ext.i18n.getMessage('emptyIP'),
//             },
//             {
//               type: 'regExp',
//               value: url,
//               prompt: ext.i18n.getMessage('regexIP'),
//             },
//             {
//               type: 'ip_range[ip_low]',
//               prompt: ext.i18n.getMessage('rangeIP'),
//             },
//           ],
//         },
//       },
//       onFailure: function (formErrors, fields) {
//         if (event != null) event.preventDefault()
//         resetOptionAreaHeight()
//         return false
//       },
//       onSuccess: function (event, fields) {
//         //console.log(fields);
//         if (event != null) event.preventDefault()
//         resetOptionAreaHeight()
//         var size =
//           utils.ip2int(fields.ip_high) - utils.ip2int(fields.ip_low) + 1
//         //console.log(size);
//         if (size > ipwarningSize) {
//           document.getElementById('ipRangeWarning_size').textContent = size
//           $('.ui.basic.modal.ipRangeWarning')
//             .modal({
//               closable: false,
//               onDeny: function () {},
//               onApprove: function () {
//                 option.IPholder.auto = false
//                 option.IPholder.high = utils.ip2int(fields.ip_high)
//                 option.IPholder.low = utils.ip2int(fields.ip_low)
//                 setParameter()
//               },
//             })
//             .modal('show')
//         } else {
//           option.IPholder.auto = false
//           option.IPholder.high = utils.ip2int(fields.ip_high)
//           option.IPholder.low = utils.ip2int(fields.ip_low)
//           setParameter()
//         }
//         return false
//       },
//     })
//     $('.ui.checkbox.forcePort').checkbox({
//       onChecked: function () {
//         option.force = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.force = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.enableEviDNS').checkbox({
//       onChecked: function () {
//         option.enableEviDNS = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.enableEviDNS = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.autlog').checkbox({
//       onChecked: function () {
//         option.log = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.log = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.border').checkbox({
//       onChecked: function () {
//         option.border = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.border = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.searchRegister').checkbox({
//       onChecked: function () {
//         option.searchRegister = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.searchRegister = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.fill').checkbox({
//       onChecked: function () {
//         option.fill = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.fill = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.fillcc').checkbox({
//       onChecked: function () {
//         option.fillcc = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.fillcc = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.bordercc').checkbox({
//       onChecked: function () {
//         option.bordercc = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.bordercc = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.uncheck').checkbox({
//       onChecked: function () {
//         option.uncheck = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.uncheck = false
//         setParameter()
//       },
//     })
//     $('.ui.checkbox.uncheckcc').checkbox({
//       onChecked: function () {
//         option.uncheckcc = true
//         setParameter()
//       },
//       onUnchecked: function () {
//         option.uncheckcc = false
//         setParameter()
//       },
//     })
//     callback()
//   })
// }
// Every connection maps to a background task
browser.runtime.onConnect.addListener(async (port) => {
    const taskMap = {
        [Task.Pair]: pair,
        [Task.Login]: login,
        [Task.Cloud]: cloud,
        [Task.Encrypt]: encrypt,
        [Task.EncryptFiles]: encryptFiles,
        [Task.Decrypt]: decrypt,
        [Task.DecryptFiles]: decryptFiles,
        [Task.IsZeroconfRunning]: isZeroconfRunning,
        [Task.ResetZeroconf]: resetZeroconf,
    };
    const task = taskMap[port.name];
    if (task === undefined)
        throw new Error(`Unexpected connection: ${port.name}.`);
    // Start the task with its own logger
    const log = debug(`task:${port.name}:background`);
    try {
        // Run the task until completion
        await startTask(task, port, log);
    }
    catch (error) {
        log('%o', error);
        // If an error is thrown, send it to the foreground
        port.postMessage({
            type: 'error',
            error: error instanceof ExtensionError
                ? error.message
                : ErrorMessage.UnknownError,
        });
    }
});
//# sourceMappingURL=main.js.map