mod types;
mod image;

use types::Digest;

/// Main entrypoint, takes serialized image payload (without header/metadata),
/// returns hash of the image body plus hash of the resulting thumbnail.
///
/// SHA256 is used for both hashes in order to be compatible with C2PA manifest
/// and IPFS multihash specs. Array of 4 byte words is used for the optimal performance
/// of Cairo corelib methods.
///
/// What we are proving here is that we indeed generated a preview (available on IPFS)
/// from the original image having this particular hash. Combined with C2PA manifest
/// attesting that the image with given hash is not a fake such proof guarantees
/// that the derived thumbnail is not a fake either.
/// 
/// Note that the image bytes are "private" input, though the proof might leak some bits
/// which is not critical for our case.
fn main(image: Array<u32>) -> (Digest, Digest) {
    (Default::default(), Default::default())
}
