import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import { ethers } from 'ethers';
import { nftAddress, nftMarketAddress } from '../config';
import axios from 'axios';

export default function CreatorDashboard() {
	const [nfts, setNfts] = useState([]);
	const [soldNfts, setSoldNfts] = useState([]);
	const [loadingState, setLoadingState] = useState('not-loaded');

	useEffect(() => {
		fetchNfts();
	}, []);

	const fetchNfts = async () => {
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const marketContract = new ethers.Contract(
			nftMarketAddress,
			NFTMarket.abi,
			signer
		);
		const nftContract = new ethers.Contract(nftAddress, NFT.abi, signer);

		const data = await marketContract.fetchItemsCreated();

		const items = await Promise.all(
			data.map(async (item) => {
				const tokenUri = await nftContract.tokenURI(item.tokenId);
				const { data: meta } = await axios.get(tokenUri);

				return {
					image: meta.image,
					price: ethers.utils.formatUnits(item.price.toString(), 'ether'),
					name: meta.name,
					description: meta.description,
					tokenId: item.tokenId.toNumber(),
					seller: item.seller,
					owner: item.owner,
					sold: item.sold,
					itemId: item.itemId,
				};
			})
		);

		const soldNfts = items.filter((item) => item.sold);

		setNfts(items);
		setSoldNfts(soldNfts);
		setLoadingState('loaded');
	};

	return (
		<div className='flex justify-center'>
			<div className='p-4 max-w-[1600px]'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
					{nfts.map((nft) => (
						<div
							key={nft.itemId}
							className='border rounded-lg shadow overflow-hidden flex flex-col'
						>
							<img src={nft.image} className='w-full object-contain' />

							<div className='p-4 mt-auto'>
								<p className='h-8 text-2xl font-semibold'>{nft.name}</p>
								<div className='h-[70px] overflow-hidden'>
									<p className='text-gray-400'>{nft.description}</p>
								</div>
							</div>

							<div className='p-4 bg-black'>
								<p className='text-2xl mb-4 font-bold text-white'>
									{nft.price} Matic
								</p>
							</div>
						</div>
					))}
				</div>

				{Boolean(soldNfts.length) && (
					<div className='mt-10'>
						<h2 className='text-4xl py-2 font-bold'>Items sold</h2>
						<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
							{soldNfts.map((nft) => (
								<div
									key={nft.itemId}
									className='border rounded-lg shadow overflow-hidden flex flex-col'
								>
									<img src={nft.image} className='w-full object-contain' />

									<div className='p-4 mt-auto'>
										<p className='h-8 text-2xl font-semibold'>{nft.name}</p>
										<div className='h-[70px] overflow-hidden'>
											<p className='text-gray-400'>{nft.description}</p>
										</div>
									</div>

									<div className='p-4 bg-black'>
										<p className='text-2xl mb-4 font-bold text-white'>
											{nft.price} Matic
										</p>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
