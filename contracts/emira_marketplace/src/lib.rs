#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

const ADMIN: Symbol = symbol_short!("ADMIN");

#[contracttype]
#[derive(Clone)]
pub struct Listing {
    pub token_id: u32,
    pub seller: Address,
    pub price_stroops: i128,
    pub active: bool,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Listing(u32),
}

#[contract]
pub struct EmiraMarketplaceContract;

#[contractimpl]
impl EmiraMarketplaceContract {
    pub fn init(env: Env, admin: Address) {
        admin.require_auth();
        env.storage().instance().set(&ADMIN, &admin);
    }

    pub fn list(env: Env, seller: Address, token_id: u32, price_stroops: i128) {
        seller.require_auth();
        let listing = Listing {
            token_id,
            seller: seller.clone(),
            price_stroops,
            active: true,
        };
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
    }

    pub fn cancel(env: Env, seller: Address, token_id: u32) {
        seller.require_auth();
        let mut listing = Self::get_listing(env.clone(), token_id);
        if listing.seller != seller {
            panic!("seller mismatch");
        }
        listing.active = false;
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
    }

    pub fn mark_sold(env: Env, buyer: Address, token_id: u32) {
        buyer.require_auth();
        let mut listing = Self::get_listing(env.clone(), token_id);
        if !listing.active {
            panic!("listing inactive");
        }
        listing.active = false;
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
    }

    pub fn get_listing(env: Env, token_id: u32) -> Listing {
        env.storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .unwrap_or(Listing {
                token_id,
                seller: env.current_contract_address(),
                price_stroops: 0,
                active: false,
            })
    }
}
