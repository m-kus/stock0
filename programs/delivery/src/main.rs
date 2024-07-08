use std::{
    fs::{create_dir_all, File},
    io::Write,
    path::PathBuf,
};

use celestia_types::{hash::Hash, nmt::{Namespace, NamespacedHashExt}, Blob, Commitment, ExtendedHeader};
use chacha20::{cipher::{NewCipher, StreamCipher}, ChaCha20};
use delivery_methods::{DELIVERY_GEN_ELF, DELIVERY_GEN_ID};
use k256::{
    ecdsa::SigningKey, elliptic_curve::{rand_core::OsRng, Field, PrimeField, PublicKey, group::GroupEncoding}, AffinePoint, Scalar, Secp256k1
};
use nmt_rs::{simple_merkle::{db::MemDb, tree::MerkleTree}, TmSha2Hasher};
use risc0_zkvm::{default_prover, ExecutorEnv};
use std::ops::Mul;

const NAMESPACE: &[u8] = &[1, 2, 3, 4, 5];
const CHACHA_STATIC_NONCE: &[u8; 12] = b"bakingbaddev";

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::filter::EnvFilter::from_default_env())
        .init();

    // TODO: use buyer public key
    let signing_key = SigningKey::random(&mut OsRng);
    let public_key_bytes = signing_key.verifying_key().to_sec1_bytes();

    // This is session key for symmetric encryption (private input)
    let random_scalar = Scalar::random(&mut OsRng);
    let random_scalar_bytes = random_scalar.to_bytes().to_vec();

    // Source image (private input)
    let image_bytes = include_bytes!("../tests/cat.tiff");

    // Create blob
    let blob_data = generate_blob(image_bytes, &random_scalar_bytes, &public_key_bytes);

    // Create namespace
    let my_namespace = Namespace::new_v0(NAMESPACE).expect("Invalid namespace");

    // Load header -------------------------

    let header_bytes = include_bytes!("../tests/header.dat");
    let dah = ExtendedHeader::decode_and_validate(header_bytes).expect("Invalid header");

    let eds_row_roots = &dah.dah.row_roots();
    let eds_column_roots = &dah.dah.column_roots();
    let data_tree_leaves: Vec<_> = eds_row_roots
        .iter()
        .chain(eds_column_roots.iter())
        .map(|root| root.to_array())
        .collect();

    // "Data root" is the merkle root of the EDS row and column roots
    let hasher = TmSha2Hasher {}; // Tendermint Sha2 hasher
    let mut tree: MerkleTree<MemDb<[u8; 32]>, TmSha2Hasher> = MerkleTree::with_hasher(hasher);
    for leaf in data_tree_leaves {
        tree.push_raw_leaf(&leaf);
    }
    // Ensure that the data root is the merkle root of the EDS row and column roots
    assert_eq!(dah.dah.hash(), Hash::Sha256(tree.root()));

    // extended data square (EDS) size
    let eds_size = eds_row_roots.len();
    // original data square (ODS) size
    let ods_size = eds_size / 2;
    
    // Load shares proofs -------------------

    let proofs_str = include_str!("../tests/proofs.json");
    // NMT range proofs, from leaves into row roots.
    let proofs: Vec<celestia_types::nmt::NamespaceProof> =
        serde_json::from_str(proofs_str).unwrap();

    let proofs_val: serde_json::Value = serde_json::from_str(proofs_str).unwrap();
    let index = proofs_val.get(0).unwrap().get("start").unwrap().as_u64().unwrap();

    // Load blob ----------------------------

    let mut blob = Blob::new(my_namespace, blob_data.clone()).unwrap();
    blob.index = Some(index);

    let blob_index: usize = blob.index.unwrap().try_into().unwrap();
    let blob_size: usize = blob.data.len() / 512;
    let first_row_index: usize = blob_index / ods_size;
    let last_row_index: usize = first_row_index + (blob_size / ods_size);

    // Calculate blob commitment
    let blob_commitment = Commitment::from_blob(my_namespace, 0, &blob_data)
        .expect("Failed to create commitment");

    let mut ns = [0u8; 32];
    ns[32-NAMESPACE.len()..].copy_from_slice(NAMESPACE);

    println!("BLOB NAMESPACE: {}", base64::encode(ns));
    println!("BLOB COMMITMENT: {}", base64::encode(blob_commitment.0));

    // For each row spanned by the blob, you should have one NMT range proof into a row root.
    //assert_eq!(proofs.len(), last_row_index + 1 - first_row_index);

    let rp = tree.build_range_proof(first_row_index..last_row_index);

    // Write to stdin -----------------------

    let mut env = ExecutorEnv::builder();
    let num_shares = last_row_index as u32 - first_row_index as u32;

    // write data root
    env.write_slice(dah.dah.hash().as_bytes());
    // write "num rows" spanned by the blob
    env.write(&num_shares).unwrap();
    // write the range proof
    env.write(&rp).unwrap();
    // write the row roots
    for row_root in eds_row_roots[first_row_index..last_row_index].iter() {
        env.write(&row_root).unwrap();
    }
    // write the proofs {
    for proof in &proofs[..num_shares as usize] {
        env.write(proof).unwrap();
    }
    // write encryption data
    env.write_slice(&public_key_bytes);
    env.write_slice(&random_scalar_bytes);
    env.write_slice(image_bytes);

    // Generate proof --------------------------

    let env = env
        .build()
        .unwrap();

    let prover = default_prover();
    let prove_info = prover.prove(env, DELIVERY_GEN_ELF).unwrap();

    // Check that everything is OK
    prove_info.receipt.verify(DELIVERY_GEN_ID).expect("failed to verify");

    let mode = if std::env::var_os("RISC0_DEV_MODE").is_some_and(|x| x == "1") {
        "dev"
    } else {
        "prod"
    };
    let output_dir: PathBuf = [env!("CARGO_MANIFEST_DIR"), "..", "target", mode, "delivery"]
        .iter()
        .collect();
    create_dir_all(output_dir.as_path()).unwrap();

    let receipt_bytes = bincode::serialize(&prove_info.receipt).unwrap();
    let mut receipt_file = File::create(output_dir.join("receipt")).unwrap();
    receipt_file.write_all(&receipt_bytes).unwrap();

    let image_id_bytes = convert_image_id(&DELIVERY_GEN_ID);
    let mut image_id_file = File::create(output_dir.join("image_id")).unwrap();
    image_id_file.write_all(&image_id_bytes).unwrap();

    let mut blob_file = File::create(output_dir.join("blob")).unwrap();
    blob_file.write_all(&blob_data).unwrap();
}

pub fn convert_image_id(data: &[u32; 8]) -> [u8; 32] {
    let mut res = [0; 32];
    for i in 0..8 {
        res[4 * i..4 * (i + 1)].copy_from_slice(&data[i].to_le_bytes());
    }
    res
}

pub fn generate_blob(image_bytes: &[u8], random_scalar_y: &[u8], public_key_h: &[u8]) -> Vec<u8> {
    let session_key = chacha20::Key::from_slice(random_scalar_y);

    let public_key =
        PublicKey::<Secp256k1>::from_sec1_bytes(public_key_h).expect("parse public point");

    // Blind session key
    let h = public_key.as_affine();
    let y_repr: [u8; 32] = random_scalar_y.try_into().unwrap();
    let y = Scalar::from_repr(y_repr.into()).expect("parse scalar");
    let c1 = AffinePoint::GENERATOR.mul(y).to_affine();
    let c2 = h.mul(y).to_affine();

    // This is "encrypted" encryption key
    let blinded_key = [c1.to_bytes().to_vec(), c2.to_bytes().to_vec()].concat();

    // Encrypt image using symmetric encryption
    let nonce = chacha20::Nonce::from_slice(CHACHA_STATIC_NONCE);
    let mut cipher = ChaCha20::new(session_key, nonce);

    let mut encrypted_image = image_bytes.to_vec();
    cipher.try_apply_keystream(&mut encrypted_image).unwrap();

    // Construct blob
    [blinded_key, encrypted_image.to_vec()].concat()
}
