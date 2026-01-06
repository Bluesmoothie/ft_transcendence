use std::{
  io::{Write, stdout},
};

use anyhow::{Result, anyhow};
use serde_json;
use crossterm::event::poll;
use reqwest::{Client};
use tokio_tungstenite::tungstenite::{http::response, protocol::frame};

use crate::infos_events::EventHandler;
use crate::screen_displays::ScreenDisplayer;
use crate::welcome::{draw_welcome_screen, game_setup, setup_terminal};
// use crate::game::{create_game};
// use crate::friends::social_life;

// use crate::login::{create_guest_session};
use tokio::{net::unix::pipe::Receiver, sync::mpsc};
use crate::CurrentScreen;
use std::time::Duration;
use crossterm::{
  ExecutableCommand, QueueableCommand, cursor::{self, SetCursorStyle}, event::{self, Event, KeyCode, KeyEvent, KeyEventKind, KeyModifiers, PopKeyboardEnhancementFlags}, style::*, terminal
};

use std::collections::HashMap;


use crate::LOGO;
use super::{should_exit, Infos};

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

pub trait FriendsDisplay {
    async fn get_indexed_friends(&mut self) -> Result<()>;
    async fn add_friend(&mut self) -> Result<()>;
    async fn delete_friend(&mut self) -> Result<()>;
    async fn send_friend_request(&mut self) -> Result<()>;
    async fn send_delete_friend_request(&mut self) -> Result<()>;
    async fn get_id(&self) -> Result<i64>;
    async fn get_all_friends(&self) -> Result<Vec<(String, bool)>>;
    // fn print_friends(&self, area: Rect, buf: &mut Buffer, friends: &Vec<(String, bool)>) -> Result<Vec<String>>;
}

impl FriendsDisplay for Infos  {
    async fn get_indexed_friends(&mut self) -> Result<()> {
        let friends = self.get_all_friends().await?;
        // eprintln!("friends: {:?}", friends);
        // std::thread::sleep(Duration::from_secs(3));
        let mut printable: Vec<String> = vec![];
        let mut i: usize = 0;
        if self.index * 10 < friends.len() {
            let mut str_tmp: String = String::new();
            for element in &friends[self.index * 10..] {
                if (self.index * 10 + i) as usize > friends.len() || i > 9 {
                    break;
                } else {
                    str_tmp = element.0.clone();
                    if element.1 == false {
                        str_tmp = str_tmp + " (Pending)";
                    }
                }
                printable.push(str_tmp);
                i += 1;
            }
        }
        if i == 10 && friends.len() > self.index * 10 + i {
            printable.push("...".to_string());
        }
        self.friends = printable;
        Ok(())
    }
    async fn add_friend(&mut self) -> Result<()> {
        if poll(Duration::from_millis(500))? == true {
        let event = event::read()?;
        if should_exit(&event)? {
          self.friend_tmp.clear();
          self.get_indexed_friends().await?;
          self.screen = CurrentScreen::FriendsDisplay;
        } else if let Event::Key(eventkey) = event {
          match eventkey.code {
                KeyCode::Backspace => {self.friend_tmp.pop();},
                KeyCode::Char(c) => {self.friend_tmp.push(c)},
                KeyCode::Enter => {
                    self.send_friend_request().await?;
                    self.get_indexed_friends().await?;
                },
                _ => {},
                }
            }
        }
        Ok(())
    }
    async fn delete_friend(&mut self) -> Result<()> {
        if poll(Duration::from_millis(500))? == true {
        let event = event::read()?;
        if should_exit(&event)? {
          self.friend_tmp.clear();
          self.get_indexed_friends().await?;
          self.screen = CurrentScreen::FriendsDisplay;
        } else if let Event::Key(eventkey) = event {
          match eventkey.code {
                KeyCode::Backspace => {self.friend_tmp.pop();},
                KeyCode::Char(c) => {self.friend_tmp.push(c)},
                KeyCode::Enter => {
                    self.send_delete_friend_request().await?;
                    self.get_indexed_friends().await?;
                },
                _ => {},
                }
            }
        }
        Ok(())
    }
    async fn send_friend_request(&mut self) -> Result<()> {
        let mut map = HashMap::new();
        map.insert("token", self.auth.get_token());
        let id = self.get_id().await?.to_string();
        map.insert("friend_id", &id);
        let url = format!("https://{}/api/friends/send_request", self.location);
        let response = self.client
            .post(url)
            .header("content-type", "application/json")
            .json(&map)
            .send()
            .await?;
        self.friend_tmp.clear();
        match response.status().as_u16() {
            200 => {self.screen = CurrentScreen::FriendsDisplay;},
            _ => {let message: serde_json::Value = response.json().await?;
                if let Some(message) = message["message"].as_str() {
                    self.error(message.to_string());
                }
            },
        }
        Ok(())
    }
    async fn send_delete_friend_request(&mut self) -> Result<()> {
        let mut map = HashMap::new();
        map.insert("token", self.auth.get_token());
        let id = self.get_id().await?.to_string();
        map.insert("friend_id", &id);
        let url = format!("https://{}/api/friends/remove", self.location);
        let response = self.client
            .delete(url)
            .header("content-type", "application/json")
            .json(&map)
            .send()
            .await?;
        self.friend_tmp.clear();
        match response.status().as_u16() {
            200 => {self.screen = CurrentScreen::FriendsDisplay;},
            _ => {let message: serde_json::Value = response.json().await?;
                if let Some(message) = message["message"].as_str() {
                    self.error(message.to_string());
                }
            },
        }
        Ok(())
    }
    async fn get_id(&self) -> Result<i64> {
        let result: i64;
        let apiloc = format!("https://{}/api/user/get_profile_name?profile_name={}", self.location, self.friend_tmp);
        let response = self.client
            .get(apiloc)
            .send()
            .await?;
        let response: serde_json::Value = response.json().await?;
        match response["id"].as_i64() {
            Some(id) => result = id,
            _ => {return Err(anyhow::anyhow!("Friend not found"))}
        }
        // eprintln!("{:?}", response);
        // std::thread::sleep(Duration::from_secs(5));
        Ok(result)
    }
    // fn print_friends(&self, area: Rect, buf: &mut Buffer, friends: &Vec<(String, bool)>) -> Result<Vec<String>> {
    //     let mut printable: Vec<String> = vec![];
    //     let mut i: usize = 0;
    //     if self.index * 10 < friends.len() {
    //         let mut str_tmp: String = String::new();
    //         for element in &friends[self.index * 10..] {
    //             if (self.index * 10 + i) as usize > friends.len() || i > 9 {
    //                 break;
    //             } else {
    //                 str_tmp = element.0.clone();
    //                 if element.1 == false {
    //                     str_tmp = str_tmp + " (Pending)";
    //                 }
    //             }
    //             printable.push(str_tmp);
    //             i += 1;
    //         }
    //     }
    //     if i == 10 && friends.len() > self.index * 10 + i {
    //         printable.push("...".to_string());
    //         // stdout()
    //         //     .queue(cursor::MoveTo(4, 24))?
    //         //     .queue(Print("..."))?;

    //     }


    //     // let menu = format!("Menu: 1. ADD   2. DELETE   3. DM   {} Previous   {} Next    ESC. Back", '←', '→');
    //     // stdout()
    //     //     .queue(cursor::MoveTo(2, HEIGHT - 1))?
    //     //     .queue(Print(menu))?;
    //     // stdout().flush()?;
    //     Ok(printable)
    // }
    async fn get_all_friends(&self) -> Result<Vec<(String, bool)>> {
        let url = format!("https://{}/api/friends/get?user_id={}", self.location, self.id);
        let response = self.client
            .get(url)
            .send()
            .await?;
        let mut result: Vec<(String, bool)> = vec![];
        match response.status().as_u16() {
            200 => {
                let response_array: serde_json::Value = response.json().await?;
                // println!("friends: {}", response_array);
                if response_array.is_array() {
                    let response_array = match response_array.as_array() {
                        Some(array) => array,
                        _ => {return Err(anyhow::anyhow!("empty array"));}
                    };
                    for object in response_array {
                        let map = match object.as_object() {
                            Some(map) => map,
                            _ => {continue;},
                        };
                        let name = look_for_name(&self, object).await?;
                        match map["pending"].as_u64() {
                        Some(0) => {
                            result.push((name, true));
                        }
                        Some(1) => {
                            result.push((name, false));
                        },
                        _ => {}, 
                        }
                        
                    }
                    // sleep(Duration::from_secs(3));
                }

            },
            404 => {eprintln!("No friends found :(");},
            _ => {eprintln!("Error from server :(");}
        }
        Ok(result)
    }
}

async fn get_all_friends(game_main: &Infos) -> Result<Vec<(String, bool)>> {
    let url = format!("https://{}/api/friends/get?user_id={}", game_main.location, game_main.id);
    let response = game_main.client
        .get(url)
        .send()
        .await?;
    let mut result: Vec<(String, bool)> = vec![];
    match response.status().as_u16() {
        200 => {
            let response_array: serde_json::Value = response.json().await?;
            // println!("friends: {}", response_array);
            if response_array.is_array() {
                let response_array = match response_array.as_array() {
                    Some(array) => array,
                    _ => {return Err(anyhow::anyhow!("empty array"));}
                };
                for object in response_array {
                    let map = match object.as_object() {
                        Some(map) => map,
                        _ => {continue;},
                    };
                    let name = look_for_name(game_main, object).await?;
                    match map["pending"].as_u64() {
                    Some(0) => {
                        result.push((name, true));
                    }
                    Some(1) => {
                        result.push((name, false));
                    },
                    _ => {}, 
                    }
                    
                }
                // sleep(Duration::from_secs(3));
            }

        },
        404 => {eprintln!("No friends found :(");},
        _ => {eprintln!("Error from server :(");}
    }
    Ok(result)
}

async fn look_for_name(game_main: &Infos, object: &serde_json::Value) -> Result<String> {
    let id_to_find = match object["user1_id"].as_u64() {
        Some(user1) => {
            if user1 != game_main.id {
            user1
            } else {
                let user2 = match object["user2_id"].as_u64() {
                    Some(user2) => {
                        if user2 != game_main.id {
                            user2
                        } else {
                            return Err(anyhow::anyhow!("from user ids"));
                        }
                    }
                    _ => {return Err(anyhow::anyhow!("from user ids"));}
                };
                user2
            }
        },
        _ => {return Err(anyhow::anyhow!("from user ids"));}
    };
    
    let url = format!("https://{}/api/user/get_profile_id?user_id={}", game_main.location, id_to_find);
    let response = game_main.client
        .get(url)
        .send()
        .await?;
    match response.status().as_u16() {
        200 => {
            let body: serde_json::Value = response.json().await?;
            match body["name"].as_str() {
                Some(name) => {return Ok(name.to_string());},
                _ => {return Err(anyhow::anyhow!("No name in "))}
            }
        },
        _ => {return Err(anyhow::anyhow!("Error"));},
    }
}



// async fn delete_friend(game_main: &Infos) -> Result<()> {
//     set_display_friend_adding()?;
//     let mut friend_name = String::new();
//     loop {
//         let event = event::read()?;
        
//         if should_exit(&event)? == true {
//             stdout().execute(Hide)?;
//             return Ok(());
//         }
//         else if let Event::Key(key_event) = event {
//             match key_event.code {
//                 KeyCode::Char(c) => {
//                     let (x, _) = position()?;
//                     if x < WIDTH - 1 {
//                         stdout().execute(Print(c))?;
//                         friend_name.push(c);
//                     }
//                 }
//                 KeyCode::Backspace => {
//                     let (x, _) = position()?;
//                     if x > 19 {
//                         stdout()
//                             .queue(MoveLeft(1))?
//                             .queue(Print(" "))?
//                             .queue(MoveLeft(1))?;
//                         stdout().flush()?;
//                         friend_name.pop();
//                     }
//                 }
//                 KeyCode::Enter => {
//                     stdout().execute(Hide)?;
//                     break;
//                 },
//                 _ => {}
//             }
//         }
//     } 
//     send_delete_request(game_main, friend_name).await?;
//     Ok(())
// }

// async fn add_friend(game_main: &Infos) -> Result<()> {
//     set_display_friend_adding()?;
//     let mut friend_name = String::new();
//     loop {
//         let event = event::read()?;
        
//         if should_exit(&event)? == true {
//             stdout().execute(Hide)?;
//             return Ok(());
//         }
//         else if let Event::Key(key_event) = event {
//             match key_event.code {
//                 KeyCode::Char(c) => {
//                     let (x, _) = position()?;
//                     if x < WIDTH - 1 {
//                         stdout().execute(Print(c))?;
//                         friend_name.push(c);
//                     }
//                 }
//                 KeyCode::Backspace => {
//                     let (x, _) = position()?;
//                     if x > 19 {
//                         stdout()
//                             .queue(MoveLeft(1))?
//                             .queue(Print(" "))?
//                             .queue(MoveLeft(1))?;
//                         stdout().flush()?;
//                         friend_name.pop();
//                     }
//                 }
//                 KeyCode::Enter => {
//                     stdout().execute(Hide)?;
//                     break;
//                 },
//                 _ => {}
//             }
//         }
//     }
//     send_friend_request(game_main, friend_name).await?;
//     Ok(())
// }

// async fn send_delete_request(game_main: &Infos, friend_name: String) -> Result<()> {
//     let url = format!("https://{}/api/user/get_profile_name?profile_name={}", game_main.location, friend_name);
//     let response = game_main.client
//         .get(url)
//         .send()
//         .await?;
//     stdout()
//         .queue(MoveTo(2, HEIGHT - 1))?
//         .queue(Print("                                                                                    "))?
//         .queue(MoveTo(2, HEIGHT - 1))?;
//     stdout().flush()?;
//     match response.status().as_u16() {
//         200 => {
//             let body: serde_json::Value = response.json().await?;
//             let id = match body["id"].as_u64() {
//                 Some(id) => id,
//                 _ => {
//                     stdout().execute(Print("Error, friend does not exist"))?;
//                     return Ok(());
//                 }
//             };
//             let url = format!("https://{}/api/friends/remove/{}/{}", game_main.location, id, game_main.id);
//             match game_main.client
//                 .delete(url)
//                 .send()
//                 .await?
//                 .status()
//                 .as_u16() {
//                     200 => {stdout().execute(Print(format!("{} successfully deleted", friend_name)))?;},
//                     404 => {stdout().execute(Print("You are not friend with friend"))?;},
//                     _ => {stdout().execute(Print("Error deleting friend: Server Error"))?;}
//                 }
//         },
//         404 => {stdout().execute(Print("Error, friend does not exist"))?;},
//         _ => {stdout().execute(Print("Error adding friend: Server error"))?;}
//     }
//     sleep(Duration::from_secs(2));
//     Ok(())
// }



// fn set_display_friend_adding() -> Result<()> {
//     stdout()
//         .queue(cursor::MoveTo(2, HEIGHT - 1))?
//         .queue(Print("                                                                   "))?
//         .queue(cursor::MoveTo(2, HEIGHT - 1))?
//         .queue(Print("friend username: "))?
//         .queue(Show)?
//         .queue(SetCursorStyle::BlinkingUnderScore)?;
//     stdout().flush()?;
    
//     Ok(())
// }





/*
ce que je veux: 
un menu avec 1. your friends
2. chati =

MANAGE FRIENDS: 
--> See list of friends, type 1 to add, 2 to delete, 3 to dm, left if possible to go left, right to go right
LIST of friends : Menu en bas, sinon amis listés en deux colonnes



*/


// fn print_friends(&self, area: Rect, buf: &mut Buffer, friends: &Vec<(String, bool)>, index: &usize) -> Result<()> {
//     // stdout().execute(terminal::Clear(terminal::ClearType::All))?;
//     // borders()?;
//     // stdout()
//     //     .queue(cursor::MoveTo(WIDTH / 2 - 10, 2))?
//     //     .queue(Print("Your friends list"))?;
//     let mut printable: Vec<String> = vec![];
//     let mut i: usize = 0;
//     if index * 10 < friends.len() {
//         let mut str_tmp: String = String::new();
//         for element in &friends[index * 10..] {
//             if (index * 10 + i) as usize > friends.len() || i > 9 {
//                 break;
//             } else {
//                 str_tmp = element.0;
//                 // stdout()
//                 //     .queue(cursor::MoveTo(4, (i * 2 + 4) as u16))?
//                 //     .queue(Print(&element.0))?;
//                 if element.1 == false {
//                     // stdout()
//                     //     .queue(Print(" (Pending)"))?;
//                     str_tmp = str_tmp + " (Pending)";
//                 }
//             }
//             i += 1;
//         }
//     }
//     // if i == 10 && friends.len() > index * 10 + i {
//     //     stdout()
//     //         .queue(cursor::MoveTo(4, 24))?
//     //         .queue(Print("..."))?;
//     // }
//     // let menu = format!("Menu: 1. ADD   2. DELETE   3. DM   {} Previous   {} Next    ESC. Back", '←', '→');
//     // stdout()
//     //     .queue(cursor::MoveTo(2, HEIGHT - 1))?
//     //     .queue(Print(menu))?;
//     // stdout().flush()?;
//     Ok(())
// }