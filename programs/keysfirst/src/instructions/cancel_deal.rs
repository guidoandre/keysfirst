use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants::*, error::KeysfirstError, instructions::payout::pay_out_and_close_vault, state::*,
};

#[derive(Accounts)]
pub struct CancelDeal<'info> {
    #[account(mut)]
    pub landlord: Signer<'info>,

    #[account(
        mut,
        seeds = [DEAL_SEED, deal.landlord.as_ref(), &deal.deal_id.to_le_bytes()],
        bump = deal.bump,
        has_one = landlord @ KeysfirstError::NotLandlord,
        has_one = mint @ KeysfirstError::WrongMint,
    )]
    pub deal: Account<'info, Deal>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = deal,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Receives anything someone sent to the empty vault, so the vault can close.
    #[account(
        init_if_needed,
        payer = landlord,
        associated_token::mint = mint,
        associated_token::authority = landlord,
        associated_token::token_program = token_program,
    )]
    pub landlord_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_cancel_deal(ctx: Context<CancelDeal>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(ctx.accounts.deal.status == DealStatus::Open, KeysfirstError::DealNotOpen);

    pay_out_and_close_vault(
        &ctx.accounts.deal,
        &ctx.accounts.vault,
        &ctx.accounts.mint,
        &ctx.accounts.landlord_token,
        ctx.accounts.landlord.to_account_info(),
        &ctx.accounts.token_program,
    )?;

    let deal = &mut ctx.accounts.deal;
    deal.status = DealStatus::Cancelled;
    deal.settled_at = now;
    Ok(())
}
