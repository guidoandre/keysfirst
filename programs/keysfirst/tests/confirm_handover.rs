mod common;

use common::*;
use keysfirst::state::DealStatus;

#[test]
fn tenant_confirmation_pays_the_landlord_and_closes_the_vault() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in);
    let landlord = env.landlord.pubkey();
    let vault = ata(&env, &deal);
    let vault_rent = lamports(&env, vault);
    let landlord_sol = lamports(&env, landlord);

    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));

    let d = get_deal(&env, deal);
    assert_eq!(d.status, DealStatus::Released);
    assert_eq!(d.settled_at, p.move_in);
    assert_eq!(balance(&env, ata(&env, &landlord)), AMOUNT);
    assert!(!exists(&env, vault), "vault is closed");
    assert_eq!(lamports(&env, landlord), landlord_sol + vault_rent, "vault rent goes back to the landlord");
}

#[test]
fn handover_opens_24_hours_before_move_in() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in - DAY);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));
}

#[test]
fn handover_is_rejected_earlier_than_24_hours_before_move_in() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in - DAY - 1);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_err(&env.run(ix, Who::Tenant), "HandoverNotOpenYet");
}

#[test]
fn handover_is_allowed_exactly_at_the_deadline() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.deadline);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));
}

#[test]
fn handover_is_rejected_after_the_deadline() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.deadline + 1);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_err(&env.run(ix, Who::Tenant), "DeadlinePassed");
}

#[test]
fn only_the_tenant_can_confirm() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in);
    for who in [Who::Landlord, Who::Stranger] {
        let ix = ix_confirm(&env, deal, env.key(who).pubkey());
        assert_err(&env.run(ix, who), "NotTenant");
    }
    assert_eq!(balance(&env, ata(&env, &deal)), AMOUNT);
}

#[test]
fn cannot_confirm_before_the_deal_is_funded() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = create_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_err(&env.run(ix, Who::Tenant), "NotTenant");
}

#[test]
fn cannot_confirm_twice() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert!(env.run(ix, Who::Tenant).is_err());
    assert_eq!(balance(&env, ata(&env, &env.landlord.pubkey())), AMOUNT);
}

#[test]
fn recreates_the_landlord_token_account_if_it_was_closed() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    let landlord = env.landlord.pubkey();
    let landlord_account = ata(&env, &landlord);
    let close =
        spl_token_2022::instruction::close_account(&env.token_program, &landlord_account, &landlord, &landlord, &[])
            .unwrap();
    assert_ok(&env.run(close, Who::Landlord));
    assert!(!exists(&env, landlord_account));

    set_time(&mut env.svm, p.move_in);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));
    assert_eq!(balance(&env, landlord_account), AMOUNT);
}
