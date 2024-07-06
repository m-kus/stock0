import { pinataJWT } from '../config';

export async function pinJSONToIPFS(data) {
	try {
		const body = {
			pinataContent: data,
		};

		const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${pinataJWT}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify(body),
		});
		return await res.json();
	} catch (error) {
		console.log(error);
	}
}
