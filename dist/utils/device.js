"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDeviceId = getDeviceId;
exports.getIp = getIp;
exports.getDeviceInfo = getDeviceInfo;
const request_ip_1 = __importDefault(require("request-ip"));
// @ts-ignore
const ua_parser_js_1 = require("ua-parser-js");
function getDeviceId(req) {
    return (req.headers['x-device-id'] ||
        req.headers['x-device-fingerprint'] ||
        req.body?.deviceId ||
        null);
}
function getIp(req) {
    return request_ip_1.default.getClientIp(req) || 'unknown';
}
function getDeviceInfo(req) {
    if (req._deviceInfoCache)
        return req._deviceInfoCache;
    const userAgent = req.headers['user-agent'] || '';
    const parser = new ua_parser_js_1.UAParser(userAgent);
    const result = parser.getResult();
    let deviceName = req.headers['x-device-name'];
    if (!deviceName) {
        if (result.device?.vendor && result.device?.model) {
            deviceName = `${result.device.vendor} ${result.device.model}`.trim();
        }
        else if (result.browser?.name) {
            deviceName = `${result.browser.name} ${result.browser.version || ''}`.trim();
        }
    }
    let deviceOs = req.headers['x-device-os'];
    if (!deviceOs) {
        if (result.os?.name) {
            deviceOs = `${result.os.name} ${result.os.version || ''}`.trim();
        }
    }
    const info = {
        deviceId: getDeviceId(req),
        deviceName: deviceName || 'Inconnu',
        deviceOs: deviceOs || 'Inconnu',
        ipAddress: getIp(req),
    };
    req._deviceInfoCache = info;
    return info;
}
