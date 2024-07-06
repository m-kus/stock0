import { ethers } from 'ethers';
import React, { useEffect, useState } from 'react';
import Web3Modal from 'web3modal';
import { nftAddress, nftMarketAddress } from '../config';
import NFT from '../artifacts/contracts/NFT.sol/NFT.json';
import NFTMarket from '../artifacts/contracts/NFTMarket.sol/NFTMarket.json';
import axios from 'axios';

export default function MyAssets() {
	const [nfts, setNfts] = useState([]);
	const [loadingState, setLoadingState] = useState('not-loaded');

	useEffect(() => {
		loadNfts();
	}, []);

	const loadNfts = async () => {
		const web3Modal = new Web3Modal();
		const connection = await web3Modal.connect();
		const provider = new ethers.providers.Web3Provider(connection);
		const signer = provider.getSigner();

		const marketContract = new ethers.Contract(
			nftMarketAddress,
			NFTMarket.abi,
			signer
		);
		const nftContract = new ethers.Contract(nftAddress, NFT.abi, provider);
		const result = await marketContract.fetchMyNFTs();

		const myNfts = await Promise.all(
			result.map(async (item) => {
				const tokenURI = await nftContract.tokenURI(item.tokenId);
				const { data } = await axios.get(tokenURI);

				return {
					image: data.image,
					price: ethers.utils.formatUnits(item.price.toString(), 'ether'),
					name: data.name,
					description: data.description,
					tokenId: item.tokenId.toNumber(),
					itemId: item.itemId,
				};
			})
		);

		setNfts(myNfts);
		setLoadingState('loaded');
	};

	if (loadingState === 'loaded' && !nfts.length)
		return <h1 className='px-28 py-10 text-3xl'>No assets owned</h1>;

	return (
		<div className='flex justify-center'>
			<div className='max-w-[1600px]'>
				<div className='p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
					{nfts.map((nft) => (
						<div
							key={nft.itemId}
							className='rounded-lg border shadow overflow-hidden flex flex-col'
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
		</div>
	);
}
