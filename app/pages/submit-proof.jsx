import * as ethers from 'ethers';
import { useRouter } from 'next/dist/client/router';
import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import Market from '../artifacts/contracts/Market.sol/Market.json';
import { marketContractAddress } from '../config';
import { decodeVerificationData } from '../helpers/verificationData';

export default function SubmitProof() {
	const [item, setItem] = useState([]);

	useEffect(() => {
		loadItem()
	}, []);

	const [formInput, setFormInput] = useState({
		publicKey: '',
		verificationData: '',
		publicationData: '',
	});

	const router = useRouter();

	const loadItem = async () => {
		const params = new URLSearchParams(window.location.search);
		let itemId = params.get("item");
		console.log("ITEM ID", itemId);

		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		
		let accounts = await provider.send("eth_requestAccounts", []);
		let account = accounts[0];
		console.log("Using account ", account);

		const signer = provider.getSigner(account);

		const marketContract = new ethers.Contract(
			marketContractAddress,
			Market.abi,
			signer
		);
		const result = await marketContract.fetchItem(itemId);
		const item = {
			itemId: result.itemId,
			buyer: result.buyer,
		};

		console.log("ITEM: ", item);

		setItem(item);
	}

	const finalizeItem = async () => {
		const { publicKey, verificationData, publicationData } = formInput;
		console.log("New item: ", publicKey, verificationData, publicationData);
		if (!publicKey || !verificationData || !publicationData) return;

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
		
		const marketTransaction = await marketContract.deliverMarketItem(
			item.itemId, 
			publicKey,
			...decodeVerificationData(verificationData),
			{ maxFeePerGas: 875000000 }
		);
		console.log("tx: ", marketTransaction);

		const marketTx = await marketTransaction.wait();
		console.log("res: ", marketTx);

		router.push('/');
	};

	return (
		<div className='flex justify-center'>
			<div className='flex-col w-1/2 flex pb-12'>
			
				<h1 className='pt-8 text-2xl'>Finalize the trade</h1>
				<label className='mt-4' style={{color: '#444'}}>Use public key of the buyer <code>{item.buyer}</code> for encryption.</label>
				<input
					className='mt-8 border rounded p-4'
					placeholder='Public key of the buyer'
					onChange={(e) =>
						setFormInput((prev) => ({ ...prev, publicKey: e.target.value }))
					}
				/>
				<textarea
					className='mt-8 border rounded p-4 code'
					placeholder='Verification data in JSON [provided by Aligned batcher]'
					onChange={(e) =>
						setFormInput((prev) => ({ ...prev, verificationData: e.target.value }))
					}
				/>
				<textarea
					className='mt-8 border rounded p-4 code'
					placeholder='Publication data in JSON [provided by BlobstreamX client]'
					onChange={(e) =>
						setFormInput((prev) => ({ ...prev, publicationData: e.target.value }))
					}
				/>

				<label className='mt-6' style={{color: '#999', fontSize: '12px'}}>
					Stock0 will use the known image hash, buyer's public key, and provided encrypted blob commitment to reconstruct the Risc0 journal
					of the envelope program. If Aligned manager comfirms that the according proof is valid AND there is a correct
					inclusion proof for this blob available via BlobstreamX, we can be sure that the buyer is able to download and decrypt the image.
				</label>

				<button
					className='rounded p-4 shadow-lg mt-8 font-bold bg-pink-500 text-white'
					onClick={finalizeItem}
					disabled={
						!formInput.verificationData ||
						!formInput.publicationData ||
						!formInput.publicKey
					}
				>
					Deliver image
				</button>
			</div>
		</div>
	);
}
