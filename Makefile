dev:
	RUST_LOG="[executor]=info" RISC0_DEV_MODE=1 cargo run --bin host

proof:
	cargo run --bin host