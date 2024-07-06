use image::codecs::png::PngEncoder;
use image::{ExtendedColorType, ImageEncoder, ImageFormat};
use risc0_zkvm::guest::env;
use risc0_zkvm::sha::rust_crypto::{Digest as _, Sha256};
use std::io::Read;

const THUMB_SIZE_PX: u32 = 75;

fn main() {
    // Read raw image data
    let mut image_bytes = Vec::<u8>::new();
    env::stdin().read_to_end(&mut image_bytes).unwrap();

    // Compute original image hash (has match the C2PA claim)
    let image_hash = sha256(&image_bytes);

    // Load uncomressed image from bytes
    let mut original =
        image::load_from_memory_with_format(&image_bytes, ImageFormat::Tiff).unwrap();

    // Do necessary calculations to properly scale and crop to get a centered square
    let width = original.width();
    let height = original.height();
    let (x, y, width, height) = if width < height {
        (0, (height - width) / 2, width, width)
    } else {
        ((width - height) / 2, 0, height, height)
    };

    let thumbnail = original
        .crop(x, y, width, height)
        .thumbnail(THUMB_SIZE_PX, THUMB_SIZE_PX);

    // Create a buffer to hold the PNG data
    let mut buffer = Vec::new();

    // Create a new PngEncoder that writes to the buffer
    let encoder = PngEncoder::new(&mut buffer);

    // Encode the brighter image as PNG and write to the buffer
    encoder
        .write_image(
            thumbnail.as_bytes(),
            thumbnail.width(),
            thumbnail.height(),
            ExtendedColorType::Rgb8,
        )
        .unwrap();

    let thumbnail_hash = sha256(&buffer);

    // Write original image & thumbnail hashes to the journal
    env::commit_slice(&[image_hash, thumbnail_hash].concat());

    // Write resulting thumbnail to stdout
    env::write_slice(&buffer);
}

fn sha256(bytes: &[u8]) -> Vec<u8> {
    let mut hasher = Sha256::default();
    hasher.update(&bytes);
    hasher.finalize_reset().to_vec()
}
