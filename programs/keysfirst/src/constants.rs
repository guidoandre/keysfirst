/// Seed for each deal account: [DEAL_SEED, landlord, deal_id (little-endian u64)].
pub const DEAL_SEED: &[u8] = b"deal";

/// Room description limit, in bytes.
pub const MAX_TITLE_LEN: usize = 64;

/// The tenant can confirm the handover from 24 hours before move-in.
/// Stops "scan this QR to confirm your booking" tricks weeks in advance.
pub const HANDOVER_OPENS_BEFORE_MOVE_IN: i64 = 24 * 60 * 60;

/// The handover deadline is at most 14 days after move-in.
pub const MAX_HANDOVER_WINDOW: i64 = 14 * 24 * 60 * 60;

/// Funding may lock the tenant's money for at most 180 days.
pub const MAX_LOCK_DURATION: i64 = 180 * 24 * 60 * 60;
