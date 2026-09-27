mod common;

use common::*;
use keysfirst::state::DealStatus;

#[test]
fn landlord_cancels_an_open_deal() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams::default());
    let ix = ix_cancel(&env, deal, env.landlord.pubkey());
    assert_ok(&env.run(ix, Who::Landlord));
    let d = get_deal(&env, deal);
    assert_eq!(d.status, DealStatus::Cancelled);
    assert_eq!(d.settled_at, T0);
    assert!(!exists(&env, ata(&env, &deal)), "vault is closed");
}

#[test]
fn only_the_landlord_can_cancel() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams::default());
    let ix = ix_cancel(&env, deal, env.stranger.pubkey());
    assert_err(&env.run(ix, Who::Stranger), "NotLandlord");
    assert_eq!(get_deal(&env, deal).status, DealStatus::Open);
}

#[test]
fn a_funded_deal_cannot_be_cancelled() {
    let mut env = setup();
    let deal = funded_deal(&mut env, &DealParams::default());
    let ix = ix_cancel(&env, deal, env.landlord.pubkey());
    assert_err(&env.run(ix, Who::Landlord), "DealNotOpen");
    assert_eq!(balance(&env, ata(&env, &deal)), AMOUNT);
}

#[test]
fn a_cancelled_deal_cannot_be_funded() {
    let mut env = setup();
    let deal = create_deal(&mut env, &DealParams::default());
    let ix = ix_cancel(&env, deal, env.landlord.pubkey());
    assert_ok(&env.run(ix, Who::Landlord));
    let ix = ix_fund(&env, deal, env.tenant.pubkey());
    assert!(env.run(ix, Who::Tenant).is_err());
    assert_eq!(balance(&env, ata(&env, &env.tenant.pubkey())), START_BALANCE);
}
