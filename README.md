# Stock Zero

Trust-minimized marketplace for content creators.

This is a PoC developed during the [Lambda Hack '24](https://dorahacks.io/hackathon/lambdahackweek2).  
It utilizes cryptographic techniques to remove trust from transactional relations between content creators and acquirers.

### Fake content and C2PA standard

Fake content is a huge problem which is already pretty severe but it's nothing compared to what expects us in the future. Luckily, there are initiatives like [Coalition for Content Provenance and Authenticity](https://c2pa.org/) (C2PA) that provide tooling to navigate through the AI-generated content, fakes, forgeries, and enforce integrity.

In a nutshell, now every piece of media has a special manifest with a set of claims about that piece plus a chain of certificates attesting these claims. It can be something simple as data hash or more involved info like 3D depth or geo-location in the moment of taking the shot. Ultimately if you trust the root authority and the hardware/software that creates attestations you can be sure that the piece of media is untampered and possesses certain properties.

### Proof of content transformation

Signed content is great, but what if we want to make some modifications? Well C2PA standard allows to issue additional claims for every subsequent change (e.g. made by Adobe Photoshop) assuming that the licensed software would attest them. However, this is not really a reliable approach, and we can do better!

Here ZKPs enter the game and offer provable content transformation, i.e. you can think of it as another type of claim where the attestation is not a certificate but a zero-knowledge proof. This is pretty powerful mechanism because not only it allows to preserve the chain of modifications, but it is not possible to hide certain intermediate states without losing the ability to prove claims about the original.

### Proof of exclusive publication

Unrelated but important technique that will be very handy for our purposes is a verifiable non-interactive way to deliver content to the buyer. It combines envelope encryption, ZKPs, and data availability solutions to make sure that pre-committed data made available for downloading without revealing it to the wide public.

## Photo marketplace as a real use case

To narrow down the scope and to demonstrate the possibilites of the tech we decided to take a real world scenario where all parties would benefit greatly from removing the need of trust.  

Here is the case: fashion photographers do shootings and then sell them to magazines. It is pretty common case when magazines do not pay or abuse photographers in other way. Although there is a risk of fraud from both parties, overall the situation is quite assymetrical.  

Let's outline the risks and how we can reduce them with the forementioned techniques:
- The pictures are generated using AI or stolen: here is where C2PA comes handy
- Let's say the certificates are fine, but the previews (watermarked) provided to the magazine do not match the original: provable transformation solves this
- Finally, if magazine pays first there is a chance that photographer won't send the originals (similarly if the magazine pays afterwards it can choose not to pay at all): here we need a decentralized escrow (smart contract) + proof of exclusive publication to claim the funds

## Implementation details

![Flow chart](./assets/flow.png)

### Create new item



### Purchase item

### Deliver item

## Step-by-step guide

### Installation

Risc0 toolchain
https://dev.risczero.com/api/zkvm/install 

C2PA utilities
https://github.com/contentauth/c2patool?tab=readme-ov-file#building-from-source

Aligned batcher CLI
https://docs.alignedlayer.com/introduction/1_getting_started

### Usage

#### Create external C2PA manifest

#### Generate thumbnail

#### Submit proof to Aligned

#### Create market item

#### Deposit funds

#### Create encrypted blob

#### Submit blob to Celestia

#### Verify inclusion proof

#### Submit proof to Aligned

#### Finalize the trade

## Limitations

### C2PA / self-signed external manifest

### Risc0 / proving time

### Aligned / proof facts and public outputs

### Blobstream / blob inclusion proof

## Related work

* [Pixel Police](https://devfolio.co/projects/pixel-police-a4c5) - A protocol that enables organisations to verify that digital content(image or video) is not GenAI/ Deepfake 
* [Veritas](https://eprint.iacr.org/2024/1066) - Verifying Image Transformations at Scale
