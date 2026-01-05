use std::{collections::HashMap, time::Duration};

use reqwest::{Client};
use anyhow::{Result, anyhow};

use tokio_tungstenite::{
    Connector, MaybeTlsStream, WebSocketStream, connect_async_tls_with_config, tungstenite::{http::response, protocol::Message}
};
use crate::Infos;
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use futures_util::{StreamExt};

#[derive(Default, PartialEq)]
pub enum Field {
    #[default]
    Mail,
    Username,
    Password,
}

#[derive(Default)]
pub struct Auth {
    token: String,
    email: String,
    password: String,
    username: String,
    field: Field,
    blink: bool,
}

impl Auth {
    pub fn up_field(&mut self) {
        match self.field {
            Field::Mail => {},
            Field::Password => {self.field = Field::Username},
            Field::Username => {self.field = Field::Mail},
        }
    }
    pub fn down_field(&mut self) {
        match self.field {
            Field::Mail => {self.field = Field::Username},
            Field::Password => {},
            Field::Username => {self.field = Field::Password},
        }
    }
    pub fn add(&mut self, c: char) {
        match self.field {
            Field::Mail => {if self.email.len() < 50 {self.email.push(c)};},
            Field::Password => {if self.password.len() < 50 {self.password.push(c)};},
            Field::Username => {if self.username.len() < 50 {self.username.push(c);}},
        }        
    }
    pub fn pop(&mut self) {
        match self.field {
            Field::Mail => {self.email.pop();},
            Field::Password => {self.password.pop();},
            Field::Username => {self.username.pop();},
        }        
    }
    pub fn get_token(&self) -> &str {
        &self.token
    }
    pub fn get_email(&self) -> &str {
        &self.email
    }
    pub fn get_password(&self) -> &str {
        &self.password
    }
    pub fn get_username(&self) -> &str {
        &self.username
    }
    pub fn get_field(&self) -> &Field {
        &self.field
    }
    pub fn tick(&mut self) {
        self.blink = !self.blink;
    }
    pub fn blinks(&self, field: Field) -> bool {
        if self.blink && field == self.field {
            true
        } else {
            false
        }
    }
    pub fn clear(&mut self) {
        self.email.clear();
        self.password.clear();
        self.username.clear();
        self.field = Field::Mail;
    }
}

pub trait Authentify {
    async fn signup(&mut self) -> Result<()>;
}

impl Authentify for Infos {
    async fn signup(&mut self) -> Result<()> {
        let apiloc = format!("https://{}/api/user/create", self.location);
        let mut body: HashMap<&str, &str> = HashMap::new();
        body.insert("username", self.auth.get_email());
        body.insert("passw", self.auth.get_password());
        body.insert("email", self.auth.get_email());
        let response = self.client.post(apiloc)
                                                .header("content-type", "application/json")
                                                .json(&body)
                                                .send()
                                                .await?;
        let response: serde_json::Value = response.json().await?;
        eprintln!("{}", response);
        std::thread::sleep(Duration::from_secs(5));
        Ok(())
    }
}

// headers: { 'content-type': 'application/json' },
// 	body: JSON.stringify({
// 		username: "<username>",
// 		passw: "<password>",
// 		email: "<email>"
// 	})

pub async fn create_guest_session(location: &String) -> 
                                        Result<(u64, Client, mpsc::Receiver<serde_json::Value>)> {
    let apiloc = format!("https://{location}/api/user/create_guest");
    let client = Client::builder()
        .danger_accept_invalid_certs(true)
        .build()?;
    let res = client.post(apiloc)
        .send()
        .await?;

    let value: serde_json::Value = res.json().await?;
    let value = match value["token"].as_str(){
            Some(nbr) => nbr,
            _ => return Err(anyhow!("Error creating guest session")),
        };
    let apiloc = format!("https://{location}/api/user/get_profile_token");
    let mut body = HashMap::new();
    body.insert("token", value);
    let res = client.post(apiloc)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await?;
    let value: serde_json::Value = res.json().await?;
    let player_id = match value["id"].as_u64(){
        Some(nbr) => nbr,
        _ => return Err(anyhow!("Error from server, no data received")),
    };
    let receiver = enter_chat_room(location, player_id).await?;
    Ok((player_id, client, receiver))
}

async fn enter_chat_room(location: &String, id: u64) -> Result<mpsc::Receiver<serde_json::Value>> {
    let connector = Connector::NativeTls(
			native_tls::TlsConnector::builder()
				.danger_accept_invalid_certs(true)
				.build()?
		);

	let request = format!("wss://{}/api/chat?userid={}", location, id);
	let (ws_stream, _) = connect_async_tls_with_config(
			request,
			None,
			false,
			Some(connector),
			)
            .await?;

    let (sender, receiver): (mpsc::Sender<serde_json::Value>, mpsc::Receiver<serde_json::Value>)  = mpsc::channel(1024);
    tokio::spawn(async move {
        chat(ws_stream, sender).await.unwrap();
    });
    Ok(receiver)
}

async fn   chat(mut ws_stream: WebSocketStream<MaybeTlsStream<TcpStream>>, sender: mpsc::Sender<serde_json::Value>) -> Result<()> {
    while let Some(msg) =  ws_stream.next().await {
        let last_message = match msg {
            Ok(result) => match result {
                Message::Text(result) => result,
                _ => {continue;},
            },
            _ => {continue;},
        };
        let message: serde_json::Value = serde_json::from_str(&last_message.as_str())?;
        
        let _ = match message["gameId"].as_str() {
            Some(_) => {sender.send(message).await?},
            _ => {continue;}
        };
    }
    Ok(())
}

/*
Send message in 
Send -> JSON contenanet user name, message, isCmd

*/