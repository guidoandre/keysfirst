mod common;

use common::*;
use keysfirst::state::DealStatus;

#[test]
fn tenant_locks_the_exact_amount() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams::default());
    let tenant = env.tenant.pubkey();
    let ix = ix_fund(&env, deal, tenant);
    assert_ok(&env.run(ix, Who::Tenant));

    let d = get_deal(&env, deal);
    assert_eq!(d.status, DealStatus::Funded);
    assert_eq!(d.tenant, tenant);
    assert_eq!(d.funded_at, T0);
    assert_eq!(balance(&env, ata(&env, &deal)), AMOUNT);
    assert_eq!(balance(&env, ata(&env, &tenant)), START_BALANCE - AMOUNT);
}

#[test]
fn landlord_cannot_fund_their_own_deal() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams::default());
    let landlord = env.landlord.pubkey();
    mint_to(&mut env, &landlord, START_BALANCE);
    let ix = ix_fund(&env, deal, landlord);
    assert_err(&env.run(ix, Who::Landlord), "LandlordCannotFund");
}

#[test]
fn a_deal_can_only_be_funded_once() {
    let mut env = setup();
    let deal = funded_deal(&mut env, &DealParams::default());
    let ix = ix_fund(&env, deal, env.stranger.pubkey());
    assert_err(&env.run(ix, Who::Stranger), "DealNotOpen");
    assert_eq!(balance(&env, ata(&env, &deal)), AMOUNT);
    assert_eq!(balance(&env, ata(&env, &env.stranger.pubkey())), START_BALANCE);
}

#[test]
fn cannot_fund_after_the_deadline() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = create_deal(&mut env, &p);
    set_time(&mut env.svm, p.deadline + 1);
    let ix = ix_fund(&env, deal, env.tenant.pubkey());
    assert_err(&env.run(ix, Who::Tenant), "DeadlinePassed");
}

#[test]
fn cannot_lock_the_deposit_for_more_than_180_days() {
    let mut env = setup();
    let p = DealParams { move_in: T0 + 200 * DAY, deadline: T0 + 203 * DAY, ..Default::default() };
    let deal = create_deal(&mut env, &p);
    let ix = ix_fund(&env, deal, env.tenant.pubkey());
    assert_err(&env.run(ix, Who::Tenant), "LockTooLong");
}

#[test]
fn rejects_a_different_token() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams::default());
    let other_mint = create_mint(&mut env);
    let tenant = env.tenant.pubkey();
    let other_account = mint_tokens(&mut env, other_mint, &tenant, START_BALANCE);
    let ix = ix_fund_custom(&env, deal, tenant, other_mint, other_account);
    assert_err(&env.run(ix, Who::Tenant), "WrongMint");
}

#[test]
fn rejects_paying_from_an_account_of_a_different_token() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams::default());
    let other_mint = create_mint(&mut env);
    let tenant = env.tenant.pubkey();
    let other_account = mint_tokens(&mut env, other_mint, &tenant, START_BALANCE);
    let ix = ix_fund_custom(&env, deal, tenant, env.mint, other_account);
    assert_err(&env.run(ix, Who::Tenant), "ConstraintTokenMint");
}

#[test]
fn fails_without_enough_money_and_leaves_the_deal_open() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams { amount: START_BALANCE + EUR, ..Default::default() });
    let ix = ix_fund(&env, deal, env.tenant.pubkey());
    assert!(env.run(ix, Who::Tenant).is_err());
    assert_eq!(get_deal(&env, deal).status, DealStatus::Open);
}
