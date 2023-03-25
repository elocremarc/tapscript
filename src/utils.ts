import fs from 'fs';
import { getBitcoinPrice } from './externalDataCalls';

export async function processFile(filePath: string): Promise<string> {
  const fileContent = await fs.promises.readFile(filePath);

  if (fileContent.length > 120000) {
    throw new Error('File size exceeds 120kb limit');
  }

  const b64 = (await encodeBase64(fileContent)) as string;
  if (!b64) {
    throw new Error('Failed to encode file content');
  }

  const base64 = b64.substring(b64.indexOf('base64,') + 7);
  const hex = base64ToHex(base64);

  return hex;
}

export function encodeBase64(file) {
  return new Promise(function (resolve, reject) {
    //the next three lines handle the case where an image is passed in from an external site
    if ('files' in file) {
      file = file.files[0];
    }
    var mimetype = file.type;
    if (mimetype.includes('text/plain')) {
      mimetype += ';charset=utf-8';
    }
    var imgReader = new FileReader();
    imgReader.onloadend = function () {
      resolve(imgReader.result.toString());
    };
    imgReader.readAsDataURL(file);
  });
}
export function base64ToHex(str) {
  const raw = atob(str);
  let result = '';
  for (let i = 0; i < raw.length; i++) {
    const hex = raw.charCodeAt(i).toString(16);
    result += hex.length === 2 ? hex : '0' + hex;
  }
  return result.toLowerCase();
}
export function hexToBytes(hex) {
  return Uint8Array.from(
    hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16))
  );
}
export function bytesToHex(bytes) {
  return bytes.reduce(
    (str, byte) => str + byte.toString(16).padStart(2, '0'),
    ''
  );
}
export function textToHex(text) {
  var encoder = new TextEncoder().encode(text);
  return [...new Uint8Array(encoder)]
    .map((x) => x.toString(16).padStart(2, '0'))
    .join('');
}
export function getData(url) {
  return new Promise(async function (resolve, reject) {
    function inner_get(url) {
      var xhttp = new XMLHttpRequest();
      xhttp.open('GET', url, true);
      xhttp.send();
      return xhttp;
    }
    var data = inner_get(url);
    data.onerror = function (e) {
      resolve('error');
    };
    async function isResponseReady() {
      return new Promise(function (resolve2, reject) {
        if (!data.responseText || data.readyState != 4) {
          setTimeout(async function () {
            var msg = await isResponseReady();
            resolve2(msg);
          }, 1);
        } else {
          resolve2(data.responseText);
        }
      });
    }
    var returnable = await isResponseReady();
    resolve(returnable);
  });
}

export async function postData(url, json, content_type = '', apikey = '') {
  var rtext = '';
  function inner_post(url, json, content_type = '', apikey = '') {
    var xhttp = new XMLHttpRequest();
    xhttp.open('POST', url, true);
    if (content_type) {
      xhttp.setRequestHeader(`Content-Type`, content_type);
    }
    if (apikey) {
      xhttp.setRequestHeader(`X-Api-Key`, apikey);
    }
    xhttp.send(json);
    return xhttp;
  }
  var data = inner_post(url, json, content_type, apikey);
  data.onerror = function (e) {
    rtext = 'error';
  };
  async function isResponseReady() {
    return new Promise(function (resolve, reject) {
      if (rtext == 'error') {
        resolve(rtext);
      }
      if (!data.responseText || data.readyState != 4) {
        setTimeout(async function () {
          var msg = await isResponseReady();
          resolve(msg);
        }, 50);
      } else {
        resolve(data.responseText);
      }
    });
  }
  var returnable = await isResponseReady();
  return returnable;
}

export function satsToBitcoin(sats) {
  if (sats >= 100000000) sats = sats * 10;
  var string =
    String(sats).padStart(8, '0').slice(0, -9) +
    '.' +
    String(sats).padStart(8, '0').slice(-9);
  if (string.substring(0, 1) == '.') string = '0' + string;
  return string;
}

export async function satsToDollars(sats) {
  if (sats >= 100000000) sats = sats * 10;
  var bitcoin_price = await getBitcoinPrice();
  var value_in_dollars =
    Number(
      String(sats).padStart(8, '0').slice(0, -9) +
        '.' +
        String(sats).padStart(8, '0').slice(-9)
    ) * bitcoin_price;
  return value_in_dollars;
}
