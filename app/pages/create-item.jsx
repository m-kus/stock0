import * as ethers from 'ethers';
import { useRouter } from 'next/dist/client/router';
import React, { useState } from 'react';
import Web3Modal from 'web3modal';
import Market from '../artifacts/contracts/Market.sol/Market.json';
import { marketContractAddress } from '../config';
import { pinFileToIPFS } from '../helpers/pinFileToIpfs';
import { pinJSONToIPFS } from '../helpers/pinJsonToIpfs';
import { getUrlFromIpfsCID } from '../helpers/getUrlFromIpfsHash';
import { CID } from 'multiformats/cid'
import { base64ToUint8Array, convertPriceToWei } from '../helpers/converters';

export default function CreateItem() {
	const [file, setFile] = useState(null);
	const [manifestFile, setManifestFile] = useState(null);
	const [formInput, setFormInput] = useState({
		price: '',
	});
	const router = useRouter();

	const onChange = async (e) => {
		try {
			const thumbnail = e.target.files[0];
			const thumbnailFile = await pinFileToIPFS(thumbnail);
			console.log('thumbnail file on IPFS: ', thumbnailFile);
			// TODO: extract SHA256 hash from multihash
			setFile(thumbnailFile.IpfsHash);
		} catch (error) {
			console.log('error', error);
		}
	};

	const onChangeManifest = async (e) => {
		try {
			const manifest = e.target.files[0];
			const manifestLink = await pinFileToIPFS(manifest);
			console.log('Manifest file on IPFS: ', manifestLink);
			// TODO: extract SHA256 hash from multihash
			setManifestFile(manifestLink.IpfsHash);
		} catch (error) {
			console.log('error', error);
		}
	};

	const createItem = async () => {
		const { price } = formInput;
		console.log("New item: ", price, manifestFile, file);
		if (!price || !manifestFile || !file) return;

		try {
			const manifestHashBytes = CID.parse(manifestFile).bytes;
			const thumbnailHashBytes = CID.parse(file).multihash.digest;
			const imageHashBytes = CID.parse(file).bytes;
			const priceInWei = convertPriceToWei(price);
			console.log("Image ", CID.parse(file).multihash);

			await createNewItem(manifestHashBytes, thumbnailHashBytes, imageHashBytes, priceInWei);
		} catch (error) {
			console.log('error', error);
		}
	};

	const createNewItem = async (manifestIpfsHash, thumbnailHash, imageHash, priceInWei) => {
		const modal = new Web3Modal();
		const connection = await modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);

		let accounts = await provider.send("eth_requestAccounts", []);
		let account = accounts[0];
		console.log("Using account ", account);

		const signer = provider.getSigner(account);
		console.log("Signer ", signer);

		const marketContract = new ethers.Contract(
			marketContractAddress,
			Market.abi,
			signer
		);

		const marketTransaction = await marketContract.createMarketItem(
			imageHash,
			thumbnailHash,
			manifestIpfsHash,
			priceInWei,
			{ maxFeePerGas: 875000000 }
		);
		console.log("create new item tx: ", marketTransaction);

		const marketTx = await marketTransaction.wait();
		console.log("create new item res: ", marketTx);

		router.push('/');
	};

	return (
		<div className='flex justify-center'>
			<div className='flex-col w-1/2 flex pb-12'>
				<h1 className='pt-8 text-2xl'>Create new item for sale</h1>
				<input
					className='mt-8 border rounded p-4'
					placeholder='Price in ETH'
					onChange={(e) =>
						setFormInput((prev) => ({ ...prev, price: e.target.value }))
					}
					onChangeManifest={(e) =>
						setFormInput((prev) => ({ ...prev, price: e.target.value }))
					}
				/>

				<textarea
					className='mt-8 border rounded p-4 code'
					placeholder='Verification data in JSON [provided by Aligned batcher]'
				// onChange={(e) =>
				// 	setFormInput((prev) => ({ ...prev, manifest: e.target.value }))
				// }
				/>

				<div className="border mt-8 p-4 rounded flex flex-col">
					<label style={{ color: '#999' }}>C2PA Manifest file [produced by c2patool]</label>
					<input type='file' name='Thumbnail' className='my-4' onChange={onChangeManifest} />
					{file}
				</div>

				<div className="border mt-8 p-4 rounded flex flex-col">
					<label style={{ color: '#999' }}>Thumbnail file in PNG format [produced by Risc0 program]</label>
					<input type='file' name='Thumbnail' className='my-4' onChange={onChange} />
					{file && <img src={getUrlFromIpfsCID(file)} className='rounded py-2' style={{ width: "75px" }} />}
				</div>

				<label className='mt-4' style={{ color: '#999', fontSize: '12px' }}>
					Stock0 will extract original image size from C2PA manifest and calculate thumbnail hash given the provided file:
					combined they must match the Risc0 journal (public output), so if the Aligned manager contract accepts
					the verification data then we will know that this thumbnail was <b>actually derived</b> from the original image.
				</label>

				<button
					className='rounded p-4 shadow-lg mt-8 font-bold bg-pink-500 text-white'
					onClick={createItem}
					disabled={
						!formInput.price ||
						!manifestFile ||
						!file
					}
				>
					Create image offer
				</button>
			</div>
		</div>
	);
}
