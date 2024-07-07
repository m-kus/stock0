import * as ethers from 'ethers';
import Web3Model from 'web3modal';
import Market from '../artifacts/contracts/Market.sol/Market.json';
import { marketContractAddress } from '../config';
import { useEffect, useState } from 'react';
import { getUrlFromIpfsMultihash, getUrlFromIpfsCID } from '../helpers/getUrlFromIpfsHash';

export default function Home() {
	const [items, setItems] = useState([]);
	const [loadingState, setLoadingState] = useState('not-loading');

	useEffect(() => {
		loadItems();
	}, []);

	const loadItems = async () => {
		const provider = new ethers.providers.JsonRpcProvider({
			url: process.env.NEXT_PUBLIC_RPC_URL,
		});
		const marketContract = new ethers.Contract(
			marketContractAddress,
			Market.abi,
			provider
		);

		const data = await marketContract.fetchAvailableItems();

		// TODO: convert thumbnail hash to multihash

		const availableItems = await Promise.all(
			data.map(async (i) => {
				return {
					itemId: i.itemId,
					price: ethers.utils.formatUnits(i.price.toString(), 'ether'),
					seller: i.seller,
					thumbnailUri: getUrlFromIpfsMultihash(i.thumbnailHash),
					manifestUri: getUrlFromIpfsCID(i.manifestCID),
				}
			})
		);
		setItems(availableItems);
		setLoadingState('loaded');
	};

	const purchaseItem = async (item) => {
		const web3Model = new Web3Model();
		const connection = await web3Model.connect();
		const provider = new ethers.providers.Web3Provider(connection);

		const signer = provider.getSigner();
		const market = new ethers.Contract(marketContractAddress, Market.abi, signer);

		const price = ethers.utils.parseUnits(item.price.toString(), 'ether');
		const transaction = await market.purchaseItem(
			item.itemId,
			{ value: price }
		);
		await transaction.wait();
		loadItems();
	};

	if (loadingState === 'loaded' && !items.length)
		return <h1 className='px-28 py-10 text-3xl'>No items available for sale</h1>;

	return (
		<div className='flex justify-center'>
			<div className='p-4 max-w-[1600px]'>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
					{items.map((item) => (
						<div
							key={item.itemId}
							className='border rounded-lg shadow overflow-hidden flex flex-col'
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
								<button
									className='w-full bg-pink-500 text-white font-bold py-2 px-12 rounded'
									onClick={() => purchaseItem(item)}
								>
									Purchase item
								</button>
							</div>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
