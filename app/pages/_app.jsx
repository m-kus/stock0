import '../styles/globals.css';
import Link from 'next/link';

function MyApp({ Component, pageProps }) {
	return (
		<div className=''>
			<nav className='p-6 border-b'>
				<h1 className='text-4xl font-bold'>Stock Zero: trust minimized content market</h1>
				<div className='flex mt-4'>
					<Link href='/'>
						<a className='mr-6 text-pink-500'>Explore</a>
					</Link>
					<Link href='/create-item'>
						<a className='mr-6 text-pink-500'>Create</a>
					</Link>
					<Link href='/my-assets'>
						<a className='mr-6 text-pink-500'>My items</a>
					</Link>
				</div>
			</nav>
			<Component {...pageProps} />
		</div>
	);
}

export default MyApp;
