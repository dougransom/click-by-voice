import * as option_storage from './option_storage.js';


// Saves options to chrome.storage.sync.
async function save_options() {
    var command = document.getElementById('command').value;
    var config  = document.getElementById('config').value;
    await option_storage.putSavedOptions({
	startingCommand: command,
	config:          config,
    });
    var current_starting_command = (await option_storage.getPerSessionOptions()).startingCommand;
    await option_storage.putPerSessionOptions({
	startingCommand: current_starting_command,
	config:          config,
    });
    // Update status to let user know options were saved.
    var status = document.getElementById('status');
    status.textContent = 'Options saved.';
    setTimeout(function() {
	status.textContent = '';
    }, 750);
}

// Restores shown options using the preferences stored in chrome.storage.sync.
async function restore_options() {
    let saved_options = await option_storage.getSavedOptions();
    document.getElementById('command').value = saved_options.startingCommand;
    document.getElementById('config').value  = saved_options.config;
}


document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click', save_options);
