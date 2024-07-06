use chacha20::cipher::{NewCipher, StreamCipher};
use chacha20::ChaCha20;
use k256::elliptic_curve::{PrimeField, PublicKey, group::GroupEncoding};
use k256::{AffinePoint, Scalar, Secp256k1};
use risc0_zkvm::guest::env;
use risc0_zkvm::sha::rust_crypto::{Digest as _, Sha256};
use std::io::Read;
use std::ops::Mul;

const CHACHA_STATIC_NONCE: &[u8; 12] = b"bakingbaddev";

fn main() {
    // Read receiver's public key (SEC1)
    let mut public_key_h = [0u8; 33];
    env::stdin().read(&mut public_key_h).unwrap();

    // Read random scalar (SEC1)
    let mut random_scalar_y = [0u8; 32];
    env::stdin().read(&mut random_scalar_y).unwrap();

    let session_key = chacha20::Key::from_slice(&random_scalar_y);

    let public_key =
        PublicKey::<Secp256k1>::from_sec1_bytes(&public_key_h).expect("parse public point");

    // Blind session key
    let h = public_key.as_affine();
    let y = Scalar::from_repr(random_scalar_y.into()).expect("parse scalar");
    let c1 = AffinePoint::GENERATOR.mul(y).to_affine();
    let c2 = h.mul(y).to_affine();

    let blinded_key = [c1.to_bytes().to_vec(), c2.to_bytes().to_vec()].concat();

    // Read raw image data
    let mut image_bytes = Vec::<u8>::new();
    env::stdin().read_to_end(&mut image_bytes).unwrap();

    // Compute original image hash
    let image_hash = sha256(&image_bytes);

    // Encrypt image using symmetric encryption
    let nonce = chacha20::Nonce::from_slice(CHACHA_STATIC_NONCE);
    let mut cipher = ChaCha20::new(session_key, nonce);

    let mut encrypted_image = image_bytes;
    cipher.try_apply_keystream(&mut encrypted_image).unwrap();

    // Construct blob
    let blob = [blinded_key, encrypted_image].concat();
    let blob_hash = sha256(&blob);

    // Write original image & blob hashes as well as the receiver's public key to the journal
    env::commit_slice(&[image_hash, blob_hash, public_key_h.to_vec()].concat());

    // Write blob to the stdout
    env::write_slice(&blob);
}

fn sha256(bytes: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::default();
    hasher.update(&bytes);
    hasher.finalize_reset().to_vec()
}
