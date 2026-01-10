use std::{
  io::{Write, stdout},
};

use anyhow::{Result, anyhow};
use serde_json;

use reqwest::{Client};
use crate::infos_events::EventHandler;
use crate::screen_displays::ScreenDisplayer;
use crate::friends::FriendsDisplay;
use crate::game_demo::Demo;
use crate::game::{Game, Gameplay};
use tokio::{sync::mpsc, time::Duration};
use crate::login::Auth;
use crate::infos_events::EventHandler;
use crossterm::{
  event::{self, Event, KeyCode, KeyModifiers}
};

use crate::welcome::LOGO;
use crate::game;

use ratatui::{
    buffer::Buffer,
    layout::Rect,
    widgets::Widget,
    DefaultTerminal, Frame,
};


#[derive(Default)]
pub struct Infos {
  location: String,
  id: u64,
  client: Client,
  pub exit: bool,
  screen: CurrentScreen,
  post_error_screen: CurrentScreen,
  index: usize,
  index_max: usize,
  friends: Vec<String>,
  friend_tmp: String,
  game: Game,
  auth: Auth,
  receiver: Option<mpsc::Receiver<serde_json::Value>>,
  error: String,
  demo: Demo,
}


#[derive(Clone, Copy, PartialEq)]
pub enum CurrentScreen {
  FirstScreen,
  Welcome,
  Login,
  SignUp,
  GameChoice,
  SocialLife,
  CreateGame,
  StartGame,
  PlayGame,
  EndGame,
  FriendsDisplay,
  AddFriend,
  DeleteFriend,
  ErrorScreen,
}


impl Default for CurrentScreen {
  fn default() -> Self {
      CurrentScreen::FirstScreen
  }
}

impl Infos {
  pub fn new(location: String) -> Infos {
    Infos {
      location,
      client: Client::builder().danger_accept_invalid_certs(true).build().expect("Impossible to build new client, try again"),
      ..Default::default()
    }
  }
  pub async fn run(mut self, terminal: &mut DefaultTerminal) -> Result<()> {
    while !self.exit {
        if self.screen == CurrentScreen::FriendsDisplay {
          self.update_friends_index(terminal).await?;
        }
        if let Err(e) = terminal.draw(|frame| self.draw(frame)) {
          self.error(e.to_string());
        }
        match self.screen {
          CurrentScreen::FirstScreen | CurrentScreen::GameChoice | 
            CurrentScreen::SocialLife | CurrentScreen::Welcome => {
              self.demo.update(100, 100);
              if event::poll(Duration::from_millis(16))? {
                if let Err(e) = self.handle_events().await {
                  self.error(e.to_string());
                }
              }
            },
          _ => {
              if let Err(e) = self.handle_events().await {
                  self.error(e.to_string());
              }
            }
        }
    }
    Ok(())
  }
  fn draw(&self, frame: &mut Frame) {
    frame.render_widget(self, frame.area());
  }
  async fn handle_events(&mut self) -> Result<()> {
    match self.screen {
      CurrentScreen::FirstScreen => {self.handle_first_events().await?},
      CurrentScreen::SignUp => {self.handle_signup_events().await?},
      CurrentScreen::Login => {self.handle_login_events().await?},
      CurrentScreen::Welcome => {self.handle_welcome_events()?},
      CurrentScreen::GameChoice => {self.handle_gamechoice_events()?},
      CurrentScreen::SocialLife => {self.handle_social_events().await?},
      CurrentScreen::FriendsDisplay => {self.handle_friends_events()?},
      CurrentScreen::StartGame => {self.launch_game().await?},
      CurrentScreen::EndGame => {self.handle_endgame()?},
      CurrentScreen::CreateGame => {self.create_game("online").await?},
      CurrentScreen::PlayGame => {self.handle_game_events().await?},
      CurrentScreen::ErrorScreen => {self.handle_errors()},
      CurrentScreen::AddFriend => {self.add_friend().await?},
      CurrentScreen::DeleteFriend => {self.delete_friend().await?},
    }
  Ok(())
  }
  pub fn get_location(&self) -> &str {
    &self.location
  }
  pub fn error(&mut self, error: String) {
    self.post_error_screen = self.screen;
    self.error = error;
    self.screen = CurrentScreen::ErrorScreen;
  }
  pub fn handle_errors(&mut self) {
    std::thread::sleep(Duration::from_secs(2));
    self.screen = self.post_error_screen;
  }
  async fn update_friends_index(&mut self, terminal: &mut DefaultTerminal) -> Result<()> {
    self.get_indexed_friends().await?;
    let height: usize = (terminal.get_frame().area().height - 2) as usize;
    let len = self.friends.len();
    let modulo: usize = match height {
      0 => 0,
      _ => match len % height {
          0 => 0,
          _ => 1
        },
    };
    if height < len && height != 0 {
      self.index_max = len / height + modulo;
    } else {
      self.index_max = 0;
    }
    if self.index > self.index_max {
      self.index = 0;
    }
    Ok(())
  }
}

impl Widget for &Infos {
  fn render(self, area: Rect, buf: &mut Buffer) {
    match self.screen {
      CurrentScreen::FirstScreen => {self.display_first_screen(area, buf)},
      CurrentScreen::SignUp => {self.display_signup_screen(area, buf)},
      CurrentScreen::Login => {self.display_login_screen(area, buf)},
      CurrentScreen::Welcome => {self.display_welcome_screen(area, buf)}, 
      CurrentScreen::GameChoice => {self.display_gamechoice_screen(area, buf)}, 
      CurrentScreen::SocialLife => {self.display_social_screen(area, buf)}, 
      CurrentScreen::FriendsDisplay => {self.display_friends_screen(area, buf)},
      CurrentScreen::StartGame => {},
      CurrentScreen::EndGame => {self.display_endgame(area, buf)},
      CurrentScreen::CreateGame => {self.display_waiting_screen(area, buf)},
      CurrentScreen::PlayGame => {self.display_played_game(area, buf)},
      CurrentScreen::ErrorScreen => {self.display_error_screen(area, buf)},
      CurrentScreen::AddFriend => {self.display_addfriends_screen(area, buf)},
      CurrentScreen::DeleteFriend => {self.display_delete_friends_screen(area, buf)},
    }
  }
}
