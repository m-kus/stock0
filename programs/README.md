# Stock0 programs

This folder contains RISC0 programs that are part of the Stock0 protocol.  

In order to build a particular program in developer mode (no proof) run:
```
make <program name>
```

For generating a proof (might take several minutes):
```
make <program name>-proof
```

The artifacts are available in the `./target/<dev / prod>/<program name>`:
- Receipt: serialized Risc0 receipt (seal + journal), compatible with Aligned
- Image ID: serialized program elf hash, comparible with Aligned
- Private outputs

## Thumbnail

This program takes an image in `TIFF` (uncompressed) format and generates a `PNG` thumbnail of size 75x75px.  

Inputs:
- Image bytes (private)

Outputs:
- Image hash (public)
- Thumbnail hash (public)
- Thumbnail bytes (private)

## Envelope

This program encrypts original image using envelope technique: the content is encrypted using symmetric cypher (in our case ChaCha) and the session key is encrypted with public key encryption (ElGamal). Lastly it creates a Celestia compatible blob and outputs its commitment.

Inputs:
- Image bytes (private)
- Session key (private)
- Public key of the buyer (private)

Outputs:
- Image hash (public)
- Blob commitment (public)
- Public key of the buyer (public)

## Blobshot

This program is a combination of https://github.com/S1nus/risc0-blob-inclusion and https://github.com/S1nus/sp1-blob-inclusion that allows to prove inclusion of a particular blob (currently with Celestia & BlobstreamX you can do block, transaction, and share range checks).

Inputs:
- Data root hash
- Number of rows in the shares square related to our blob
- Number of shares in our blob
- Namespace
- Range proof (for shares in the blob)
- Row roots
- Shares
- Namespace proofs

Outputs:
- Proof validity (public)

It currently works only with sample data because it's pretty complicated to generate all the inputs for an arbitrary blob.

## Delivery

Finally, this program combines together envelope and blobshot in order to eliminate the commitment computation step from both programs.  
So it encrypts the image AND proves that this blob belongs to a particular data root. With this proof it is enough to just have a verified Celestia header in Ethereum (can be retrieved from Blobstream contract).

Inputs:
- Data root hash
- Number of shares in our blob
- Range proof
- Row roots
- Namespace proofs
- Public key of the buyer
- Random session key
- Image bytes

Outputs:
- Public key of the buyer
- Data root
- Image hash

You might notice that we have a non-deterministic computation here, namely blob and header data have to be availailable prior to program execution. It means that you actually have to run the encryption twice, first time outside of the circuit and second time within the RISC0.  
