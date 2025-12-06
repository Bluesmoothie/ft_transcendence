import { MainUser } from './User.js';

document.getElementById("play_btn").addEventListener('click', () => {
	if (user.id == -1)
		window.location.href = (`${window.location.origin}/login`);
	else
		window.location.href = (`${window.location.origin}/lobby`);
});

var user: MainUser = new MainUser(document.getElementById("profile-container"), null, null);
await user.loginSession();

