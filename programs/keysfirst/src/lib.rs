use anchor_lang::prelude::*;

pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("BeRg2HQAhUELdoedXaz8HnKnTt9TeQeD7n94iQxFLcbP");

/// Keysfirst: a rental deposit that moves only when the keys do.
#[program]
pub mod keysfirst {
    use super::*;

    /// Landlord opens a deal. Creates the deal record and its empty vault.
    pub fn create_deal(
        ctx: Context<CreateDeal>,
        deal_id: u64,
        amount: u64,
        move_in: i64,
        deadline: i64,
        title: String,
    ) -> Result<()> {
        instructions::create_deal::handle_create_deal(ctx, deal_id, amount, move_in, deadline, title)
    }

    /// Tenant locks the exact deposit in the vault.
    pub fn fund(ctx: Context<Fund>) -> Result<()> {
        instructions::fund::handle_fund(ctx)
    }

    /// Tenant, holding the keys, releases the deposit to the landlord.
    pub fn confirm_handover(ctx: Context<ConfirmHandover>) -> Result<()> {
        instructions::confirm_handover::handle_confirm_handover(ctx)
    }
}
