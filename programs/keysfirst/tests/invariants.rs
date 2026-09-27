//! Properties that must hold for every deal, whatever path it takes.
mod common;

use common::*;
use keysfirst::state::DealStatus;

#[derive(Clone, Copy, Debug)]
enum Ending {
    Release,
    RefundAfterDeadline,
    LandlordRefund,
    Cancel,
}

/// All test-token money held by the people involved plus the vault.
fn total(env: &Env, deal: Pubkey) -> u64 {
    let owners = [env.landlord.pubkey(), env.tenant.pubkey(), env.stranger.pubkey(), deal];
    owners.iter().map(|owner| balance(env, ata(env, owner))).sum()
}

#[test]
fn no_money_is_created_or_lost_on_any_path() {
    for ending in [Ending::Release, Ending::RefundAfterDeadline, Ending::LandlordRefund, Ending::Cancel] {
        let mut env = setup();
        let p = DealParams::default();
        let deal = create_deal(&mut env, &p);
        let start = total(&env, deal);

        if !matches!(ending, Ending::Cancel) {
            let ix = ix_fund(&env, deal, env.tenant.pubkey());
            assert_ok(&env.run(ix, Who::Tenant));
            assert_eq!(total(&env, deal), start, "{ending:?}: funding");
        }

        let (ix, who) = match ending {
            Ending::Release => {
                set_time(&mut env.svm, p.move_in);
                (ix_confirm(&env, deal, env.tenant.pubkey()), Who::Tenant)
            }
            Ending::RefundAfterDeadline => {
                set_time(&mut env.svm, p.deadline + 1);
                (ix_refund(&env, deal, env.stranger.pubkey()), Who::Stranger)
            }
            Ending::LandlordRefund => (ix_refund(&env, deal, env.landlord.pubkey()), Who::Landlord),
            Ending::Cancel => (ix_cancel(&env, deal, env.landlord.pubkey()), Who::Landlord),
        };
        assert_ok(&env.run(ix, who));
        assert_eq!(total(&env, deal), start, "{ending:?}: settlement");
        assert!(!exists(&env, ata(&env, &deal)), "{ending:?}: vault must be closed");
    }
}

#[test]
fn the_landlord_is_paid_only_through_the_tenants_signature() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    let landlord_account = ata(&env, &env.landlord.pubkey());

    // Every non-tenant path during the handover window leaves the landlord unpaid.
    set_time(&mut env.svm, p.move_in);
    for who in [Who::Landlord, Who::Stranger] {
        let ix = ix_confirm(&env, deal, env.key(who).pubkey());
        assert!(env.run(ix, who).is_err());
    }
    let ix = ix_refund(&env, deal, env.stranger.pubkey());
    assert!(env.run(ix, Who::Stranger).is_err());
    assert_eq!(balance(&env, landlord_account), 0);

    // After the deadline, the only possible outcome is a refund to the tenant.
    set_time(&mut env.svm, p.deadline + 1);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert!(env.run(ix, Who::Tenant).is_err());
    let ix = ix_refund(&env, deal, env.stranger.pubkey());
    assert_ok(&env.run(ix, Who::Stranger));
    assert_eq!(balance(&env, landlord_account), 0);
    assert_eq!(balance(&env, ata(&env, &env.tenant.pubkey())), START_BALANCE);
}

#[test]
fn each_deal_settles_exactly_once() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));

    set_time(&mut env.svm, p.deadline + 1);
    let attempts = [
        (ix_confirm(&env, deal, env.tenant.pubkey()), Who::Tenant),
        (ix_refund(&env, deal, env.landlord.pubkey()), Who::Landlord),
        (ix_refund(&env, deal, env.stranger.pubkey()), Who::Stranger),
        (ix_cancel(&env, deal, env.landlord.pubkey()), Who::Landlord),
    ];
    for (ix, who) in attempts {
        assert!(env.run(ix, who).is_err(), "{who:?} settled a second time");
    }
    assert_eq!(balance(&env, ata(&env, &env.landlord.pubkey())), AMOUNT);
    assert_eq!(balance(&env, ata(&env, &env.tenant.pubkey())), START_BALANCE - AMOUNT);
    assert_eq!(get_deal(&env, deal).status, DealStatus::Released);
}

#[test]
fn tokens_sent_straight_to_the_vault_are_paid_out_not_stuck() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    let stranger = env.stranger.pubkey();
    let donation = 5 * EUR;
    let ix = spl_token_2022::instruction::transfer_checked(
        &env.token_program,
        &ata(&env, &stranger),
        &env.mint,
        &ata(&env, &deal),
        &stranger,
        &[],
        donation,
        DECIMALS,
    )
    .unwrap();
    assert_ok(&env.run(ix, Who::Stranger));

    set_time(&mut env.svm, p.move_in);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));
    assert_eq!(balance(&env, ata(&env, &env.landlord.pubkey())), AMOUNT + donation);
    assert!(!exists(&env, ata(&env, &deal)));
}

#[test]
fn a_cancelled_deal_passes_stray_tokens_to_the_landlord() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams::default());
    let stranger = env.stranger.pubkey();
    let ix = spl_token_2022::instruction::transfer_checked(
        &env.token_program,
        &ata(&env, &stranger),
        &env.mint,
        &ata(&env, &deal),
        &stranger,
        &[],
        EUR,
        DECIMALS,
    )
    .unwrap();
    assert_ok(&env.run(ix, Who::Stranger));

    let ix = ix_cancel(&env, deal, env.landlord.pubkey());
    assert_ok(&env.run(ix, Who::Landlord));
    assert_eq!(balance(&env, ata(&env, &env.landlord.pubkey())), EUR);
    assert!(!exists(&env, ata(&env, &deal)));
}

#[test]
fn works_with_the_classic_token_program_used_by_eurc() {
    let mut env = setup_with(anchor_spl::token::ID);
    let p = DealParams::default();
    let deal = funded_deal(&mut env, &p);
    set_time(&mut env.svm, p.move_in);
    let ix = ix_confirm(&env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));
    assert_eq!(balance(&env, ata(&env, &env.landlord.pubkey())), AMOUNT);
}
