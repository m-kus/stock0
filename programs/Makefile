.PHONY: thumbnail envelope blobshot delivery

thumbnail:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin thumbnail

thumbnail-proof:
	cargo run --bin thumbnail

envelope:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin envelope

envelope-proof:
	cargo run --bin envelope

blobshot:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin blobshot

blobshot-proof:
	cargo run --bin blobshot

delivery:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin delivery

delivery-proof:
	cargo run --bin delivery