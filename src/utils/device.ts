import { Request } from 'express';
import requestIp from 'request-ip';
// @ts-ignore
import { UAParser } from 'ua-parser-js';

export interface DeviceInfo {
  deviceId: string | null;
  deviceName: string;
  deviceOs: string;
  ipAddress: string;
}

export function getDeviceId(req: Request): string | null {
  return (
    (req.headers['x-device-id'] as string) ||
    (req.headers['x-device-fingerprint'] as string) ||
    (req.body?.deviceId as string) ||
    null
  );
}

export function getIp(req: Request): string {
  return requestIp.getClientIp(req) || 'unknown';
}

export function getDeviceInfo(req: Request & { _deviceInfoCache?: DeviceInfo }): DeviceInfo {
  if (req._deviceInfoCache) return req._deviceInfoCache;

  const userAgent = (req.headers['user-agent'] as string) || '';
  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  let deviceName = req.headers['x-device-name'] as string | undefined;
  if (!deviceName) {
    if (result.device?.vendor && result.device?.model) {
      deviceName = `${result.device.vendor} ${result.device.model}`.trim();
    } else if (result.browser?.name) {
      deviceName = `${result.browser.name} ${result.browser.version || ''}`.trim();
    }
  }

  let deviceOs = req.headers['x-device-os'] as string | undefined;
  if (!deviceOs) {
    if (result.os?.name) {
      deviceOs = `${result.os.name} ${result.os.version || ''}`.trim();
    }
  }

  const info: DeviceInfo = {
    deviceId: getDeviceId(req),
    deviceName: deviceName || 'Inconnu',
    deviceOs: deviceOs || 'Inconnu',
    ipAddress: getIp(req),
  };

  req._deviceInfoCache = info;
  return info;
}
