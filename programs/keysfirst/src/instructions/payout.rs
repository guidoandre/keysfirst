use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface, TransferChecked,
};

use crate::{constants::DEAL_SEED, state::Deal};

/// Sends everything in the vault (the deposit plus anything else sent to it) to
/// `recipient_token`, then closes the vault and returns its rent to `rent_receiver`
/// (normally the landlord; a refund picks the caller when the landlord's wallet can't receive SOL).
/// Returns the amount paid out.
pub fn pay_out_and_close_vault<'info>(
    deal: &Account<'info, Deal>,
    vault: &InterfaceAccount<'info, TokenAccount>,
    mint: &InterfaceAccount<'info, Mint>,
    recipient_token: &InterfaceAccount<'info, TokenAccount>,
    rent_receiver: AccountInfo<'info>,
    token_program: &Interface<'info, TokenInterface>,
) -> Result<u64> {
    let deal_id = deal.deal_id.to_le_bytes();
    let bump = [deal.bump];
    let seeds: &[&[u8]] = &[DEAL_SEED, deal.landlord.as_ref(), &deal_id, &bump];
    let signer_seeds = &[seeds];

    let paid = vault.amount;
    if paid > 0 {
        transfer_checked(
            CpiContext::new_with_signer(
                token_program.key(),
                TransferChecked {
                    from: vault.to_account_info(),
                    mint: mint.to_account_info(),
                    to: recipient_token.to_account_info(),
                    authority: deal.to_account_info(),
                },
                signer_seeds,
            ),
            paid,
            mint.decimals,
        )?;
    }

    close_account(CpiContext::new_with_signer(
        token_program.key(),
        CloseAccount {
            account: vault.to_account_info(),
            destination: rent_receiver,
            authority: deal.to_account_info(),
        },
        signer_seeds,
    ))?;
    Ok(paid)
}
