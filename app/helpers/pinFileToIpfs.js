import { pinataJWT } from '../config';

export async function pinFileToIPFS(file) {
	try {
		const formData = new FormData();
		formData.append('file', file);

		const pinataMetadata = JSON.stringify({
			name: 'File name',
		});
		formData.append('pinataMetadata', pinataMetadata);

		const pinataOptions = JSON.stringify({
			cidVersion: 0,
		});
		formData.append('pinataOptions', pinataOptions);

		const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${pinataJWT}`,
			},
			body: formData,
		});
		return await res.json();
	} catch (error) {
		console.log(error);
	}
}
