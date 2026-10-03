use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{
    constants::*, error::KeysfirstError, instructions::payout::pay_out_and_close_vault, state::*,
};

#[derive(Accounts)]
pub struct Refund<'info> {
    /// The landlord (any time) or anyone (after the deadline). Pays the fee.
    #[account(mut)]
    pub caller: Signer<'info>,

    #[account(
        mut,
        seeds = [DEAL_SEED, deal.landlord.as_ref(), &deal.deal_id.to_le_bytes()],
        bump = deal.bump,
        has_one = tenant @ KeysfirstError::WrongTenant,
        has_one = landlord @ KeysfirstError::WrongLandlord,
        has_one = mint @ KeysfirstError::WrongMint,
    )]
    pub deal: Account<'info, Deal>,

    /// CHECK: address pinned by `has_one = tenant`; only the owner of the refund's token account.
    /// Not a SystemAccount: an owner check would let a wallet that changed owner block its own refund.
    pub tenant: UncheckedAccount<'info>,

    /// CHECK: address pinned by `has_one = landlord`; only receives the vault's rent back (they paid it at creation).
    /// Not a SystemAccount: the landlord could reassign their wallet to another program and block every refund.
    #[account(mut)]
    pub landlord: UncheckedAccount<'info>,

    pub mint: Box<InterfaceAccount<'info, Mint>>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = deal,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Always the tenant's own token account; recreated if they closed it.
    #[account(
        init_if_needed,
        payer = caller,
        associated_token::mint = mint,
        associated_token::authority = tenant,
        associated_token::token_program = token_program,
    )]
    pub tenant_token: Box<InterfaceAccount<'info, TokenAccount>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

pub fn handle_refund(ctx: Context<Refund>) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    let deal = &ctx.accounts.deal;
    require!(deal.status == DealStatus::Funded, KeysfirstError::DealNotFunded);
    let by_landlord = ctx.accounts.caller.key() == deal.landlord;
    require!(by_landlord || now > deal.deadline, KeysfirstError::DeadlineNotReached);

    // The vault's rent goes back to the landlord, who paid it. A landlord who turned their wallet into a program can't
    // receive lamports any more, which would block every refund: then whoever returns the deposit gets the rent.
    let rent_receiver = if ctx.accounts.landlord.executable {
        ctx.accounts.caller.to_account_info()
    } else {
        ctx.accounts.landlord.to_account_info()
    };
    pay_out_and_close_vault(
        &ctx.accounts.deal,
        &ctx.accounts.vault,
        &ctx.accounts.mint,
        &ctx.accounts.tenant_token,
        rent_receiver,
        &ctx.accounts.token_program,
    )?;

    let deal = &mut ctx.accounts.deal;
    deal.status = DealStatus::Refunded;
    deal.settled_at = now;
    Ok(())
}
