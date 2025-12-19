use std::{
  io::{Write, stdout},
};

use anyhow::{Result, anyhow};
use serde_json;

use reqwest::{Client};
use tokio_tungstenite::tungstenite::protocol::frame;

use crate::welcome::{draw_welcome_screen, game_setup, setup_terminal};
use crate::game::{create_game};
// use crate::friends::social_life;

use crate::login::{create_guest_session};
use tokio::{net::unix::pipe::Receiver, sync::mpsc};

use thread::{sleep, Duration};

use crossterm::{
  ExecutableCommand, QueueableCommand, cursor::{self, SetCursorStyle}, event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers, PopKeyboardEnhancementFlags}, style::*, terminal
};

use crate::friends::FriendsDisplay;

use crate::LOGO;
use crate::CurrentScreen;
use ratatui::{
    buffer::Buffer,
    layout::Rect,
    style::Stylize,
    symbols::border,
    text::{Line, Text},
    widgets::{Block, Paragraph, Widget},
    DefaultTerminal, Frame,
    text::Span,
};

pub const WIDTH: u16 = 90;
pub const HEIGHT: u16 = 30;

use super::Infos;

pub trait ScreenDisplayer: FriendsDisplay {
    fn display_welcome_screen(&self, area: Rect, buf: &mut Buffer);
    fn display_gamechoice_screen(&self, area: Rect, buf: &mut Buffer);
    fn display_social_screen(&self, area: Rect, buf: &mut Buffer);
    async fn display_friends_screen(&self, area: Rect, buf: &mut Buffer) -> Result<()>;
}

impl ScreenDisplayer for Infos {
    fn display_welcome_screen(&self, area: Rect, buf: &mut Buffer) {
        let instructions = Line::from(vec![
                "1. ".bold(),
                "GAME ".blue(),
                "2. ".bold(),
                "SOCIAL LIFE ".blue(),
                "ESC. ".bold(),
                "Quit".blue(),
        ]);
        print_block(instructions, area, buf);
    }
    fn display_gamechoice_screen(&self, area: Rect, buf: &mut Buffer) {
        let instructions = Line::from(vec![
                "1. ".bold(),
                "LOCAL ".blue(),
                "2. ".bold(),
                "ONLINE ".blue(),
                "4. ".bold(),
                "GO BACK ".blue(),
                "ESC. ".bold(),
                "Quit".blue(),
        ]);
        print_block(instructions, area, buf);
    }
    fn display_social_screen(&self, area: Rect, buf: &mut Buffer) {
     let instructions = Line::from(vec![
            "1. ".bold(),
            "YOUR FRIENDS ".blue(),
            "2. ".bold(),
            "CHAT ".blue(),
            "3. ".bold(),
            "GO BACK ".blue(),
            "ESC. ".bold(),
            "Quit".blue(),
    ]);
        print_block(instructions, area, buf);
    }
    async fn display_friends_screen(&self, area: Rect, buf: &mut Buffer) -> Result<()> {
        let list = self.get_indexed_friends(area, buf).await?;
        let mut spanlist: Vec<Span> = vec![];
        for line in list {
            let newline = line.bold();
            spanlist.push(newline);
        }
        let instructions = Line::from(vec![
            "1. ".bold(),
            "ADD FRIEND ".blue(),
            "2. ".bold(),
            "DELETE FRIEND ".blue(),
            "← ".bold(),
            "Previous ".blue(),
            "→ ".bold(),
            "Next ".blue(),
            "ESC. ".bold(),
            "Quit".blue(),
        ]);
        let block = Block::bordered()
                // .title(Line::from("Your Friends"))
                .title_bottom(instructions.centered())
                .border_set(border::THICK);
        Paragraph::new(Line::from(spanlist))
                .centered()
                .block(block)
                .render(area, buf);
    Ok(())
    }
}

    //     // let menu = format!("Menu: 1. ADD   2. DELETE   3. DM   {} Previous   {} Next    ESC. Back", '←', '→');

fn print_block(instructions: Line, area: Rect, buf: &mut Buffer) {
    let block = Block::bordered()
            .title_bottom(instructions.centered())
            .border_set(border::THICK);
    Paragraph::new(LOGO)
            .centered()
            .block(block)
            .render(area, buf);        
}

// async fn display_friends(game_main: &Infos) -> Result<()> {
//     let mut index: usize = 0;
//     loop {
//         let friends_list = get_friends(game_main).await?;
//         print_friends(&friends_list, &index)?;
//         if (poll(Duration::from_millis(16)))? {
//             let event: Event = event::read()?;
    
//             if (should_exit(&event))? == true {
//                 return Ok(());
//             }
//             else if let Event::Key(key_event) = event {
//                 match key_event.code {
//                     KeyCode::Char('1') => {add_friend(game_main).await?},
//                     KeyCode::Char('2') => {delete_friend(game_main).await?},
//                     KeyCode::Char('3') => {},
//                     KeyCode::Right => {
//                         if index < usize::MAX {
//                             index += 1;
//                         }
//                     },
//                     KeyCode::Left => {if index > 0 {
//                         index -= 1;
//                        }
//                     },
//                     _ => {},
//                 }
//             }
//         }
//     }
// }