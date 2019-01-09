var Wireless = require('wireless');
var exec = require("child_process").exec;
var spawn = require("child_process").spawn;
var fs = require('fs');
var EventEmitter = require("events").EventEmitter;

var wifi = new EventEmitter();

var ENABLE_AP = "/bin/sh /home/view/current/bin/enable_ap.sh";
var DISABLE_AP = "/bin/sh /home/view/current/bin/disable_ap.sh";
var WIFI_SHUTDOWN = "sudo modprobe -r 8723bu";
var WIFI_POWERON = "sudo modprobe 8723bu";
var BT_RESET = "sudo rfkill block bluetooth; sudo modprobe -r btusb; sleep 2; sudo modprobe btusb; sudo rfkill unblock bluetooth";
var BT_BLOCK = "sudo rfkill block bluetooth;sudo modprobe -r btusb;";
var BT_UNBLOCK = "sudo modprobe btusb;sudo rfkill unblock bluetooth;";
var BT_DISABLE = BT_BLOCK;//"sudo modprobe -r btusb";
var BT_ENABLE = BT_RESET;//"sudo modprobe btusb";

var SYSTEM_WIFI_EVENTS = 'dmesg';//-w | grep "RTL871X: sta recv deauth reason code"';

var dualInterface = false;

var iw = new Wireless({ iface:'wlan0', iface2: dualInterface ? 'wlan1' : false, updateFrequency: 60, connectionSpyFrequency: 10 });

var hostapdConfigTemplate = "# Autogenerated by wifi.js\n\ninterface=wlan0\n\
ctrl_interface=/var/run/hostapd\n\
ssid={SSID}\n\
wpa=2\n\
wpa_passphrase={PASSPHRASE}\n\
country_code=US\n\
channel={CHANNEL}\n\
hw_mode=g\n\
wpa_key_mgmt=WPA-PSK\n\
wpa_pairwise=TKIP\n\
rsn_pairwise=CCMP\n\
auth_algs=1\n\
macaddr_acl=0\n\
wmm_enabled=1\n";

var HOSTAPD_CONFIG_PATH = "/etc/hostapd/hostapd.conf";

var list = {};
var listCallback = null;

var disableBtReset = false;

wifi.apMode = false;
wifi.enabled = false;
wifi.connected = false;
wifi.list = [];
wifi.btEnabled = false;
wifi.apName = "TL+VIEW";
wifi.apPass = "timelapse+";
wifi.invalidPassword = false;
wifi.lastNetwork = null;
wifi.lastPassword = null;
wifi.noReset = false;

var reconnect = "none";
var reconnectNetwork, reconnectPassword;

var sys_events_mon = spawn(SYSTEM_WIFI_EVENTS, ['-w'], {shell: true});
var startTime = Date.now();
var lastBtReset = Date.now() - 2 * 60 * 1000;
sys_events_mon.stdout.on('data', function(data) {
  if(Date.now() - startTime < 30000) return;
  var lines = data.toString().split('\n');
  for(var i = 0; i < lines.length; i++) {
	  var line = lines[i];
	  if(line.indexOf("RTL871X") !== -1) {
		  console.log("WIFI: system event: ", line);
		  var matches = line.toString().match(/sta recv deauth reason code\(([0-9]+)\)/);
		  if(matches && matches.length > 0) {
		  	var reasonCode = parseInt(matches[1]);
		  	console.log("WIFI: deauth reason code: ", reasonCode);
		  	if(reasonCode == 2) {
		  		wifi.invalidPassword = true;
				wifi.disconnect();
				wifi.emit("error", "Failed to connect: invalid Wifi password.  Please verify the password and try connecting again.");
		  	} else if(reasonCode == 3) {
				wifi.emit("error", "Wifi disconnected.  This is likely due to being out of range or the access point becoming unavailable.");
		  	} else if (reasonCode != 7) { // 7 happens when wifi is disabled
				wifi.emit("error", "Wifi disconnected with code: " + reasonCode);
		  	}
		  }
	  } else if(line.indexOf("Bluetooth:") !== -1) {
	  	if(wifi.btEnabled && line.indexOf("tx timeout") !== -1 && Date.now() - lastBtReset > 2 * 60 * 1000) { // this happens if the driver is somehow corrupted
	  		lastBtReset = Date.now();
	  		if(wifi.noReset) {
		  		wifi.disableBt(function(){
		  			wifi.enableBt();
		  		});
	  		} else {
	  			reconnect = "none";
	  			if(wifi.connected) {
	  				reconnect = "client";
	  				reconnectNetwork = wifi.lastNetwork;
	  				reconnectPassword = wifi.lastPassword;
	  			} else if(wifi.apMode) {
	  				reconnect = "apMode";	  				
	  			}
		  		wifi.powerCycle(function(){
		  			if(reconnect == "client") {
		  				wifi.connect(reconnectNetwork, reconnectPassword, function(){
				  			wifi.enableBt();
		  				});
		  			} else if(reconnect == "apMode") {
		  				wifi.enableAP(function(){
				  			wifi.enableBt();
		  				});
		  			} else {
		  				wifi.disableBt();
		  			}
		  		});
	  		}
	  	}
	  }
  }
});

function hostApdConfig(ssid, pass, channel, callback) {
	console.log("WIFI: configuring AP with SSID '" + ssid + "' on channel " + channel);
	var content = hostapdConfigTemplate.replace('{SSID}', ssid);
	content = content.replace('{CHANNEL}', channel.toString());
	content = content.replace('{PASSPHRASE}', pass.toString());
	fs.writeFile(HOSTAPD_CONFIG_PATH, content, function(err) {
		callback && callback(err);
	});
}

function powerControl(enable, callback) {
	if(wifi.power) {
		wifi.power.wifi(enable, callback);
	} else {
		if(enable) {
			exec(WIFI_POWERON, callback);
		} else {
			exec(WIFI_SHUTDOWN, callback);
		}
	}
}

function updateExportedList() {
	wifi.list = [];
	for(var i in list) {
		wifi.list.push(list[i]);
	}
}

iw.on('appear', function(network) {
	//console.log("[Wifi] Appear:", network);
	list[network.address] = network;
	updateExportedList();
	if(listCallback) listCallback(wifi.list);
});

iw.on('change', function(network) {
	//console.log("[Wifi] Change:", network);
	list[network.address] = network;
	updateExportedList();
});

iw.on('signal', function(network) {
	//console.log("[Wifi] Signal:", network);
	list[network.address] = network;
	updateExportedList();
});

iw.on('vanish', function(network) {
	//console.log("[Wifi] Vanish:", network);
	delete list[network.address];
	updateExportedList();
	if(listCallback) listCallback(wifi.list);
});

iw.on('error', function(err) {
	console.log("[Wifi] Error:", err);
});

iw.on('empty', function() {
	//console.log("[Wifi] Empty");
	list = {};
	wifi.list = [];
	if(listCallback) listCallback(wifi.list);
});

iw.on('join', function(data) {
	console.log("[Wifi] Join:", data);
	wifi.connected = data;
	wifi.emit("connect", data.ssid);
	if(dualInterface && wifi.connected.channel && wifi.apMode) {
		wifi.enableAP(); // resets the AP to use the current channel
	}
	if(!disableBtReset && wifi.btEnabled) {
	    wifi.resetBt(function(){
			wifi.emit("resetBt");
	    });
	}
});

iw.on('former', function(data) {
	console.log("[Wifi] Former:", data);
	wifi.connected = data;
	wifi.emit("connect", data.ssid);
});

iw.on('leave', function() {
	console.log("[Wifi] Leave");
	if(wifi.connected) {
		wifi.emit("disconnect", wifi.connected);
	}
	wifi.connected = false;
	if(!wifi.apMode) disableBtReset = true;
});

iw.on('stop', function() {
	console.log("[Wifi] Stop");
	wifi.scanning = false;
});

iw.on('command', function(cmd) {
	//console.log("[Wifi] Command: ", cmd);
});

wifi.listHandler = function(callback) {
	if(callback) {
		listCallback = callback;
		listCallback(wifi.list);
	} else {
		listCallback = null;
	}
}

wifi.scan = function() {
	iw.scanning = true;
	iw.start();
}

wifi.stop = function() {
	iw.scanning = false;
	iw.stop();
}

wifi.enableBt = function(cb) {
	disableBtReset = false;
	wifi.btEnabled = true;
	exec(BT_ENABLE, function(err) {
		wifi.emit("resetBt");
		if(cb) cb(err);
	});
}

wifi.disableBt = function(cb) {
	disableBtReset = false;
	wifi.btEnabled = false;
	exec(BT_DISABLE, function(err) {
		if(cb) cb(err);
	});
}

wifi.resetBt = function(cb) {
	disableBtReset = false;
	if(wifi.btEnabled) {
		exec(BT_RESET, function(err) {
			if(cb) cb(err);
		});
	} else {
		console.log("WIFI: bt disabled, not resetting");
	}
}

wifi.blockBt = function(cb) {
	disableBtReset = false;
	exec(BT_BLOCK, function(err) {
		if(cb) cb(err);
	});
}

wifi.unblockBt = function(cb) {
	disableBtReset = false;
	exec(BT_UNBLOCK, function(err) {
		if(cb) cb(err);
	});
}

wifi.powerCycle = function(cb) {
	disableBtReset = false;
	wifi.disable(function(){
		setTimeout(function(){
			wifi.enable(cb);
		}, 2000);
	}, true);
}

wifi.enable = function(cb) {
	disableBtReset = false;
	powerControl(true, function(err) {
		iw.enable(function(err) {
			if(!err) {
				if(!wifi.btEnabled) wifi.disableBt();
				exec("iw wlan0 set power_save off" + (dualInterface ? "; ifconfig wlan1 down" : ""), function(err) {
					wifi.enabled = true;
					wifi.emit('enabled', true);
					wifi.scan();
					if(cb) cb(err);
				});
			} else {
				console.log("Error Enabling WiFi:", err);
				if(cb) cb(err);
			}
		});
	});
}

wifi.disable = function(cb, disableEvents) {
	disableBtReset = false;
	var disable = function() {
		wifi.disconnect();
		wifi.stop();
		iw.disable(function(){
			if(!disableEvents) wifi.enabled = false;
			powerControl(false, function(err) {
				wifi.emit('disabled', !disableEvents);
				if(cb) cb(err);
			});
		});
	}
	if (wifi.apMode) {
		wifi.disableAP(disable);
	} else {
		disable();
	}
}

wifi.connect = function(network, password, callback) {
	if(!network) return callback && callback("no network specified");
	wifi.invalidPassword = false;
	disableBtReset = false;
	wifi.lastNetwork = network;
	wifi.lastPassword = password;
	var join = function() { 
		iw.join(network, password, function(){
			iw.dhcp(function(){
				if(callback) callback();
			});
		});
	};
	if(wifi.apMode && !dualInterface) {
		wifi.disableAP(function(){
			wifi.powerCycle(function(){
				setTimeout(join, 2000);
			});
		});		
	} else {
		wifi.disconnect(function() {
			setTimeout(join, 2000);
		});
	}
}

wifi.disconnect = function(callback) {
	disableBtReset = false;
	if(wifi.connected) {
		wifi.connected = false;
		wifi.emit("disconnect", false);
	}
	iw.dhcpStop(function(){
		//console.log("[Wifi] Stopped DHCP, leaving wifi network...")
		iw.leave(callback);
	});
}

wifi.enableAP = function(callback) {
	disableBtReset = false;
	var enableAP = function() {
		wifi.disconnect();
		wifi.stop();
		iw.disable(function(){
			wifi.apMode = true;
			var channel = (wifi.connected && wifi.connected.channel) ? wifi.connected.channel : 6;
			var ssid = wifi.apName || 'TL+VIEW';
			var pass = wifi.apPass || 'timelapse+';
			hostApdConfig(ssid, pass, channel, function(){
				exec(ENABLE_AP, function(err) {
					if(callback) callback(err);
					disableBtReset = false;
					console.log("WIFI: resetting bt after enabling AP");
				    if(wifi.btEnabled) {
					    wifi.resetBt(function(){
							wifi.emit("resetBt");
					    });
				    }
				});
			});
		});
	}
	if(wifi.apMode) {
		wifi.disableAP(function(){
			enableAP();
		});
	} else {
		if(dualInterface) {
			enableAP();
		} else {
			wifi.disconnect(function(){
				wifi.powerCycle(function(){
					enableAP();
				});
			})
		}
	}
}

wifi.setApName = function(apName) {
	if(!apName) return;
	wifi.apName = apName;
	if(wifi.apMode) {
		wifi.disableAP(function(){
			setTimeout(wifi.enableAP, 2000);
		});
	}
}

wifi.setApPass = function(apPass) {
	if(!apPass) return;
	wifi.apPass = apPass;
	if(wifi.apMode) {
		wifi.disableAP(function(){
			setTimeout(wifi.enableAP, 2000);
		});
	}
}

wifi.disableAP = function(callback) {
	wifi.apMode = false;
	//wifi.connected = false;
	exec(DISABLE_AP, function(err) {
		wifi.powerCycle(callback);
	});
}

module.exports = wifi;
