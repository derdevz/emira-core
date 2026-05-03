#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address, Env, Symbol,
};

const ADMIN: Symbol = symbol_short!("ADMIN");
const SETTLE: Symbol = symbol_short!("SETTLE");
const MINPRC: Symbol = symbol_short!("MINPRC");
const INITT: Symbol = symbol_short!("INITT");

#[contracttype]
#[derive(Clone, Eq, PartialEq, Debug)]
pub enum ListingStatus {
    Listed,
    Sold,
    Cancelled,
}

#[contracttype]
#[derive(Clone)]
pub struct Listing {
    pub token_id: u32,
    pub seller: Address,
    pub price_stroops: i128,
    pub status: ListingStatus,
    pub buyer: Option<Address>,
    pub listed_ledger: u32,
    pub updated_ledger: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct MarketplaceConfig {
    pub admin: Address,
    pub settlement_operator: Address,
    pub min_price_stroops: i128,
    pub settlement_asset: Symbol,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Listing(u32),
}

#[contracterror]
#[derive(Copy, Clone, Eq, PartialEq)]
#[repr(u32)]
pub enum MarketplaceError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidPrice = 3,
    ListingAlreadyActive = 4,
    ListingNotFound = 5,
    Unauthorized = 6,
    ListingInactive = 7,
    InvalidStatusTransition = 8,
}

#[contract]
pub struct EmiraMarketplaceContract;

#[contractimpl]
impl EmiraMarketplaceContract {
    pub fn init(env: Env, admin: Address, settlement_operator: Address, min_price_stroops: i128) {
        admin.require_auth();
        if env.storage().instance().has(&INITT) {
            panic_with_error!(&env, MarketplaceError::AlreadyInitialized);
        }
        if min_price_stroops <= 0 {
            panic_with_error!(&env, MarketplaceError::InvalidPrice);
        }

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&SETTLE, &settlement_operator);
        env.storage().instance().set(&MINPRC, &min_price_stroops);
        env.storage().instance().set(&INITT, &true);
        env.events().publish(
            (symbol_short!("market"), symbol_short!("init")),
            (admin, settlement_operator, min_price_stroops, symbol_short!("XLM")),
        );
    }

    pub fn list(env: Env, seller: Address, token_id: u32, price_stroops: i128) {
        seller.require_auth();
        Self::require_initialized(&env);
        if price_stroops < Self::min_price(env.clone()) {
            panic_with_error!(&env, MarketplaceError::InvalidPrice);
        }

        let existing = Self::get_listing(env.clone(), token_id);
        if existing.status == ListingStatus::Listed {
            panic_with_error!(&env, MarketplaceError::ListingAlreadyActive);
        }

        let ledger = env.ledger().sequence();
        let listing = Listing {
            token_id,
            seller: seller.clone(),
            price_stroops,
            status: ListingStatus::Listed,
            buyer: None,
            listed_ledger: ledger,
            updated_ledger: ledger,
        };
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
        env.events().publish(
            (symbol_short!("market"), symbol_short!("list")),
            (token_id, seller, price_stroops),
        );
    }

    pub fn update_price(env: Env, seller: Address, token_id: u32, next_price_stroops: i128) {
        seller.require_auth();
        Self::require_initialized(&env);
        if next_price_stroops < Self::min_price(env.clone()) {
            panic_with_error!(&env, MarketplaceError::InvalidPrice);
        }

        let mut listing = Self::require_listing(env.clone(), token_id);
        if listing.seller != seller {
            panic_with_error!(&env, MarketplaceError::Unauthorized);
        }
        if listing.status != ListingStatus::Listed {
            panic_with_error!(&env, MarketplaceError::ListingInactive);
        }

        listing.price_stroops = next_price_stroops;
        listing.updated_ledger = env.ledger().sequence();
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
        env.events().publish(
            (symbol_short!("market"), symbol_short!("price")),
            (token_id, next_price_stroops),
        );
    }

    pub fn cancel(env: Env, actor: Address, token_id: u32) {
        actor.require_auth();
        Self::require_initialized(&env);

        let mut listing = Self::require_listing(env.clone(), token_id);
        if listing.status != ListingStatus::Listed {
            panic_with_error!(&env, MarketplaceError::ListingInactive);
        }
        if listing.seller != actor && actor != Self::admin(env.clone()) && actor != Self::settlement_operator(env.clone()) {
            panic_with_error!(&env, MarketplaceError::Unauthorized);
        }

        listing.status = ListingStatus::Cancelled;
        listing.updated_ledger = env.ledger().sequence();
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
        env.events().publish(
            (symbol_short!("market"), symbol_short!("cancel")),
            (token_id, actor),
        );
    }

    pub fn mark_sold(env: Env, operator: Address, buyer: Address, token_id: u32, sold_price_stroops: i128) {
        operator.require_auth();
        buyer.require_auth();
        Self::require_initialized(&env);

        if operator != Self::admin(env.clone()) && operator != Self::settlement_operator(env.clone()) {
            panic_with_error!(&env, MarketplaceError::Unauthorized);
        }
        if sold_price_stroops <= 0 {
            panic_with_error!(&env, MarketplaceError::InvalidPrice);
        }

        let mut listing = Self::require_listing(env.clone(), token_id);
        if listing.status != ListingStatus::Listed {
            panic_with_error!(&env, MarketplaceError::ListingInactive);
        }

        listing.status = ListingStatus::Sold;
        listing.price_stroops = sold_price_stroops;
        listing.buyer = Some(buyer.clone());
        listing.updated_ledger = env.ledger().sequence();
        env.storage().persistent().set(&DataKey::Listing(token_id), &listing);
        env.events().publish(
            (symbol_short!("market"), symbol_short!("sold")),
            (token_id, listing.seller, buyer, sold_price_stroops),
        );
    }

    pub fn get_listing(env: Env, token_id: u32) -> Listing {
        env.storage()
            .persistent()
            .get(&DataKey::Listing(token_id))
            .unwrap_or(Listing {
                token_id,
                seller: env.current_contract_address(),
                price_stroops: 0,
                status: ListingStatus::Cancelled,
                buyer: None,
                listed_ledger: 0,
                updated_ledger: 0,
            })
    }

    pub fn get_config(env: Env) -> MarketplaceConfig {
        Self::require_initialized(&env);
        MarketplaceConfig {
            admin: Self::admin(env.clone()),
            settlement_operator: Self::settlement_operator(env.clone()),
            min_price_stroops: Self::min_price(env),
            settlement_asset: symbol_short!("XLM"),
        }
    }

    pub fn admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&ADMIN)
            .unwrap_or_else(|| panic_with_error!(&env, MarketplaceError::NotInitialized))
    }

    pub fn settlement_operator(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&SETTLE)
            .unwrap_or_else(|| panic_with_error!(&env, MarketplaceError::NotInitialized))
    }

    pub fn min_price(env: Env) -> i128 {
        env.storage()
            .instance()
            .get(&MINPRC)
            .unwrap_or_else(|| panic_with_error!(&env, MarketplaceError::NotInitialized))
    }

    fn require_initialized(env: &Env) {
        if !env.storage().instance().has(&INITT) {
            panic_with_error!(env, MarketplaceError::NotInitialized);
        }
    }

    fn require_listing(env: Env, token_id: u32) -> Listing {
        let listing = Self::get_listing(env.clone(), token_id);
        if listing.price_stroops == 0 {
            panic_with_error!(&env, MarketplaceError::ListingNotFound);
        }
        listing
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn lifecycle_works() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(EmiraMarketplaceContract, ());
        let client = EmiraMarketplaceContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let operator = Address::generate(&env);
        let seller = Address::generate(&env);
        let buyer = Address::generate(&env);

        client.init(&admin, &operator, &1000);
        client.list(&seller, &7, &2500);
        let listing = client.get_listing(&7);
        assert_eq!(listing.status, ListingStatus::Listed);

        client.mark_sold(&operator, &buyer, &7, &2500);
        let sold = client.get_listing(&7);
        assert_eq!(sold.status, ListingStatus::Sold);
        assert_eq!(sold.buyer, Some(buyer));
    }
}
