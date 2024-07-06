import '../styles/globals.css';
import Link from 'next/link';

function MyApp({ Component, pageProps }) {
	return (
		<div className=''>
			<nav className='p-6 border-b'>
				<h1 className='text-4xl font-bold'>Stock Zero</h1>
				<div className='flex mt-4'>
					<Link href='/'>
						<a className='mr-6 text-pink-500'>Home</a>
					</Link>
					<Link href='/create-item'>
						<a className='mr-6 text-pink-500'>Sell Digital Asset</a>
					</Link>
					<Link href='/my-assets'>
						<a className='mr-6 text-pink-500'>My Digital Asset</a>
					</Link>
					<Link href='/creator-dashboard'>
						<a className='mr-6 text-pink-500'>Creator Dashboard</a>
					</Link>
				</div>
			</nav>
			<Component {...pageProps} />
		</div>
	);
}

export default MyApp;
