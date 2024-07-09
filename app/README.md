# Marketplace app

## Run locally

Use node 18 to install deps
```
nvm use 18
npm i
```

Create `.env` file using `.env.sample` as a reference.  
You will need a Pinata account and node RPC / private key with some balance for deploying in a public network.

Compile contracts
```
npx hardhat compile
```

Run local node
```
npx hardhat node
```

Deploy contracts
```
npx hardhat run scripts/deploy.js --network localhost
```

Update contract address in your .env file if necessary.

Use node 16 to run (don't ask why)
```
nvm use 16
npm run dev
```
