use anchor_lang::prelude::*;

#[error_code]
pub enum KeysfirstError {
    #[msg("The deposit must be more than zero")]
    InvalidAmount,
    #[msg("The room description is too long (max 64 bytes)")]
    TitleTooLong,
    #[msg("The handover deadline must be after move-in and at most 14 days later")]
    InvalidSchedule,
    #[msg("The handover deadline has passed")]
    DeadlinePassed,
    #[msg("Paying now would lock the deposit for more than 180 days")]
    LockTooLong,
    #[msg("This deal is not waiting for a deposit")]
    DealNotOpen,
    #[msg("This deal has no locked deposit")]
    DealNotFunded,
    #[msg("The landlord cannot pay their own deposit")]
    LandlordCannotFund,
    #[msg("Only the tenant who paid can confirm the handover")]
    NotTenant,
    #[msg("Only the landlord can do this")]
    NotLandlord,
    #[msg("The handover opens 24 hours before move-in")]
    HandoverNotOpenYet,
    #[msg("Only the landlord can return the deposit before the deadline")]
    DeadlineNotReached,
    #[msg("This token does not match the deal")]
    WrongMint,
    #[msg("This account is not the deal's tenant")]
    WrongTenant,
    #[msg("This account is not the deal's landlord")]
    WrongLandlord,
}
