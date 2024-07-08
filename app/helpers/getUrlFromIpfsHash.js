import { bytes } from 'multiformats'
import { ipfsGateway } from '../config'
import { CID } from 'multiformats/cid'

export const getUrlFromIpfsCID = (cid) => {
  return `${ipfsGateway}/ipfs/${cid}`
}

export const getUrlFromIpfsMultihash = (hash) => {
  const digest = decodeHexStringToByteArray(hash.slice(2));
  const code = 18;
  const size = 32;

  var bytes = new Uint8Array(34);
  bytes.set([code, size]);
  bytes.set(digest, 2);

  const res = {
    code,
    digest,
    size,
    bytes
  };
  console.log("DIGEST ", res);

  return getUrlFromIpfsCID(CID.createV0(res))
}

var decodeHexStringToByteArray = function (hexString) {
  var result = [];
  while (hexString.length >= 2) { 
      result.push(parseInt(hexString.substring(0, 2), 16));
      hexString = hexString.substring(2, hexString.length);
  }
  return new Uint8Array(result);
}
