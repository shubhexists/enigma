
use std::fmt;

#[derive(Debug)]
pub enum Error {
    MissingConfig(&'static str),
    PaymentSetup(String),
    Request(String),
    Response(String),
    Parse(String),
}

impl fmt::Display for Error {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Error::MissingConfig(field) => {
                write!(f, "Missing required config field: {}", field)
            }
            Error::PaymentSetup(msg) => write!(f, "Payment setup error: {}", msg),
            Error::Request(msg) => write!(f, "Request error: {}", msg),
            Error::Response(msg) => write!(f, "Response error: {}", msg),
            Error::Parse(msg) => write!(f, "Parse error: {}", msg),
        }
    }
}

impl std::error::Error for Error {}

pub type Result<T> = std::result::Result<T, Error>;
