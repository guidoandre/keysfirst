use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum DealStatus {
    /// Created, waiting for the tenant's deposit.
    Open,
    /// Deposit locked in the vault.
    Funded,
    /// Tenant confirmed the handover; deposit paid to the landlord.
    Released,
    /// Deposit returned to the tenant.
    Refunded,
    /// Landlord withdrew the deal before anyone paid.
    Cancelled,
}

/// One rental deposit. Stays on-chain after settlement as a public receipt.
#[account]
#[derive(InitSpace)]
pub struct Deal {
    pub landlord: Pubkey,
    /// Pubkey::default() until someone funds the deal.
    pub tenant: Pubkey,
    pub mint: Pubkey,
    pub deal_id: u64,
    /// Exact deposit in the token's base units.
    pub amount: u64,
    /// Unix seconds.
    pub move_in: i64,
    /// Unix seconds. After this, anyone can return the deposit to the tenant.
    pub deadline: i64,
    pub created_at: i64,
    pub funded_at: i64,
    pub settled_at: i64,
    pub status: DealStatus,
    pub bump: u8,
    #[max_len(64)]
    pub title: String,
}
