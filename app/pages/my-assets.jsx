import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import { marketContractAddress } from '../config';
import Market from '../artifacts/contracts/Market.sol/Market.json';
import { getUrlFromIpfsMultihash, getUrlFromIpfsCID } from '../helpers/getUrlFromIpfsHash';

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
		const signer = provider.getSigner();

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
					status: i.status
				};
			})
		);

		setItems(myItems);
		setLoadingState('loaded')
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

							{/* <div className='p-4 mt-auto'>
								<p className='h-8 text-2xl font-semibold'>{item.name}</p>
								<div className='h-[70px] overflow-hidden'>
									<p className='text-gray-400'>{item.description}</p>
								</div>
							</div> */}

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
