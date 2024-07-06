require('@nomiclabs/hardhat-waffle');
require('dotenv').config();

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
	solidity: '0.8.19',
	networks: {
		hardhat: {
			chainId: 17000,
		},
		holesky: {
			url: 'https://eth-holesky.g.alchemy.com/v2/LvICyiq5PpiU6pmBNWJCHWjzjH4ObPob',
			accounts: [process.env.HOLESKY_PRIVATE_KEY],
		}
	},
};
