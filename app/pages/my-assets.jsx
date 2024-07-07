import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import { marketContractAddress } from '../config';
import Market from '../artifacts/contracts/Market.sol/Market.json';
import { getUrlFromIpfsMultihash, getUrlFromIpfsCID } from '../helpers/getUrlFromIpfsHash';

function statusTitle(item) {
	if (item.status == 0) {
		return 'Listed';
	} else if (item.status == 1) {
		return 'In escrow';
	} else if (item.isBuyer) {
		return 'Purchased';
	} else {
		return 'Sold';
	}
}

function statusDescription(item) {
	if (item.status == 0) {
		return 'Anyone can purchase this item.';
	} else if (item.status == 1) {
		if (item.isBuyer) {
			return `Awaiting proof of publication from ${item.seller}...`;
		} else {
			return `Money are locked till the successful delivery.`;
		}
	} else if (item.isBuyer) {
		return `Item was bought from ${item.seller}.`;
	} else {
		return `Item was sold to ${item.buyer}.`
	}
}

export default function MyAssets() {
	const [items, setItems] = useState([]);
	const [loadingState, setLoadingState] = useState('not-loaded');

	useEffect(() => {
		loadItems();
	}, []);

	const loadItems = async () => {
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
		const result = await marketContract.fetchMyItems();

		const myItems = await Promise.all(
			result.map(async (i) => {
				return {
					itemId: i.itemId,
					price: ethers.utils.formatUnits(i.price.toString(), 'ether'),
					buyer: i.buyer,
					seller: i.seller,
					thumbnailUri: getUrlFromIpfsMultihash(i.thumbnailHash),
					manifestUri: getUrlFromIpfsCID(i.manifestCID),
					status: i.status,
					isBuyer: account == i.buyer,
				};
			})
		);

		console.log("ITEMS: ", items);

		setItems(myItems);
		setLoadingState('loaded')
	};

	const deliverItem = async (item) => {
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
			{ maxFeePerGas: 875000000 }
		);
		console.log("tx: ", marketTransaction);

		const marketTx = await marketTransaction.wait();
		console.log("res: ", marketTx);

		loadItems();
	};

	if (loadingState === 'loaded' && !items.length)
		return <h1 className='px-28 py-10 text-3xl'>No items related to your account</h1>;

	return (
		<div className='flex justify-center'>
			<div className='max-w-[1600px]'>
				<div className='p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
					{items.map((item) => (
						<div
							key={item.itemId}
							className='rounded-lg border shadow overflow-hidden flex flex-col'
						>
							<img src={item.thumbnailUri} className='w-full object-contain' />

							<div className='p-4 mt-auto'>
								<p className='h-8 text-2xl font-semibold'>{ statusTitle(item) }</p>
								<div className='h-[70px] overflow-hidden'>
									<p className='text-gray-400'>{ statusDescription(item) }</p>
								</div>
							</div>

							{(item.status == 1 && !item.isBuyer) && <button
								className='p-4 shadow-lg mt-8 font-bold bg-pink-100 text-white'
								onClick={() => deliverItem(item)}
							>
								Submit publication proof
							</button>}

							<div className='p-4 bg-black'>
								<p className='text-2xl mb-4 font-bold text-white'>
									{item.price} ETH
								</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
