use risc0_zkvm::guest::env;
use risc0_zkvm::sha::rust_crypto::{Digest as _, Sha256};
use std::io::Read;

fn main() {
    // Read raw image data
    let mut image_bytes = Vec::<u8>::new();
    env::stdin().read_to_end(&mut image_bytes).unwrap();

    // Compute original image hash (has match the C2PA claim)
    let mut hasher = Sha256::default();
    hasher.update(&image_bytes);
    let image_hash = hasher.finalize_reset();

    // Write original image hash to the journal
    env::commit_slice(&image_hash);
}
