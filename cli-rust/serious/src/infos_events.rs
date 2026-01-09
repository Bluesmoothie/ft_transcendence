use std::{
  io::{Write, stdout}, time::Duration,
};

use anyhow::{Result, anyhow};
use serde_json;

use reqwest::{Client};
use tokio_tungstenite::tungstenite::protocol::frame;

use crate::{login::Authentify, welcome::{draw_welcome_screen, game_setup, setup_terminal}};

// use crate::login::{create_guest_session};
use tokio::{net::unix::pipe::Receiver, sync::mpsc};

use crossterm::{
  ExecutableCommand, QueueableCommand, cursor::{self, SetCursorStyle}, event::{self, poll, read, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers, PopKeyboardEnhancementFlags}, style::*, terminal
};
use crate::login::Field;
use crate::LOGO;
use crate::CurrentScreen;
use crate::friends::FriendsDisplay;
use crate::login;
use ratatui::{
    text::Span,
    buffer::Buffer,
    layout::Rect,
    style::Stylize,
    symbols::border,
    text::{Line, Text},
    widgets::{Block, Paragraph, Widget},
    DefaultTerminal, Frame,
};

pub const WIDTH: u16 = 90;
pub const HEIGHT: u16 = 30;

use super::{Infos, should_exit};

pub trait EventHandler {
    fn handle_welcome_events(&mut self) -> Result<()>;
    fn handle_gamechoice_events(&mut self) -> Result<()>;
    fn handle_friends_events(&mut self) -> Result<()>;
    async fn handle_social_events(&mut self) -> Result<()>;
    async fn handle_first_events(&mut self) -> Result<()>;
    async fn handle_signup_events(&mut self) -> Result<()>;
    async fn handle_login_events(&mut self) -> Result<()>;
}

impl EventHandler for Infos {
  fn handle_welcome_events(&mut self) -> Result<()> {
    let event = event::read()?;
    if should_exit(&event)? == true {
      self.exit = true;
    }
    else if let Event::Key(key_event) = event {
      if key_event.kind == KeyEventKind::Press {
          match key_event.code {
              KeyCode::Char('1') => {self.screen = CurrentScreen::GameChoice;},
              KeyCode::Char('2') => {self.screen = CurrentScreen::SocialLife;},
              _ => {},
          }
      }
    }
    Ok(())
  }
  fn handle_gamechoice_events(&mut self) -> Result<()> {
    let event = event::read()?;
    if should_exit(&event)? == true {
      self.exit = true;
    }
    else if let Event::Key(key_event) = event {
      if key_event.kind == KeyEventKind::Press {
          match key_event.code {
              // KeyCode::Char('1') => {self.screen = CurrentScreen::GameChoice;},
              KeyCode::Char('2') => {self.screen = CurrentScreen::CreateGame;},
              KeyCode::Char('4') => {self.screen = CurrentScreen::Welcome;},
              _ => {},
          }
      }
    }
    Ok(())
  }
  async fn handle_first_events(&mut self) -> Result<()> {
    let event = event::read()?;
    if should_exit(&event)? == true {
      self.exit = true;
    }
    else if let Event::Key(key_event) = event {
      if key_event.kind == KeyEventKind::Press {
          match key_event.code {
              KeyCode::Char('1') => {self.screen = CurrentScreen::SignUp;},
              KeyCode::Char('2') => {self.screen = CurrentScreen::Login;},
              KeyCode::Char('3') => {
                self.create_guest_session().await?;
                self.screen = CurrentScreen::Welcome;
              },
              _ => {},
          }
      }
    }
    Ok(())
  }
  async fn handle_social_events(&mut self) -> Result<()> {
    self.get_indexed_friends().await?;
    let event = event::read()?;
    if should_exit(&event)? == true {
        self.exit = true;
    }
    else if let Event::Key(key_event) = event {
        match key_event.code {
        // KeyCode::Char('1') => {display_friends(game_main).await?;},
        KeyCode::Char('1') => {
          self.screen = CurrentScreen::FriendsDisplay
        },
        KeyCode::Char('2') => {
            //chat();
        },
        KeyCode::Char('3') => {self.screen = CurrentScreen::Welcome},
        _ => {},
        }
    }
    Ok(()) 
  }
  async fn handle_signup_events(&mut self) -> Result<()> {
      if poll(Duration::from_millis(500))? == true {
        let event = event::read()?;
        if should_exit(&event)? {
          self.auth.clear();
          self.screen = CurrentScreen::FirstScreen;
        } else if let Event::Key(eventkey) = event {
          match eventkey.code {
            KeyCode::Up => {self.auth.up_field_signup()},
            KeyCode::Down => {self.auth.down_field_signup()},
            KeyCode::Char(c) => {self.auth.add(c)},
            KeyCode::Backspace => {self.auth.pop()},
            KeyCode::Tab => {self.auth.down_field_signup()}
            KeyCode::Enter => {if *self.auth.get_field() == Field::Password {
              self.signup().await?;
              self.screen = CurrentScreen::Welcome;
            } else {self.auth.down_field_signup()}} 
            _ => {},
          }
        }
      }
      self.auth.tick();
      Ok(())
  }
  async fn handle_login_events(&mut self) -> Result<()> {
      if poll(Duration::from_millis(500))? == true {
        let event = event::read()?;
        if should_exit(&event)? {
          self.auth.clear();
          self.screen = CurrentScreen::FirstScreen;
        } else if let Event::Key(eventkey) = event {
          match eventkey.code {
            KeyCode::Up => {self.auth.up_field_login()},
            KeyCode::Down => {self.auth.down_field_login()},
            KeyCode::Char(c) => {self.auth.add(c)},
            KeyCode::Backspace => {self.auth.pop();},
            KeyCode::Tab => {self.auth.down_field_login()},
            KeyCode::Enter => {if *self.auth.get_field() == Field::Totp {
              self.login().await?;
              self.screen = CurrentScreen::Welcome;
              } else {
              self.auth.down_field_login()
              }
            }  
            _ => {},
          }
        }
      }
      self.auth.tick();
      Ok(())
  }
  fn handle_friends_events(&mut self) -> Result<()> {
      let event = event::read()?;
      if should_exit(&event)? == true {
        self.screen = CurrentScreen::SocialLife      
      }
      else if let Event::Key(key_event) = event {
          match key_event.code {
          KeyCode::Char('1') => {
            self.screen = CurrentScreen::AddFriend
          },
          KeyCode::Char('2') => {
            self.screen = CurrentScreen::DeleteFriend
          },
          KeyCode::Right => {if self.index < self.index_max {self.index += 1}},
          KeyCode::Left => {if self.index > usize::MIN {self.index -= 1}},
          _ => {},
          }
      }
      else if let Event::Resize(_, _) = event {
        self.index = 0;
      }
      Ok(())
  }
}