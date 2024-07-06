import { ipfsGateway } from '../config'

export const getUrlFromIpfsHash = (hash) => {
  return `${ipfsGateway}${hash}`
}