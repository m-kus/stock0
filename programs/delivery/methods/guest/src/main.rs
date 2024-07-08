use celestia_types::nmt::{MerkleHash, Namespace, NamespaceProof, NamespacedHashExt};
use celestia_types::InfoByte;
use chacha20::cipher::{NewCipher, StreamCipher};
use chacha20::ChaCha20;
use k256::elliptic_curve::{PrimeField, PublicKey, group::GroupEncoding};
use k256::{AffinePoint, Scalar, Secp256k1};
use nmt_rs::simple_merkle::proof::Proof;
use nmt_rs::{NamespacedHash, TmSha2Hasher};
use risc0_zkvm::guest::env;
use risc0_zkvm::sha::rust_crypto::{Digest as _, Sha256};
use std::io::{Read, Cursor};
use std::ops::Mul;
use bytes::{Buf, BufMut, BytesMut};

const CHACHA_STATIC_NONCE: &[u8; 12] = b"bakingbaddev";
const NAMESPACE: &[u8] = &[1, 2, 3, 4, 5];

fn main() {
    // read the data root
    let mut data_root = [0u8; 32];
    env::read_slice(&mut data_root);
    // read num rows
    let num_rows: u32 = env::read();
    // read the row-inclusion range proof
    let range_proof: Proof<TmSha2Hasher> = env::read();
    // read the row roots
    let mut row_roots = vec![];
    for _ in 0..num_rows {
        row_roots.push(env::read::<NamespacedHash<29>>());
    }
    // for each row spanned by the blob, we have a NMT range proof
    let mut proofs = vec![];
    for _ in 0..num_rows {
        let proof = env::read::<NamespaceProof>();
        proofs.push(proof);
    }

    // Read receiver's public key (SEC1)
    let mut public_key_h = [0u8; 33];
    env::read_slice(&mut public_key_h);

    // Read random scalar (SEC1)
    let mut random_scalar_y = [0u8; 32];
    env::read_slice(&mut random_scalar_y);

    // Read raw image data
    let mut image_bytes = Vec::<u8>::new();
    env::stdin().read_to_end(&mut image_bytes).unwrap();

    // Load the keys
    let session_key = chacha20::Key::from_slice(&random_scalar_y);
    let public_key =
        PublicKey::<Secp256k1>::from_sec1_bytes(&public_key_h).expect("parse public point");

    // Blind session key
    let h = public_key.as_affine();
    let y = Scalar::from_repr(random_scalar_y.into()).expect("parse scalar");
    let c1 = AffinePoint::GENERATOR.mul(y).to_affine();
    let c2 = h.mul(y).to_affine();

    // This is "encrypted" encryption key
    let blinded_key = [c1.to_bytes().to_vec(), c2.to_bytes().to_vec()].concat();

    // Compute original image hash
    let image_hash = sha256(&image_bytes);

    // Encrypt image using symmetric encryption
    let nonce = chacha20::Nonce::from_slice(CHACHA_STATIC_NONCE);
    let mut cipher = ChaCha20::new(session_key, nonce);

    let mut encrypted_image = image_bytes;
    cipher.try_apply_keystream(&mut encrypted_image).unwrap();

    // Construct blob
    let blob = [blinded_key, encrypted_image].concat();
    let namespace = Namespace::new_v0(NAMESPACE).expect("Invalid namespace");

    // Split into shares
    let shares = split_blob_to_shares(namespace, &blob);

    // We have one NMT range proof for each row spanned by the blob
    // Verify that the blob's shares go into the respective row roots
    let mut start = 0;
    for i in 0..num_rows {
        let proof = &proofs[i as usize];
        let root = &row_roots[i as usize];
        let end = start + (proof.end_idx() as usize - proof.start_idx() as usize);
        proof.verify_range(root, &shares[start..end], namespace.into()).unwrap();
        start = end;
    }

    // Verify the row-inclusion range proof
    let tm_hasher = TmSha2Hasher {};
    let blob_row_root_hashes: Vec<[u8; 32]> = row_roots
        .iter()
        .map(|root| tm_hasher.hash_leaf(&root.to_array()))
        .collect();

    range_proof.verify_range(
        &data_root
            .try_into()
            .expect("we already checked, this should be fine"),
        &blob_row_root_hashes,
    ).unwrap();

    // Write original image & blob hashes as well as the receiver's public key to the journal
    env::commit_slice(&[image_hash, data_root.to_vec(), public_key_h.to_vec()].concat());
}

fn sha256(bytes: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::default();
    hasher.update(&bytes);
    hasher.finalize_reset().to_vec()
}

fn split_blob_to_shares(
    namespace: Namespace,
    blob_data: &[u8],
) -> Vec<[u8; 512]> {
    let mut shares = Vec::new();
    let mut cursor = Cursor::new(blob_data);

    while cursor.has_remaining() {
        let share = build_sparse_share_v0(namespace, &mut cursor);
        shares.push(share);
    }
    shares
}

/// Build a sparse share from a cursor over data
fn build_sparse_share_v0(
    namespace: Namespace,
    data: &mut Cursor<impl AsRef<[u8]>>,
) -> [u8; 512] {
    let is_first_share = data.position() == 0;
    let data_len = cursor_inner_length(data);
    let mut bytes = BytesMut::with_capacity(512);

    // Write the namespace
    bytes.put_slice(namespace.as_bytes());
    // Write the info byte
    let info_byte = InfoByte::new(0, is_first_share).unwrap();
    bytes.put_u8(info_byte.as_u8());

    // If this share is first in the sequence, write the bytes len of the sequence
    if is_first_share {
        let data_len = data_len
            .try_into()
            .unwrap();
        bytes.put_u32(data_len);
    }

    // Calculate amount of bytes to read
    let current_size = bytes.len();
    let available_space = 512 - current_size;
    let read_amount = available_space.min(data.remaining());

    // Resize to share size with 0 padding
    bytes.resize(512, 0);
    // Read the share data
    data.copy_to_slice(&mut bytes[current_size..current_size + read_amount]);

    bytes.to_vec().try_into().unwrap()
}

fn cursor_inner_length(cursor: &Cursor<impl AsRef<[u8]>>) -> usize {
    cursor.get_ref().as_ref().len()
}
