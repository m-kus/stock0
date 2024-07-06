# Stock Zero

Trust-minimized marketplace for content creators.

## Settings things up

### Risc0 toolchain

https://dev.risczero.com/api/zkvm/install 

### C2PA utilities

https://github.com/contentauth/c2patool?tab=readme-ov-file#building-from-source

### Aligned batcher CLI

https://docs.alignedlayer.com/introduction/1_getting_started

### Foundry

https://book.getfoundry.sh/getting-started/installation

# Materials
## Market

Create C2PA manifest with CLI
https://github.com/contentauth/c2patool

Verify content creds
https://contentcredentials.org/verify?source=https%3A%2F%2Ffotoforensics.com%2Fanalysis.php%3Fid%3D25f9c5d79cf5716ac3aa9d609e9c04df7c87d78c.1893172%26fmt%3Dorig%26search%3DContentCredentials

Rust SDK
https://github.com/contentauth/c2pa-rs

### Create image processing proof w/ RISC0

It is likely that P256 curve is used for C2PA signing
https://c2pa.org/specifications/specifications/1.4/specs/C2PA_Specification.html#_signature_algorithms
https://github.com/nlok5923/attestation-rollup/blob/main/prover/methods/guest/src/bin/ecdsa_verify.rs

Faster impl using bigint precompile
https://github.com/automata-network/RustCrypto-elliptic-curves/pull/1

But actually we don't have to prove this, can be done on the client side? The important thing is that the claim is about the same hash that is used to derive a thumbnail.

Claims are in the image file header (actual location depends on the file format)
https://c2pa.org/specifications/specifications/1.4/specs/C2PA_Specification.html#_examples_of_claims

We need to downscale and add watermark
https://github.com/nlok5923/attestation-rollup/blob/main/prover/methods/guest/src/bin/flip_image.rs

What is the optimal image size so that we can generate proof on M3 within minutes?

### Submit proof to Aligned using rust SDK

Guide
https://docs.alignedlayer.com/guides/0_submitting_proofs

SDK method
https://github.com/yetanotherco/aligned_layer/blob/f434d29454a9e8ef08b0c5c5ad18ef627b923a05/batcher/aligned-sdk/src/sdk.rs#L143

What is batcher address?
What is the wallet? Is it in Ethereum testnet?

Which fields need to be specified?
https://github.com/yetanotherco/aligned_layer/blob/f434d29454a9e8ef08b0c5c5ad18ef627b923a05/batcher/aligned-batcher/src/zk_utils/mod.rs#L46

Probably only proof and program
https://github.com/yetanotherco/aligned_layer/blob/f434d29454a9e8ef08b0c5c5ad18ef627b923a05/batcher/aligned/send_infinite_sp1_tasks/send_infinite_sp1_tasks.sh#L23

Oh actually proof is receipt (seal + public output)
https://github.com/yetanotherco/aligned_layer/blob/3c63ddc09dff6f3006e279d3bc6dcdfe8e737b37/batcher/aligned-batcher/src/risc_zero/mod.rs#L4C49-L4C56

### Consume proof verification fact onchain

Contracts are in public testnet
https://docs.alignedlayer.com/architecture/3_smart_contracts

Looks like it
https://github.com/yetanotherco/aligned_layer/blob/main/examples/zkquiz/contracts/src/VerifierContract.sol

### Interact with blobstream onchain

### Submit blob to Celestia

## C2PA

Public samples
https://c2pa.org/public-testfiles/image/
https://opensource.contentauthenticity.org/docs/manifest/manifest-examples

How to calculate a hash?
https://github.com/contentauth/c2pa-rs/blob/main/sdk/src/assertions/data_hash.rs

## Slides

https://docs.google.com/presentation/d/1qq1QXSBcThOjaQ2OcEyS8cwNyAHs3SnC76YrBMAYENk/edit?usp=sharing



