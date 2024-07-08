# Marketplace app

## Run locally

Use node 18 to install deps
```
nvm use 18
npm i
```

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

Use node 16 to run (don't ask)
```
nvm use 16
npm run dev
```
