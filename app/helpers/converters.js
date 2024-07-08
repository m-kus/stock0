import * as ethers from 'ethers';

export const base64ToUint8Array = (base64) => {
    // Decode Base64 to a binary string
    const binaryString = atob(base64);

    // Create a Uint8Array and populate it with the character codes from the binary string
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
};

export const convertPriceToWei = (price) => {
    try {
        const priceInWei = ethers.utils.parseUnits(price, 'ether');
        console.log(priceInWei.toString()); // Outputs the price in wei
        return priceInWei;
    } catch (error) {
        console.error(error);
    }
};