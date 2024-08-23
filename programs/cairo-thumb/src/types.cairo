/// 256 bit hash digest.
#[derive(Drop, Copy, Default, PartialEq)]
struct Digest {
    pub bytes: [u32; 8],
}
