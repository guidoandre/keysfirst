use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{constants::*, error::KeysfirstError, state::*};

#[derive(Accounts)]
#[instruction(deal_id: u64)]
pub struct CreateDeal<'info> {
    #[account(mut)]
    pub landlord: Signer<'info>,

    #[account(
        init,
        payer = landlord,
        space = 8 + Deal::INIT_SPACE, // 8-byte account discriminator
        seeds = [DEAL_SEED, landlord.key().as_ref(), &deal_id.to_le_bytes()],
        bump,
    )]
    pub deal: Account<'info, Deal>,

    #[account(mint::token_program = token_program)]
    pub mint: Box<InterfaceAccount<'info, Mint>>,

    /// Holds the deposit. Owned by the deal account, so only the program's rules can move it.
    /// init_if_needed: anyone can create a deal's token account in advance, which must not block the deal.
    #[account(
        init_if_needed,
        payer = landlord,
        associated_token::mint = mint,
        associated_token::authority = deal,
        associated_token::token_program = token_program,
    )]
    pub vault: Box<InterfaceAccount<'info, TokenAccount>>,

    /// Prepared now so the tenant never pays for it at the handover.
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

pub fn handle_create_deal(
    ctx: Context<CreateDeal>,
    deal_id: u64,
    amount: u64,
    move_in: i64,
    deadline: i64,
    title: String,
) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(amount > 0, KeysfirstError::InvalidAmount);
    require!(title.len() <= MAX_TITLE_LEN, KeysfirstError::TitleTooLong);
    let window = deadline.checked_sub(move_in).ok_or(KeysfirstError::InvalidSchedule)?;
    require!(window > 0 && window <= MAX_HANDOVER_WINDOW, KeysfirstError::InvalidSchedule);
    require!(deadline > now, KeysfirstError::DeadlinePassed);

    ctx.accounts.deal.set_inner(Deal {
        landlord: ctx.accounts.landlord.key(),
        tenant: Pubkey::default(),
        mint: ctx.accounts.mint.key(),
        deal_id,
        amount,
        move_in,
        deadline,
        created_at: now,
        funded_at: 0,
        settled_at: 0,
        status: DealStatus::Open,
        bump: ctx.bumps.deal,
        title,
    });
    Ok(())
}
