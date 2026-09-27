use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants::*, error::KeysfirstError, instructions::payout::pay_out_and_close_vault, state::*,
};

#[derive(Accounts)]
pub struct ConfirmHandover<'info> {
    /// Must be the tenant who funded the deal. Pays the fee.
    #[account(mut)]
    pub tenant: Signer<'info>,

    #[account(
        mut,
        seeds = [DEAL_SEED, deal.landlord.as_ref(), &deal.deal_id.to_le_bytes()],
        bump = deal.bump,
        has_one = tenant @ KeysfirstError::NotTenant,
        has_one = landlord @ KeysfirstError::WrongLandlord,
        has_one = mint @ KeysfirstError::WrongMint,
    )]
    pub deal: Account<'info, Deal>,

    /// Receives the vault's rent back (they paid it at creation).
    #[account(mut)]
    pub landlord: SystemAccount<'info>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = deal,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        init_if_needed,
        payer = tenant,
        associated_token::mint = mint,
        associated_token::authority = landlord,
        associated_token::token_program = token_program,
    )]
    pub landlord_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_confirm_handover(ctx: Context<ConfirmHandover>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let deal = &ctx.accounts.deal;
    require!(deal.status == DealStatus::Funded, KeysfirstError::DealNotFunded);
    require!(
        now >= deal.move_in.saturating_sub(HANDOVER_OPENS_BEFORE_MOVE_IN),
        KeysfirstError::HandoverNotOpenYet
    );
    require!(now <= deal.deadline, KeysfirstError::DeadlinePassed);

    pay_out_and_close_vault(
        &ctx.accounts.deal,
        &ctx.accounts.vault,
        &ctx.accounts.mint,
        &ctx.accounts.landlord_token,
        ctx.accounts.landlord.to_account_info(),
        &ctx.accounts.token_program,
    )?;

    let deal = &mut ctx.accounts.deal;
    deal.status = DealStatus::Released;
    deal.settled_at = now;
    Ok(())
}
