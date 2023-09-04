//
// Handling commands
//

export function doUserCommand(command_text, close_window) {
    // optional operation field is :<suffix> at end
    var hint_number = command_text;
    var operation   = "";
    var match	    = command_text.match(/^((?:[^:\{]|\{[^\}]*\})*):(.*)$/);
    if (match) {
	hint_number = match[1];
	operation   = match[2];
    }

    // send hint number and operation to content_script.js for current tab:
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
	// chrome.tabs.update(tabs[0].id, {selected: true});
	// chrome.tabs.update(tabs[0].id, {highlighted: true});
	// chrome.tabs.update(tabs[0].id, {active: true});
	chrome.tabs.sendMessage(tabs[0].id, 
				{hint_number: hint_number,
				 operation:   operation});
	if (close_window) {
	    // closing the pop up window ends its JavaScript execution
	    // so need to do it only after all done here
	    window.close();
	}
    });
}
