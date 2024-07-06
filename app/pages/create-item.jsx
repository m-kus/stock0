import * as ethers from 'ethers';
import { useRouter } from 'next/dist/client/router';
import React, { useState } from 'react';
import Web3Modal from 'web3modal';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import { ipfsGateway, nftAddress, nftMarketAddress } from '../config';
import { pinFileToIPFS } from '../helpers/pinFileToIpfs';
import { pinJSONToIPFS } from '../helpers/pinJsonToIpfs';
import { getUrlFromIpfsHash } from '../helpers/getUrlFromIpfsHash';

export default function CreateItem() {
	const [file, setFile] = useState(null);
	const [formInput, setFormInput] = useState({
		name: '',
		price: '',
		description: '',
	});
	const router = useRouter();

	const onChange = async (e) => {
		try {
			const file = e.target.files[0];
			const addedFile = await pinFileToIPFS(file);
			console.log('addedFile', addedFile);
			console.log('first', `${ipfsGateway}${addedFile.IpfsHash}`);
			setFile(`${ipfsGateway}${addedFile.IpfsHash}`);
		} catch (error) {
			console.log('error', error);
		}
	};

	const createItem = async () => {
		const { name, price, description } = formInput;
		console.log(
			'!name || !price || !description || !file',
			!name || !price || !description || !file
		);
		if (!name || !price || !description || !file) return;

		try {
			const added = await pinJSONToIPFS({ name, description, image: file });
			const url = getUrlFromIpfsHash(added.IpfsHash);
			await createSale(url);
		} catch (error) {
			console.log('error', error);
		}
	};

	const createSale = async (url) => {
		const modal = new Web3Modal();
		const connection = await modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const nftContract = new ethers.Contract(nftAddress, NFT.abi, signer);
		const transaction = await nftContract.createToken(url);
		const tx = await transaction.wait();

		const event = tx.events[0];
		const tokenId = event.args[2];

		const nftMarketContract = new ethers.Contract(
			nftMarketAddress,
			NFTMarket.abi,
			signer
		);
		const listingPrice = (await nftMarketContract.getListingPrice()).toString();
		const marketTransaction = await nftMarketContract.createMarketItem(
			nftAddress,
			tokenId,
			formInput.price,
			{ value: listingPrice }
		);
		const marketTx = await marketTransaction.wait();
		router.push('/');
	};

	return (
		<div className='flex justify-center'>
			<div className='flex-col w-1/2 flex pb-12'>
				<input
					className='mt-8 border rounded p-4'
					placeholder='Asset Name'
					onChange={(e) =>
						setFormInput((prev) => ({ ...prev, name: e.target.value }))
					}
				/>
				<textarea
					className='mt-8 border rounded p-4'
					placeholder='Asset Description'
					onChange={(e) =>
						setFormInput((prev) => ({ ...prev, description: e.target.value }))
					}
				/>
				<input
					className='mt-8 border rounded p-4'
					placeholder='Asset Price in Matic'
					onChange={(e) =>
						setFormInput((prev) => ({ ...prev, price: e.target.value }))
					}
				/>
				<input type='file' name='Asset' className='my-4' onChange={onChange} />

				{file && <img src={file} className='rounded mt-4 w-[350px]' />}

				<button
					className='rounded p-4 shadow-lg mt-4 font-bold bg-pink-500 text-white'
					onClick={createItem}
					disabled={
						!formInput.name ||
						!formInput.price ||
						!formInput.description ||
						!file
					}
				>
					Create digital asset
				</button>
			</div>
		</div>
	);
}
