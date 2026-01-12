mod welcome;
mod game;
mod friends;
mod infos_events;
mod screen_displays;
mod game_demo;
mod login;
use std::rc::Rc;
use std::cell::{Cell, RefCell};
use crate::infos_events::EventHandler;
use crate::screen_displays::ScreenDisplayer;
use crate::friends::{Friends};
use crate::game_demo::Demo;
use crate::game::{Game, Gameplay};
use crate::login::Auth;
use anyhow::{Result, anyhow};
use serde_json;
// use console_subscriber;
use reqwest::{Client};
use tokio::{sync::mpsc, time::Duration};
use crossterm::event::{self, Event, KeyCode, KeyModifiers};
use welcome::LOGO;
use ratatui::{
    buffer::Buffer,
    layout::Rect,
    widgets::Widget,
    DefaultTerminal, Frame,
};

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

pub struct Context {
  location: String,
  // id: u64,
  client: Client,
}

impl Context {
  pub fn new(location: String) -> Self {
    Context {
      location: location,
      client: Client::builder()
                      .danger_accept_invalid_certs(true)
                      .build()
                      .expect("Impossible to build new client, try again"),
    }
  }
}

impl Default for Context {
  fn default() -> Self {
    Context {
      location: String::new(),
      client: Client::builder()
                      .danger_accept_invalid_certs(true)
                      .build()
                      .expect("Impossible to build new client, try again"),
    }
  }
}

#[derive(Default)]
pub struct Infos {
  context: Rc<Context>,
  authent: Rc<RefCell<Auth>>,
  friend: Rc<RefCell<Friends>>,
  screen: Rc<Cell<CurrentScreen>>,
  game: Game,
  exit: bool,
  post_error_screen: CurrentScreen,
  error: String,
  demo: Demo,
  // receiver: Option<mpsc::Receiver<serde_json::Value>>,
}

#[tokio::main]
async fn main() -> Result<()> {
  // console_subscriber::init();
  let location = match get_location() {
    Ok(result) => result,
    Err(e) => {return Err(anyhow!("{}", e));},
  };
  let context = Rc::new(Context::new(location.clone()));
  let auth = Rc::new(RefCell::new(Auth::new(Rc::clone(&context))));
  let screen = Rc::new(Cell::new(CurrentScreen::default()));
  let friends = Rc::new(RefCell::new(Friends::new(Rc::clone(&context), Rc::clone(&auth), Rc::clone(&screen))));
  let mut terminal = ratatui::init();
  let game_main = Infos::new(context, auth, screen, friends);
  let app_result = game_main.run(&mut terminal).await;
  ratatui::restore();
  app_result
}

impl Default for CurrentScreen {
  fn default() -> Self {
      CurrentScreen::FirstScreen
  }
}

impl Infos {
  pub fn new(context: Rc<Context>, auth: Rc<RefCell<Auth>>, 
      screen: Rc<Cell<CurrentScreen>>, friends: Rc<RefCell<Friends>>) -> Infos {
    Infos {
      context: context,
      authent: auth,
      screen: screen,
      friend: friends,
      ..Default::default()
    }
  }
  pub async fn run(mut self, terminal: &mut DefaultTerminal) -> Result<()> {
    while !self.exit {
        if self.screen.get() == CurrentScreen::FriendsDisplay {
          self.friend.borrow_mut().update_friends_index(terminal).await?;
        }
        if let Err(e) = terminal.draw(|frame| self.draw(frame)) {
          self.error(e.to_string());
        }
        match self.screen.get() {
          CurrentScreen::FirstScreen | CurrentScreen::GameChoice | 
            CurrentScreen::SocialLife | CurrentScreen::Welcome => {
              self.demo.update();
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
    match self.screen.get() {
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
      CurrentScreen::ErrorScreen => {self.handle_errors().await},
      CurrentScreen::AddFriend => {self.friend.borrow_mut().add_friend().await?},
      CurrentScreen::DeleteFriend => {self.friend.borrow_mut().delete_friend().await?},
    }
  Ok(())
  }
  pub fn get_context(&self) -> &Context {
    &self.context
  }
  pub fn error(&mut self, error: String) {
    self.post_error_screen = self.screen.get();
    self.error = error;
    self.screen.set(CurrentScreen::ErrorScreen);
  }
  async fn handle_errors(&mut self) {
    std::thread::sleep(Duration::from_secs(2));
    self.screen.set(self.post_error_screen);
  }
}

impl Widget for &Infos {
  fn render(self, area: Rect, buf: &mut Buffer) {
    match self.screen.get() {
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

fn get_location() -> Result<String> {
    let mut args = std::env::args();
    args.next();
    let first = match args.next() {
        Some(addr) => addr,
        _ => {
            return Err(anyhow!("no argument provided"));
        }
    };
    Ok(first)
}

pub fn should_exit(event: &Event) -> Result<bool> {
  if let Event::Key(key_event) = event {
    if key_event.code == KeyCode::Esc || 
    (key_event.code == KeyCode::Char('c') 
    && key_event.modifiers == KeyModifiers::CONTROL) {
      return Ok(true);
    }
  }
  Ok(false)
}
