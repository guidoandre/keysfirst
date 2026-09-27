use anchor_lang::prelude::*;
use anchor_spl::token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked};

use crate::{constants::*, error::KeysfirstError, state::*};

#[derive(Accounts)]
pub struct Fund<'info> {
    /// Whoever pays becomes the tenant (open link).
    #[account(mut)]
    pub tenant: Signer<'info>,

    #[account(
        mut,
        seeds = [DEAL_SEED, deal.landlord.as_ref(), &deal.deal_id.to_le_bytes()],
        bump = deal.bump,
    )]
    pub deal: Account<'info, Deal>,

    #[account(address = deal.mint @ KeysfirstError::WrongMint)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        token::mint = mint,
        token::authority = tenant,
        token::token_program = token_program,
    )]
    pub tenant_token: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = deal,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
}

pub fn handle_fund(ctx: Context<Fund>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let tenant = ctx.accounts.tenant.key();
    let deal = &ctx.accounts.deal;
    require!(deal.status == DealStatus::Open, KeysfirstError::DealNotOpen);
    require_keys_neq!(tenant, deal.landlord, KeysfirstError::LandlordCannotFund);
    require!(now <= deal.deadline, KeysfirstError::DeadlinePassed);
    require!(deal.deadline - now <= MAX_LOCK_DURATION, KeysfirstError::LockTooLong);

    transfer_checked(
        CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.tenant_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
                authority: ctx.accounts.tenant.to_account_info(),
            },
        ),
        deal.amount,
        ctx.accounts.mint.decimals,
    )?;

    let deal = &mut ctx.accounts.deal;
    deal.tenant = tenant;
    deal.status = DealStatus::Funded;
    deal.funded_at = now;
    Ok(())
}
