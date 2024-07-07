use std::{
    fs::{create_dir_all, File},
    io::Write,
    path::PathBuf,
};

use envelope_methods::{ENVELOPE_GEN_ELF, ENVELOPE_GEN_ID};
use k256::{
    ecdsa::SigningKey,
    elliptic_curve::{rand_core::OsRng, Field},
    Scalar,
};
use risc0_zkvm::{default_prover, ExecutorEnv};

fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::filter::EnvFilter::from_default_env())
        .init();

    let signing_key = SigningKey::random(&mut OsRng);
    let public_key_bytes = signing_key.verifying_key().to_sec1_bytes();

    let random_scalar = Scalar::random(&mut OsRng);
    let random_scalar_bytes = random_scalar.to_bytes().to_vec();

    let image_bytes = include_bytes!("../tests/cat.tiff");
    let mut blob = Vec::new();

    let env = ExecutorEnv::builder()
        .write_slice(&public_key_bytes)
        .write_slice(&random_scalar_bytes)
        .write_slice(image_bytes)
        .stdout(&mut blob)
        .build()
        .unwrap();

    let prover = default_prover();
    let prove_info = prover.prove(env, ENVELOPE_GEN_ELF).unwrap();

    // Check that everything is OK
    prove_info.receipt.verify(ENVELOPE_GEN_ID).expect("failed to verify");

    let mode = if std::env::var_os("RISC0_DEV_MODE").is_some_and(|x| x == "1") {
        "dev"
    } else {
        "prod"
    };
    let output_dir: PathBuf = [env!("CARGO_MANIFEST_DIR"), "..", "target", mode, "envelope"]
        .iter()
        .collect();
    create_dir_all(output_dir.as_path()).unwrap();

    let receipt_bytes = bincode::serialize(&prove_info.receipt).unwrap();
    let mut receipt_file = File::create(output_dir.join("receipt")).unwrap();
    receipt_file.write_all(&receipt_bytes).unwrap();

    let image_id_bytes = ENVELOPE_GEN_ID.map(|limb| limb.to_be_bytes()).concat();
    let mut image_id_file = File::create(output_dir.join("image_id")).unwrap();
    image_id_file.write_all(&image_id_bytes).unwrap();

    let mut blob_file = File::create(output_dir.join("blob")).unwrap();
    blob_file.write_all(&blob).unwrap();
}
