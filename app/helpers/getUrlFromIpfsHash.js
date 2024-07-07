import { bytes } from 'multiformats'
import { ipfsGateway } from '../config'
import { CID } from 'multiformats/cid'

export const getUrlFromIpfsCID = (cid) => {
  return `${ipfsGateway}/ipfs/${cid}`
}

export const getUrlFromIpfsMultihash = (hash) => {
  const digest = {
    code: 18,
    digest: decodeHexStringToByteArray(hash.slice(6)),
    size: 32,
    bytes: decodeHexStringToByteArray(hash.slice(2))
  }
  console.log("DIGEST ", digest)

  return getUrlFromIpfsCID(CID.createV0(digest))
}

var decodeHexStringToByteArray = function (hexString) {
  var result = [];
  while (hexString.length >= 2) { 
      result.push(parseInt(hexString.substring(0, 2), 16));
      hexString = hexString.substring(2, hexString.length);
  }
  return new Uint8Array(result);
}
