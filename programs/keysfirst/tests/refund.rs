mod common;

use common::*;
use keysfirst::state::DealStatus;

#[test]
fn anyone_can_return_the_deposit_after_the_deadline() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.deadline + 1);
    let ix = ix_refund(&env, deal, env.stranger.pubkey());
    assert_ok(&env.run(ix, Who::Stranger));

    let d = get_deal(&env, deal);
    assert_eq!(d.status, DealStatus::Refunded);
    assert_eq!(d.settled_at, p.deadline + 1);
    assert_eq!(balance(&env, ata(&env, &env.tenant.pubkey())), START_BALANCE);
    assert!(!exists(&env, ata(&env, &deal)), "vault is closed");
}

#[test]
fn strangers_cannot_refund_until_the_deadline_has_passed() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.deadline);
    let ix = ix_refund(&env, deal, env.stranger.pubkey());
    assert_err(&env.run(ix, Who::Stranger), "DeadlineNotReached");
}

#[test]
fn the_tenant_cannot_take_the_money_back_before_the_deadline() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in);
    let ix = ix_refund(&env, deal, env.tenant.pubkey());
    assert_err(&env.run(ix, Who::Tenant), "DeadlineNotReached");
}

#[test]
fn the_landlord_can_give_the_money_back_at_any_time() {
    let mut env = setup();
    let deal = funded_deal(&mut env, &DealParams::default());
    let ix = ix_refund(&env, deal, env.landlord.pubkey());
    assert_ok(&env.run(ix, Who::Landlord));
    assert_eq!(get_deal(&env, deal).status, DealStatus::Refunded);
    assert_eq!(balance(&env, ata(&env, &env.tenant.pubkey())), START_BALANCE);
}

#[test]
fn the_refund_always_goes_to_the_deals_tenant() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.deadline + 1);
    let stranger = env.stranger.pubkey();
    let ix = ix_refund_custom(&env, deal, stranger, stranger);
    assert_err(&env.run(ix, Who::Stranger), "WrongTenant");
    assert_eq!(balance(&env, ata(&env, &deal)), AMOUNT);
}

#[test]
fn recreates_the_tenant_token_account_if_it_was_closed() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    let (tenant, stranger) = (env.tenant.pubkey(), env.stranger.pubkey());
    let tenant_account = ata(&env, &tenant);
    let ixs = [
        spl_token_2022::instruction::transfer_checked(
            &env.token_program,
            &tenant_account,
            &env.mint,
            &ata(&env, &stranger),
            &tenant,
            &[],
            START_BALANCE - AMOUNT,
            DECIMALS,
        )
        .unwrap(),
        spl_token_2022::instruction::close_account(&env.token_program, &tenant_account, &tenant, &tenant, &[]).unwrap(),
    ];
    assert_ok(&env.run_many(&ixs, Who::Tenant));
    assert!(!exists(&env, tenant_account));

    set_time(&mut env.svm, p.deadline + 1);
    let ix = ix_refund(&env, deal, stranger);
    assert_ok(&env.run(ix, Who::Stranger));
    assert_eq!(balance(&env, tenant_account), AMOUNT);
}

#[test]
fn cannot_refund_after_the_handover() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));
    set_time(&mut env.svm, p.deadline + 1);
    let ix = ix_refund(&env, deal, env.landlord.pubkey());
    assert!(env.run(ix, Who::Landlord).is_err());
    assert_eq!(balance(&env, ata(&env, &env.tenant.pubkey())), START_BALANCE - AMOUNT);
}

#[test]
fn cannot_refund_an_unfunded_deal() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = create_deal(&mut env, &p);
    set_time(&mut env.svm, p.deadline + 1);
    let ix = ix_refund(&env, deal, env.landlord.pubkey());
    assert!(env.run(ix, Who::Landlord).is_err());
    assert_eq!(get_deal(&env, deal).status, DealStatus::Open);
}
