// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require('hardhat');

async function main() {
	// Hardhat always runs the compile task when running scripts with its command
	// line interface.
	//
	// If this script is run directly using `node` you may want to call compile
	// manually to make sure everything is compiled
	// await hre.run('compile');

	// const Aligned = await hre.ethers.getContractFactory('AlignedManagerMock');
	// const aligned = await Aligned.deploy();
	// await aligned.deployed();

	// console.log('Aligned manager mock deployed to: ', aligned.address);

	// We get the contract to deploy
	const Market = await hre.ethers.getContractFactory('Market');
	console.log("Market factory ", Market);

	// TODO: thumbnail and envelope program (image) IDs
	const market = await Market.deploy(
		'0x0000000000000000000000000000000000000000000000000000000000000000',
		'0x0000000000000000000000000000000000000000000000000000000000000000'
		// ,aligned.address
	);
	await market.deployed();

	console.log('Market deployed to: ', market.address);

	const items = await market.fetchAvailableItems();
	console.log("Items: ", items);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
